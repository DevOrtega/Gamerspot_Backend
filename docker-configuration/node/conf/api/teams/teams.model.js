const mongoose = require('mongoose');

const TEAMSchemaOptions = {
	versionKey: false
}

const TEAMschema = mongoose.Schema({
    name: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user2'
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