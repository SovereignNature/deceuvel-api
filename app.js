const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
const gql_resolver = require('./graphql/resolvers.js');
const { loadSchemaSync } = require('@graphql-tools/load');
const { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader');
const csv = require('csv-parser');
const fs = require('fs');

const Soil = require('./models/SoilSample.js');

require('dotenv').config();

// Configure mongoDB
const mongo_url = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.MONGO_DATABASE_HOST}:${process.env.MONGO_DATABASE_PORT}/${process.env.MONGO_INITDB_DATABASE}`;

// Configure GraphQL
const gql_schema = loadSchemaSync('./graphql/schema.graphql', {
  loaders: [new GraphQLFileLoader()]
});

const graphql_http = graphqlHTTP({
  schema: gql_schema,
  rootValue: gql_resolver,
  graphiql: true,
});

// Configure App Server
const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use('/graphql', graphql_http); // graphql endpoint
app.get('/', (req, res) => res.send('Hello!') ); // root endpoint

app.get('/samples', async (req, res) => {
    var samples = await Soil.find();
    res.send(samples);
} ); // rest endpoint


// Insert data on the database on start if needed
async function fillDB() {
    const samples = await Soil.find();

    if(samples.length == 0) {

        var p1 = new Promise( (resolve, reject) => {
            var n_lines = 0;
            var aux_buffer = [];
            var last_row = undefined;

            const convertRow = (row) => {
                var aux = row.LOCATION.split(" ");
                return {
                    year: aux.shift().trim(),
                    location: aux.join(" ").trim(),
                    Cu: Number(row["Cu 2018-21"].replace(",", ".")),
                    Ni: Number(row["Ni 2018-21"].replace(",", ".")),
                    Pb: Number(row["Pb 2018-21"].replace(",", ".")),
                    Zn: Number(row["Zn 2018-21"].replace(",", ".")),
                    Cr: Number(row["Cr 2018-21"].replace(",", ".")),
                    Fe: Number(row["Fe 2018-21"].replace(",", ".")),
                    Mn: Number(row["Mn 2018-21"].replace(",", ".")),
                };
            };

            const mergeRows = (rows) => {
                var merged_row = {
                    year: undefined,
                    location: undefined,
                    Cu: 0.0,
                    Ni: 0.0,
                    Pb: 0.0,
                    Zn: 0.0,
                    Cr: 0.0,
                    Fe: 0.0,
                    Mn: 0.0,
                };
                var n = rows.length;

                while (rows.length > 0) {
                    var x = rows.shift();

                    if(merged_row.year == undefined) {
                        merged_row.year = x.year;
                    } else {
                        console.assert(merged_row.year == x.year);
                    }

                    if(merged_row.location == undefined) {
                        merged_row.location = x.location;
                    } else {
                        console.assert(merged_row.location == x.location);
                    }

                    if(merged_row.location == undefined) {
                        merged_row.location = x.location;
                    } else {
                        console.assert(merged_row.location == x.location);
                    }

                    merged_row.Cu += x.Cu;
                    merged_row.Ni += x.Ni;
                    merged_row.Pb += x.Pb;
                    merged_row.Zn += x.Zn;
                    merged_row.Cr += x.Cr;
                    merged_row.Fe += x.Fe;
                    merged_row.Mn += x.Mn;
                }

                merged_row.Cu /= n;
                merged_row.Ni /= n;
                merged_row.Pb /= n;
                merged_row.Zn /= n;
                merged_row.Cr /= n;
                merged_row.Fe /= n;
                merged_row.Mn /= n;

                return merged_row;
            };

            const insertRow = (row) => {
                const doc = Soil.create(row);

                n_lines++;
            };

            fs.createReadStream('./data/full_data.csv')
                .pipe(csv())
                .on('data', (raw_row) => {
                    row = convertRow(raw_row);

                    if( row.year == last_row?.year && row.location == last_row?.location ) {
                        aux_buffer.push(row);
                    } else {
                        if(aux_buffer.length > 0) {
                            // Merge entries
                            insertRow(mergeRows(aux_buffer));
                        }

                        insertRow(row);
                    }

                    last_row = row;
                })
                .on('end', () => {
                    if(aux_buffer.length > 0) {
                        // Merge entries
                        insertRow(mergeRows(aux_buffer));
                    }

                    resolve(n_lines);
                });
        } );

        var n_lines = await p1;
        console.log(`Filled DB with ${n_lines} entries.`);
    } else {
        console.log("DB already filled.");
    }
}

async function main() {
    // Connect to mongoDB
    await mongoose.connect(mongo_url);

    // Fill db if needed
    await fillDB();

    // Start App
    app.listen(process.env.APP_PORT, (err) => {
        if (err)
            console.log("Error in server setup!");
        else
            console.log(`App connected to port ${process.env.APP_PORT}.`)
    });
}

main();
