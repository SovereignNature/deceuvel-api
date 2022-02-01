const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const soilmania_elements_schema = new Schema({
    time: {type: Date, required: false},
    Al: {type: Number, required: false},
    As: {type: Number, required: false},
    B: {type: Number, required: false},
    Ca: {type: Number, required: false},
    Cd: {type: Number, required: false},
    Co: {type: Number, required: false},
    Cu: {type: Number, required: false},
    Fe: {type: Number, required: false},
    Hg: {type: Number, required: false},
    K: {type: Number, required: false},
    Mg: {type: Number, required: false},
    Mn: {type: Number, required: false},
    Mo: {type: Number, required: false},
    N: {type: Number, required: false},
    Na: {type: Number, required: false},
    Ni: {type: Number, required: false},
    P: {type: Number, required: false},
    Pb: {type: Number, required: false},
    S: {type: Number, required: false},
    Se: {type: Number, required: false},
    Si: {type: Number, required: false},
    Zn: {type: Number, required: false}
});

module.exports = mongoose.model('SoilManiaElements', soilmania_elements_schema);
