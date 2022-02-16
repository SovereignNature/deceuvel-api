const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const soil_schema = new Schema ({
    //time: {type: String, required: false},
    year: {type: Number, required: true},
    location: {type: String, required: true},
    //sample: {type: String, required: false},
    Cu: {type: Number, required: true, min: 0.0},
    Ni: {type: Number, required: true, min: 0.0},
    Pb: {type: Number, required: true, min: 0.0},
    Zn: {type: Number, required: true, min: 0.0},
    Cr: {type: Number, required: true, min: 0.0},
    Fe: {type: Number, required: true, min: 0.0},
    Mn: {type: Number, required: true, min: 0.0}
});

module.exports = mongoose.model('Soil', soil_schema);
