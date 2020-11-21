const mongoose = require("mongoose");

const GAMERSchemaOptions = {
  versionKey: false,
};

const GAMERschema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "User Public Name Can't Be Empty"],
    },
    bornDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "team",
    },
    sponsors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "sponsor",
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user2",
    },
  },
  GAMERSchemaOptions
);

const GAMER = mongoose.model("gamer", GAMERschema);

module.exports = GAMER;
