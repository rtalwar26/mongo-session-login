import { ISession } from "./db-schemas/Session";
import * as assert from "assert";
import { randomBytes } from "crypto";
import {
  SessionStatus,
  SessionDevice,
  ISessionModel,
} from "./db-schemas/Session";
import {
  AuthStepVerificationResult,
  LoginStrategy,
  OTPData,
} from "./LoginSessionConfig";

export default class NullLoginStrategy implements LoginStrategy {
  _type: string;
  get type(): string {
    return this._type;
  }
  constructor() {
    this._type = "NULL";
  }
  config = {
    first_factor_life: [15, "m"],
    second_factor_life: [15, "d"],
  };

  async generate_second_factor_OTP(session: ISessionModel): Promise<OTPData> {
    assert.ok(false, `Aborting! NullStrategy cannot be called`);

    return {
      two_fa_enabled: true,
      otp_secret: randomBytes(256).toString("hex"),
    };
  }
  getRandomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
  }

  async fetchUserId(sessionId: string): Promise<string> {
    return "NullStrategy<null>";
  }

  async initiate_first_factor(
    user_id: string,
    device?: SessionDevice
  ): Promise<ISession> {
    let sessionData: ISession = {
      type: this._type,
      status: SessionStatus.DISAPPROVED,
      value: user_id,
      device: device,
      expiring: Date.now(),
    };

    return sessionData;
  }

  async verify_first_factor(
    session: ISessionModel,
    paylaod: any,
    device?: SessionDevice
  ): Promise<AuthStepVerificationResult> {
    assert.ok(false, `Aborting! NullStrategy cannot be called`);

    return {
      expiring: Date.now(),
      status: SessionStatus.DISAPPROVED,
    };
  }

  async verify_second_factor(
    session: ISession,
    payload: any,
    device?: SessionDevice
  ): Promise<AuthStepVerificationResult> {
    assert.ok(false, `Aborting! NullStrategy cannot be called`);

    return {
      expiring: Date.now(),
      status: SessionStatus.DISAPPROVED,
    };
  }
}
