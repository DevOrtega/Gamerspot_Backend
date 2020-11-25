const mongoose = require('mongoose');

const USERSchemaOptions = {
	versionKey: false
}

const USERschema = mongoose.Schema({
    username: {
        type: String,
        required: [true, "User Username Can't Be Empty"],
        unique: [true, "Username Already Exists"],
        immutable: true
    },
    password: {
        type: String,
    },
    email: {
        type: String,
        required: [true, "User Email Can't Be Empty"],
        unique: [true, "User Email Already Exists"]
    },
    gamer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'gamer'
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team'
    },
    sponsor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sponsor'
    },
    country: {
        type: String,
        required: [true, "User Country Can't Be Empty"]
    },
    photoUrl: {
        type: String,
        default: ""
    },
    games: {
        type: [
            { gameName: String, gameUser: String }
        ],
    },
    links: {
        type: [
            { link: String }
        ],
    },
    biography: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'post'
        }
    ]
}, USERSchemaOptions);

const USER = mongoose.model('user2', USERschema);

module.exports = USER;