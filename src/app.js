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
const Air = require('./models/AirSample.js');
const SoilManiaParameters = require('./models/SoilManiaParameters.js');
const SoilManiaElements = require('./models/SoilManiaElements.js');

require('dotenv').config();

// Configure mongoDB
async function connectDB() {

    var env_vars = [
        "MONGO_INITDB_ROOT_USERNAME",
        "MONGO_INITDB_ROOT_PASSWORD",
        "MONGO_DATABASE_HOST",
        "MONGO_DATABASE_PORT",
        "MONGO_INITDB_DATABASE"
    ];

    env_vars.forEach((item, i) => {
        if( process.env.MONGO_INITDB_ROOT_USERNAME == null ) {
            throw `Env var ${item} not defined!`;
        }
    });

    const mongo_url = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.MONGO_DATABASE_HOST}:${process.env.MONGO_DATABASE_PORT}/${process.env.MONGO_INITDB_DATABASE}`;

    return mongoose.connect(mongo_url);
}

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

// graphql endpoint
app.use('/graphql', graphql_http);

 // root endpoint
app.get('/', (req, res) => {
    var html = "<!DOCTYPE html><html><body><h1>Hello!</h1>";

    var tag = process.env.IMG_TAG;
    if(tag) {
        html += `</p>${tag}</p>`;
    }

    html += "</body></html>\n";
    res.send(html);
});

/*app.get('/samples', async (req, res) => {
    var samples = await Soil.find();
    res.send(samples);
} );*/ // rest endpoint


// Insert data on the database on start if needed
async function fillSoilData() {
    return new Promise( async (resolve, reject) => {
        const samples = await Soil.find({}, null, {limit: 1});
        if(samples.length == 0) {
            var aux_buffer = [];
            var last_row = undefined;

            var to_insert = [];

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

            var file = './data/full_soil_data.csv'
            if (fs.existsSync(file)) {
                fs.createReadStream(file)
                    .pipe(csv())
                    .on('data', (raw_row) => {
                        row = convertRow(raw_row);

                        if( row.year == last_row?.year && row.location == last_row?.location ) {
                            aux_buffer.push(row);
                        } else {
                            if(aux_buffer.length > 0) {
                                // Merge entries
                                to_insert.push(mergeRows(aux_buffer));
                            }

                            to_insert.push(row);
                        }

                        last_row = row;
                    })
                    .on('end', async () => {
                        if(aux_buffer.length > 0) {
                            // Merge entries
                            to_insert.push(mergeRows(aux_buffer));
                        }

                        await Soil.create(to_insert);

                        console.log(`Filled DB with ${to_insert.length} soil entries.`);
                        resolve();
                    });
            } else {
                //console.log(`File ${file} does not exist.`);
                resolve();
            }
        } else {
            console.log("DB already filled with soil data.");
            resolve();
        }
    });
}

async function fillAirData() {
    return new Promise( async (resolve, reject) => {
        const samples = await Air.find({}, null, {limit: 1});
        if(samples.length == 0) {

            var files = [];

            if (fs.existsSync('historical_air_data.csv')) {
                files.push('historical_air_data.csv');
            }

            (await fs.promises.readdir('./data')).forEach( (item, i) => {
                if(item.includes("_Daily")) {
                    files.push(item);
                }
            });

            if(files.lenght > 0) {
                var promisses = [];
                files.forEach((item, i) => {
                    var path = './data/' + item;

                    promisses.push(new Promise( async (resolve2, reject2) => {
                        var n_lines = 0;

                        fs.createReadStream(path)
                            .pipe(csv({ separator: ';'}))
                            .on('data', async (row) => {
                                row['PM2_5'] = row['PM2.5'];
                                delete row['PM2.5'];
                                delete row[''];

                                n_lines++;

                                await Air.create(row);

                                delete row;
                            })
                            .on('end', () => {
                                // console.log(path + " finished! " + n_lines);
                                resolve2(n_lines);
                            });
                    }));
                });
                var n_lines = (await Promise.all(promisses)).reduce((a, b) => a+b);

                console.log(`Filled DB with ${n_lines} air entries.`);
                resolve();
            } else {
                //console.log(`File ${file} does not exist.`);
                resolve();
            }
        } else {
            console.log("DB already filled with air data.");
            resolve();
        }
    });
}

async function fillSoilManiaParameters() {
    return new Promise( async (resolve, reject) => {
        const samples = await SoilManiaParameters.find({}, null, {limit: 1});
        if(samples.length == 0) {
            // Insert Data
            var to_insert = [];

            var file = './data/soilmania_soil_parameters.csv'
            if (fs.existsSync(file)) {
                fs.createReadStream(file)
                    .pipe(csv({ separator: ';'}))
                    .on('data', (raw_row) => {
                        var row = {
                            time: new Date(raw_row.Date + " " + raw_row.Time).toISOString(),
                            acidity: Number(raw_row["Acidity ()"]),
                            oxygen_index: Number(raw_row["Oxygen Index ()"]),
                            soil_conductivity: Number(raw_row["Soil conductivity (mS)"]),
                            soil_moisture: Number(raw_row["Soil moisture (%)"]),
                            soil_temperature: Number(raw_row["Soil temperature (°C)"])
                        };
                        to_insert.push(row);
                    })
                    .on('end', async () => {
                        await SoilManiaParameters.create(to_insert);

                        console.log(`Filled DB with ${to_insert.length} soilmania parameters entries.`);

                        delete to_insert;

                        resolve();
                    });
            } else {
                resolve();
            }
        } else {
            console.log("DB already filled with soilmania parameters data.");
            resolve();
        }
    });
}

async function fillSoilManiaElements() {
    return new Promise( async (resolve, reject) => {
        const samples = await SoilManiaElements.find({}, null, {limit: 1});
        if(samples.length == 0) {
            // Insert Data
            var to_insert = [];

            var file = './data/soilmania_element_availability.csv'
            if (fs.existsSync(file)) {
                fs.createReadStream(file)
                    .pipe(csv({ separator: ';'}))
                    .on('data', (raw_row) => {
                        var row = {
                            time: new Date(raw_row.Date + " " + raw_row.Time).toISOString(),
                            Al: Number(raw_row["Al ()"]),
                            As: Number(raw_row["As ()"]),
                            B: Number(raw_row["B ()"]),
                            Ca: Number(raw_row["Ca ()"]),
                            Cd: Number(raw_row["Cd ()"]),
                            Co: Number(raw_row["Co ()"]),
                            Cu: Number(raw_row["Cu ()"]),
                            Fe: Number(raw_row["Fe ()"]),
                            Hg: Number(raw_row["Hg ()"]),
                            K: Number(raw_row["K ()"]),
                            Mg: Number(raw_row["Mg ()"]),
                            Mn: Number(raw_row["Mn ()"]),
                            Mo: Number(raw_row["Mo ()"]),
                            N: Number(raw_row["N ()"]),
                            Na: Number(raw_row["Na ()"]),
                            Ni: Number(raw_row["Ni ()"]),
                            P: Number(raw_row["P ()"]),
                            Pb: Number(raw_row["Pb ()"]),
                            S: Number(raw_row["S ()"]),
                            Se: Number(raw_row["Se ()"]),
                            Si: Number(raw_row["Si ()"]),
                            Zn: Number(raw_row["Zn ()"]),
                        };
                        to_insert.push(row);
                    })
                    .on('end', async () => {
                        await SoilManiaElements.create(to_insert);

                        console.log(`Filled DB with ${to_insert.length} soilmania element entries.`);

                        delete to_insert;

                        resolve();
                    });
            } else {
                resolve();
            }
        } else {
            console.log("DB already filled with soilmania element data.");
            resolve();
        }
    });
}

async function fillDB() {

    if (fs.existsSync("./data")) {
        return Promise.all([
            fillSoilData(),
            fillAirData(),
            fillSoilManiaParameters(),
            fillSoilManiaElements()
        ]);
    } else {
        console.log('Directory ./data not found!');
    }
}

async function main() {
    // Connect to mongoDB
    await connectDB();

    // Fill db if needed
    await fillDB();

    // Start App
    const port = 80; // process.env.APP_PORT
    app.listen(port, (err) => {
        if (err)
            console.log("Error in server setup!");
        else
            console.log(`App connected to port ${port}.`)
    });
}
main();
