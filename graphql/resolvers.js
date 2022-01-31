const Soil = require('../models/SoilSample.js');
const Air = require('../models/AirSample.js');

async function fetchData(collection) {
    var samples = await collection.find();

    samples = samples.map( (q) => {
        var x = {...q._doc, /*_id: q._id.toString()*/};
        delete x._id;
        delete x._v;
        return x;
    });

    return samples;
}

module.exports = {
    soil_samples: async () => fetchData(Soil),
    air_samples: async () => fetchData(Air)
}
