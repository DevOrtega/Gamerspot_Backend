const mongoose = require('mongoose');

var TWEETschemaOptions = {
	versionKey: false
}

var TWEETschema = mongoose.Schema({
    text: {
        type: String,
        required: [true, "Tweet Text Can't Be Empty"]
    },
    createdAt: Number
}, TWEETschemaOptions);

var TWEET = mongoose.model('tweet', TWEETschema);

module.exports = TWEET;