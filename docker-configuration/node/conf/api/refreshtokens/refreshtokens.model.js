const mongoose = require('mongoose');

const REFRESHTOKENSchemaOptions = {
	versionKey: false
}

const REFRESHTOKENSchema = mongoose.Schema({
    refresh_token: String,
    access_token: {username: String, token: String}
}, REFRESHTOKENSchemaOptions);

const REFRESHTOKEN = mongoose.model('refreshtoken', REFRESHTOKENSchema);

module.exports = REFRESHTOKEN;
