const mongoose = require('mongoose');

const SPONSORSchemaOptions = {
	versionKey: false
}

const SPONSORschema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Sponsor Public Name Can't Be Empty"]
    },
    players: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'gamer'
        }
    ],
    teams: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'team'
        }
    ],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    }
}, SPONSORSchemaOptions);

const SPONSOR = mongoose.model('sponsor', SPONSORschema);

module.exports = SPONSOR;