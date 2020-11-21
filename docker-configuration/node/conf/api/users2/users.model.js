const mongoose = require('mongoose');

const USERSchemaOptions = {
	versionKey: false
}

const GAMELISTSchema = mongoose.Schema({ gameName: String, gameUser: String });
const LINKLISTSchema = mongoose.Schema({ link: String });
const USERschema = mongoose.Schema({
    username: {
        type: String,
        required: [true, "User Username Can't Be Empty"],
        unique: [true, "Username Already Exists"],
        immutable: true
    },
    email: {
        type: String,
        required: [true, "User Email Can't Be Empty"],
        unique: [true, "User Email Already Exists"]
    },
    password: {
        type: String,
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
    gameList: {
        type: [GAMELISTSchema],
    },
    linkList: {
        type: [LINKLISTSchema],
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
    postsId: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'post'
        }
    ]
}, USERSchemaOptions);

const USER = mongoose.model('user2', USERschema);

module.exports = USER;