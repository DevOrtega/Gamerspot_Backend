const mongoose = require('mongoose');

const TAGschemaOptions = {
	versionKey: false
}

const TAGschema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Tag Name Can't Be Empty"],
        unique: [true, "Tag Name Must Be Unique"]
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
}, TAGschemaOptions);

const TAG = mongoose.model('tag', TAGschema);

module.exports = TAG;