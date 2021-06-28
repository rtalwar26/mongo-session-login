import Session, { ISession } from "../db-schemas/Session";
import * as crypto from "crypto";
import {
  LoginStrategy,
  OTPData,
  AuthStepVerificationResult,
} from "../LoginSessionConfig";
import * as moment from "moment-timezone";
import {
  SessionStatus,
  SessionDevice,
  ISessionModel,
} from "../db-schemas/Session";

import User from "./User";

const challenge_expiry_in_secs = 300;
const assert = require("assert");
export default class UserLoginStrategy implements LoginStrategy {
  _type: string;
  get type(): string {
    return this._type;
  }
  constructor() {
    this._type = "USER"; // Remember to hardcode a unique type to every instance of LoginStrategy interface.
  }
  config = {
    first_factor_life: [15, "m"],
    second_factor_life: [15, "d"],
  };

  getRandomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
  }

  async fetchUserId(sessionId: string): Promise<string> {
    let query = {
      _id: sessionId,
      type: this._type,
      status: { $in: [SessionStatus.FA_2_VERIFIED] },
      expiring: {
        $gt: Date.now(),
      },
    };
    let s: any = await Session.findOne(query).lean().exec();
    assert.ok(s, "Invalid Session. Session expired.");
    return s.value;
  }

  async initiate_first_factor(
    user_id: string,
    device?: SessionDevice
  ): Promise<ISession> {
    assert.ok(user_id, "User not found");

    let sessionData: ISession = {
      type: this._type,
      status: SessionStatus.FA_1_INITIATED,
      value: user_id,
      device: device,
      expiring: Date.now() + challenge_expiry_in_secs,
    };

    return sessionData;
  }

  async verify_first_factor(
    session: ISessionModel,
    payload: any,
    device?: SessionDevice
  ): Promise<AuthStepVerificationResult> {
    assert.ok(
      session?.device?.ip === device?.ip,
      `Session not initiated for this device ip`
    );

    assert.ok(
      session.status === SessionStatus.FA_1_INITIATED,
      `Session status must be ${SessionStatus.FA_1_INITIATED}`
    );

    return {
      expiring: moment()
        .add(...this.config.first_factor_life)
        .valueOf(),
      status: SessionStatus.FA_1_VERIFIED,
    };
  }
  async generate_second_factor_OTP(session: ISessionModel): Promise<OTPData> {
    assert.ok(
      session.status === SessionStatus.FA_1_VERIFIED,
      `Session status must be ${SessionStatus.FA_1_VERIFIED} but found ${session.status}`
    );
    let user = await User.findById(session.value, "mobile").exec();
    let otp = crypto.randomBytes(8);
    let otpStr = otp.toString("hex");
    await Session.updateOne(
      { _id: (<any>session)._id },
      {
        $set: { "details.otp_secret": otpStr },
        status: SessionStatus.FA_2_INITIATED,
      }
    ).exec();
    return { otp_secret: otpStr, mobile: user?.mobile };
  }
  async verify_second_factor(
    session: ISession,
    payload: any,
    device?: SessionDevice
  ): Promise<AuthStepVerificationResult> {
    let { otp_secret } = payload;

    assert.ok(
      session.status === SessionStatus.FA_2_INITIATED,
      `Session status must be ${SessionStatus.FA_2_INITIATED}`
    );

    assert.ok(
      session.details &&
        session.details.otp_secret &&
        session.details.otp_secret.length > 0,
      "No otp_secret attached to the session. Aborting!"
    );

    assert.ok(
      session?.device?.ip === device?.ip,
      `Session not initiated for this device`
    );

    let isCorrect = otp_secret === session?.details?.otp_secret;
    assert(isCorrect, "Invalid otp_secret. Aborting!");

    return {
      expiring: moment()
        .add(...this.config.second_factor_life)
        .valueOf(),
      status: SessionStatus.FA_2_VERIFIED,
    };
  }
}
