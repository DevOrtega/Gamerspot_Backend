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
        required: [true, "User Email Can't Be Empty"]
    },
    password: {
        type: String,
    },
    role: {
        type: String,
        enum: ['Gamer', 'Team', 'Sponsor'],
        required: [true, "User Role Can't Be Empty"],
        immutable: true
    },
    name: {
        type: String,
        required: [true, "User Public Name Can't Be Empty"]
    },
    country: {
        type: String,
        required: [true, "User Country Can't Be Empty"]
    },
    bornDate: {
        type: Date
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

const USER = mongoose.model('user', USERschema);

module.exports = USER;