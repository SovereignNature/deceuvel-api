const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const air_schema = new Schema({
    time: {type: Date, required: false},
    number: {type: Number, required: true},
    airpressure: {type: Number, required: false},
    humidity: {type: Number, required: false},
    temperature: {type: Number, required: false},
    winddirection: {type: Number, required: false},
    windspeed: {type: Number, required: false},
    CO: {type: Number, required: false},
    CO2: {type: Number, required: false},
    NH3: {type: Number, required: false},
    NO: {type: Number, required: false},
    NO2: {type: Number, required: false},
    O3: {type: Number, required: false},
    PM10: {type: Number, required: false},
    PM2_5: {type: Number, required: false},
    SO2: {type: Number, required: false}
});

module.exports = mongoose.model('Air', air_schema);
