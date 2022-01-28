const Soil = require('../models/SoilSample.js');

module.exports = {
    samples: async () => {
        var samples = await Soil.find();

        console.log(samples.length);

        samples = samples.map( (q) => {
            var x = {...q._doc, /*_id: q._id.toString()*/};
            delete x._id;
            delete x._v;
            return x;
        });

        console.log(samples);

        return samples;
    }
}
