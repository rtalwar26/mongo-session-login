"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Session_1 = require("../db-schemas/Session");
const crypto = require("crypto");
const moment = require("moment-timezone");
const Session_2 = require("../db-schemas/Session");
const User_1 = require("./User");
const challenge_expiry_in_secs = 300;
const assert = require("assert");
class UserLoginStrategy {
    constructor() {
        this.config = {
            first_factor_life: [15, "m"],
            second_factor_life: [15, "d"],
        };
        this._type = "USER"; // Remember to hardcode a unique type to every instance of LoginStrategy interface.
    }
    get type() {
        return this._type;
    }
    getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }
    async fetchUserId(sessionId) {
        let query = {
            _id: sessionId,
            type: this._type,
            status: { $in: [Session_2.SessionStatus.FA_2_VERIFIED] },
            expiring: {
                $gt: Date.now(),
            },
        };
        let s = await Session_1.default.findOne(query).lean().exec();
        assert.ok(s, "Invalid Session. Session expired.");
        return s.value;
    }
    async initiate_first_factor(user_id, device) {
        assert.ok(user_id, "User not found");
        let sessionData = {
            type: this._type,
            status: Session_2.SessionStatus.FA_1_INITIATED,
            value: user_id,
            device: device,
            expiring: Date.now() + challenge_expiry_in_secs,
        };
        return sessionData;
    }
    async verify_first_factor(session, payload, device) {
        var _a;
        assert.ok(((_a = session === null || session === void 0 ? void 0 : session.device) === null || _a === void 0 ? void 0 : _a.ip) === (device === null || device === void 0 ? void 0 : device.ip), `Session not initiated for this device ip`);
        assert.ok(session.status === Session_2.SessionStatus.FA_1_INITIATED, `Session status must be ${Session_2.SessionStatus.FA_1_INITIATED}`);
        return {
            expiring: moment()
                .add(...this.config.first_factor_life)
                .valueOf(),
            status: Session_2.SessionStatus.FA_1_VERIFIED,
        };
    }
    async generate_second_factor_OTP(session) {
        assert.ok(session.status === Session_2.SessionStatus.FA_1_VERIFIED, `Session status must be ${Session_2.SessionStatus.FA_1_VERIFIED} but found ${session.status}`);
        let user = await User_1.default.findById(session.value, "mobile").exec();
        let otp = crypto.randomBytes(8);
        let otpStr = otp.toString("hex");
        await Session_1.default.updateOne({ _id: session._id }, {
            $set: { "details.otp_secret": otpStr },
            status: Session_2.SessionStatus.FA_2_INITIATED,
        }).exec();
        return { otp_secret: otpStr, mobile: user === null || user === void 0 ? void 0 : user.mobile };
    }
    async verify_second_factor(session, payload, device) {
        var _a, _b;
        let { otp_secret } = payload;
        assert.ok(session.status === Session_2.SessionStatus.FA_2_INITIATED, `Session status must be ${Session_2.SessionStatus.FA_2_INITIATED}`);
        assert.ok(session.details &&
            session.details.otp_secret &&
            session.details.otp_secret.length > 0, "No otp_secret attached to the session. Aborting!");
        assert.ok(((_a = session === null || session === void 0 ? void 0 : session.device) === null || _a === void 0 ? void 0 : _a.ip) === (device === null || device === void 0 ? void 0 : device.ip), `Session not initiated for this device`);
        let isCorrect = otp_secret === ((_b = session === null || session === void 0 ? void 0 : session.details) === null || _b === void 0 ? void 0 : _b.otp_secret);
        assert(isCorrect, "Invalid otp_secret. Aborting!");
        return {
            expiring: moment()
                .add(...this.config.second_factor_life)
                .valueOf(),
            status: Session_2.SessionStatus.FA_2_VERIFIED,
        };
    }
}
exports.default = UserLoginStrategy;
