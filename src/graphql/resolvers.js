const Soil = require('../models/SoilSample.js');
const Air = require('../models/AirSample.js');
const SoilManiaParameters = require('../models/SoilManiaParameters.js');
const SoilManiaElement = require('../models/SoilManiaElements.js');

async function fetchData(collection, filter, projection, options) {

    var samples = await collection.find(filter, projection, options);

    samples = samples.map( (q) => {
        var x = {...q._doc, /*_id: q._id.toString()*/};
        delete x._id;
        delete x._v;

        if(x.time) x.time = new Date(x.time).toISOString();

        return x;
    });

    return samples;
}

module.exports = {
    soil_samples: async (args) => {
        var filter = {};

        if(args.location) filter.location = args.location;
        if(args.start_year||args.end_year) filter.year = {};
        if(args.start_year) filter.year.$gte = args.start_year;
        if(args.end_year) filter.year.$lte = args.end_year;

        return fetchData(Soil, filter, null, {limit: args.amount})
    },
    air_samples: async (args) => {
        var filter = {};

        if(args.start||args.end) filter.time = {};
        if(args.start) filter.time.$gte = args.start;
        if(args.end) filter.time.$lte = args.end;

        return fetchData(Air, filter, null, {limit: args.amount})
    },
    soilmania_parameters: async (args) => {
        var filter = {};

        if(args.start||args.end) filter.time = {};
        if(args.start) filter.time.$gte = args.start;
        if(args.end) filter.time.$lte = args.end;

        return fetchData(SoilManiaParameters, filter, null, {limit: args.amount})
    },
    soilmania_elements: async (args) => {
        var filter = {};

        if(args.start||args.end) filter.time = {};
        if(args.start) filter.time.$gte = args.start;
        if(args.end) filter.time.$lte = args.end;

        return fetchData(SoilManiaElement, filter, null, {limit: args.amount})
    }
}
