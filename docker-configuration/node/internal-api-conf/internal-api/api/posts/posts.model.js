const mongoose = require('mongoose');

const POSTschemaOptions = {
	versionKey: false
}

const POSTschema = mongoose.Schema({
    text: {
        type: String,
        required: [true, "Post Text Can't Be Empty"]
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user2'
    }
}, POSTschemaOptions);

const POST = mongoose.model('post', POSTschema);

module.exports = POST;