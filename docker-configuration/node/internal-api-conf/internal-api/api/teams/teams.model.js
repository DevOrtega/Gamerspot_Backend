const mongoose = require('mongoose');

const TEAMSchemaOptions = {
	versionKey: false
}

const TEAMschema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "User Public Name Can't Be Empty"]
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    players: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'gamer'
        }
    ],
    sponsors: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'sponsor'
        }
    ],
    
}, TEAMSchemaOptions);

const TEAM = mongoose.model('team', TEAMschema);

module.exports = TEAM;