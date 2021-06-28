"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
let Schema = mongoose.Schema;
let mySchema = new Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    approval_status: { type: String, required: true },
    roles: { type: [String] },
    settings: {
        two_fa_enabled: { type: mongoose.SchemaTypes.Boolean, default: false },
    },
});
exports.default = mongoose.model("mongo_session_login_test_users", mySchema);
