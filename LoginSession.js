"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const Session_1 = require("./db-schemas/Session");
const AppConstants_1 = require("./constants/AppConstants");
const JWTAdapter_1 = require("./auth/JWTAdapter");
const not_initiated_session_id = "not_initiated";
class LoginSession {
    constructor(strategy, jwt_private_key, jwt_public_key) {
        this._id = not_initiated_session_id;
        this._jwt_private_key = jwt_private_key;
        this._jwt_public_key = jwt_public_key;
        this.strategy = strategy;
    }
    async generate_session_token(expiresIn) {
        return JWTAdapter_1.default.sign({ session: this.id() }, expiresIn, this._jwt_private_key);
    }
    async verify_jwt_token(token) {
        JWTAdapter_1.default.verify(token, this._jwt_public_key);
    }
    id() {
        assert.ok(this._id !== not_initiated_session_id, `Session not initiated, please call 'initiateForUserId'`);
        return this._id;
    }
    static async remove_expired_sessions() {
        return Session_1.default.remove({ expiring: { $lt: Date.now() } });
    }
    set_session_id(id) {
        assert.ok(this._id === not_initiated_session_id, `Aborting! Please create a new LoginSession Object as this object is already associated with another session`);
        this._id = id;
    }
    async fetchUserId(token) {
        assert.ok(this._id === not_initiated_session_id, `Aborting! Please create a new LoginSession Object as this object is already associated with another session`);
        let decoded = await JWTAdapter_1.default.verify(token, this._jwt_public_key);
        let session = decoded.session;
        return this.strategy.fetchUserId(session);
    }
    async initiate_first_factor(userId, device) {
        let sessionData = await this.strategy.initiate_first_factor({ _id: userId }, device);
        try {
            let se = await new Session_1.default(sessionData).save();
            this._id = se._id.toString();
        }
        catch (err) {
            console.error(err);
        }
        return this;
    }
    static async get(id) {
        let session = await Session_1.default.findById(id).lean().exec();
        assert(session, "Session not found");
        let isActive = session.expiring > Date.now();
        !isActive && (await LoginSession.removeSession(id));
        assert(isActive, "Session Expired and Deleted.");
        return session;
    }
    async verify_second_factor(payload, device) {
        let session = await LoginSession.get(this._id);
        try {
            let veirficationResult = await this.strategy.verify_second_factor(session, payload, device);
            return this.update_session_status(veirficationResult);
        }
        catch (e) {
            await this.removeSession();
            throw e;
        }
    }
    static async removeSession(id) {
        let removed = await Session_1.default.remove({ _id: id }).exec();
        return removed.nRemoved === 1 ? true : false;
    }
    async generate_second_factor_OTP() {
        let session = await LoginSession.get(this._id);
        return this.strategy.generate_second_factor_OTP(session);
    }
    async verify_first_factor(payload, device) {
        let session = await LoginSession.get(this._id);
        try {
            let verificationResult = await this.strategy.verify_first_factor(session, payload, device);
            await this.update_session_status(verificationResult);
            return JWTAdapter_1.default.sign({ session: this._id }, AppConstants_1.TokenExpiration.year1, this._jwt_private_key);
        }
        catch (e) {
            await this.removeSession();
            throw e;
        }
    }
    async update_session_status(verify_result) {
        let modified = await Session_1.default.updateOne({ _id: this._id }, {
            $set: {
                expiring: verify_result.expiring,
                status: verify_result.status,
            },
        }).exec();
        return modified.nModified === 1 ? true : false;
    }
    async removeSession() {
        let removed = await Session_1.default.remove({ _id: this._id }).exec();
        return removed.nRemoved === 1 ? false : false;
    }
}
exports.default = LoginSession;
