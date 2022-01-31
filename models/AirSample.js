const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const air_schema = new Schema({
    time: {type: String, required: true},
    number: {type: Number, required: true},
    airpressure: {type: Number, required: true},
    humidity: {type: Number, required: true},
    temperature: {type: Number, required: true},
    winddirection: {type: Number, required: true},
    windspeed: {type: Number, required: true},
    CO: {type: Number, required: true},
    CO2: {type: Number, required: true},
    NH3: {type: Number, required: true},
    NO: {type: Number, required: true},
    NO2: {type: Number, required: true},
    O3: {type: Number, required: true},
    PM10: {type: Number, required: true},
    "PM2.5": {type: Number, required: true},
    SO2: {type: Number, required: true}
});

module.exports = mongoose.model('Air', air_schema);
