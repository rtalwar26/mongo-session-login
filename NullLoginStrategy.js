"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const crypto_1 = require("crypto");
const Session_1 = require("./db-schemas/Session");
class NullLoginStrategy {
    constructor() {
        this.config = {
            first_factor_life: [15, "m"],
            second_factor_life: [15, "d"],
        };
        this._type = "NULL";
    }
    get type() {
        return this._type;
    }
    async generate_second_factor_OTP(session) {
        assert.ok(false, `Aborting! NullStrategy cannot be called`);
        return {
            two_fa_enabled: true,
            otp_secret: crypto_1.randomBytes(256).toString("hex"),
        };
    }
    getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }
    async fetchUserId(sessionId) {
        return "NullStrategy<null>";
    }
    async initiate_first_factor(user_id, device) {
        let sessionData = {
            type: this._type,
            status: Session_1.SessionStatus.DISAPPROVED,
            value: user_id,
            device: device,
            expiring: Date.now(),
        };
        return sessionData;
    }
    async verify_first_factor(session, paylaod, device) {
        assert.ok(false, `Aborting! NullStrategy cannot be called`);
        return {
            expiring: Date.now(),
            status: Session_1.SessionStatus.DISAPPROVED,
        };
    }
    async verify_second_factor(session, payload, device) {
        assert.ok(false, `Aborting! NullStrategy cannot be called`);
        return {
            expiring: Date.now(),
            status: Session_1.SessionStatus.DISAPPROVED,
        };
    }
}
exports.default = NullLoginStrategy;
