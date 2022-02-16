const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const soilmania_parameters_schema = new Schema({
    time: {type: Date, required: false},
    acidity: {type: Number, required: false},
    oxygen_index: {type: Number, required: false},
    soil_conductivity: {type: Number, required: false},
    soil_moisture: {type: Number, required: false},
    soil_temperature: {type: Number, required: false},
});

module.exports = mongoose.model('SoilManiaParameters', soilmania_parameters_schema);
