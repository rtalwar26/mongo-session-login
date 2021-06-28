"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStatus = void 0;
/**
 * Created by rohittalwar on 01/06/16.
 */
const mongoose = require("mongoose");
const mongo_sanitize_save_1 = require("mongo-sanitize-save");
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["FA_1_INITIATED"] = "FA_1_INITIATED";
    SessionStatus["FA_1_VERIFIED"] = "FA_1_VERIFIED";
    SessionStatus["FA_2_INITIATED"] = "FA_1_VERIFIED";
    SessionStatus["FA_2_VERIFIED"] = "FA_2_VERIFIED";
    SessionStatus["DISAPPROVED"] = "DISAPPROVED";
})(SessionStatus = exports.SessionStatus || (exports.SessionStatus = {}));
let Schema = mongoose.Schema;
let detailSchema = new Schema({
    otp_secret: { type: String },
    pow_secret: { type: String },
    pow_salt: { type: String },
    pow_hash_prefix: { type: String },
    otp_done: { type: Boolean },
});
let deviceSchema = new Schema({
    ip: { type: String },
    location: { type: String },
    hardware: { type: String },
    os: { type: String },
    app_version: { type: String },
    redirect_link: { type: String },
});
let mySchema = new Schema({
    expiring: { type: Number, required: true },
    status: { type: String, required: true },
    value: { type: String, required: true },
    type: { type: String, required: true },
    details: { type: detailSchema },
    device: { type: deviceSchema },
    //when otp is being verified, pending_otp field needs to be set to null to mark the session as verified
});
mongo_sanitize_save_1.sanitizeSchema(detailSchema);
mongo_sanitize_save_1.sanitizeSchema(mySchema);
mongo_sanitize_save_1.sanitizeSchema(deviceSchema);
exports.default = mongoose.model("sessions", mySchema);
