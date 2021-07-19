import * as assert from "assert";
import Session, { SessionDevice } from "./db-schemas/Session";

import {
  OTPData,
  LoginStrategy,
  AuthStepVerificationResult,
} from "./LoginSessionConfig";
import { ISessionModel } from "./db-schemas/Session";
import { TokenExpiration } from "./constants/AppConstants";
import JWTAdapter from "./auth/JWTAdapter";

const not_initiated_session_id = "not_initiated";
export default class LoginSession {
  private _id: string = not_initiated_session_id;
  private _jwt_private_key: string;
  private _jwt_public_key: string;
  private strategy: LoginStrategy;

  constructor(
    strategy: LoginStrategy,
    jwt_private_key: string,
    jwt_public_key: string
  ) {
    this._jwt_private_key = jwt_private_key;
    this._jwt_public_key = jwt_public_key;
    this.strategy = strategy;
  }
  async generate_session_token(
    expiresIn:
      | "1m"
      | "5m"
      | "15m"
      | "30m"
      | "1h"
      | "6h"
      | "12h"
      | "1d"
      | "2d"
      | "3d"
      | "5d"
      | "10d"
      | "30d"
      | "365d"
  ): Promise<string | undefined> {
    return JWTAdapter.sign(
      { session: this.id() },
      expiresIn,
      this._jwt_private_key
    );
  }

  async verify_jwt_token(token: string): Promise<any | { session: string }> {
    JWTAdapter.verify(token, this._jwt_public_key);
  }

  id(): string {
    assert.ok(
      this._id !== not_initiated_session_id,
      `Session not initiated, please call 'initiateForUserId'`
    );
    return this._id;
  }

  static async remove_expired_sessions(): Promise<any> {
    return Session.remove({ expiring: { $lt: Date.now() } });
  }

  set_session_id(id: string) {
    assert.ok(
      this._id === not_initiated_session_id,
      `Aborting! Please create a new LoginSession Object as this object is already associated with another session`
    );
    this._id = id;
  }
  async fetchUserId(token: string): Promise<string> {
    assert.ok(
      this._id === not_initiated_session_id,
      `Aborting! Please create a new LoginSession Object as this object is already associated with another session`
    );
    let decoded = await JWTAdapter.verify(token, this._jwt_public_key);
    let session = decoded.session;

    return this.strategy.fetchUserId(session);
  }

  async initiate_first_factor(
    userId: string,
    device?: SessionDevice
  ): Promise<LoginSession> {
    let sessionData = await this.strategy.initiate_first_factor(
      <any>{ _id: userId },
      device
    );
    try {
      let se = await new Session(sessionData).save();
      this._id = se._id.toString();
    } catch (err) {
      console.error(err);
    }
    return this;
  }

  static async get(id: string): Promise<ISessionModel> {
    let session: any = await Session.findById(id).lean().exec();

    assert(session, "Session not found");
    let isActive = session.expiring > Date.now();
    !isActive && (await LoginSession.removeSession(id));
    assert(isActive, "Session Expired and Deleted.");

    return session;
  }

  async verify_second_factor(
    payload: any,
    device?: SessionDevice
  ): Promise<any> {
    let session = await LoginSession.get(this._id);
    try {
      let veirficationResult = await this.strategy.verify_second_factor(
        session,
        payload,
        device
      );
      return this.update_session_status(veirficationResult);
    } catch (e) {
      await this.removeSession();
      throw e;
    }
  }

  private static async removeSession(id: string) {
    let removed: any = await Session.remove({ _id: id }).exec();
    return removed.nRemoved === 1 ? true : false;
  }

  async generate_second_factor_OTP(): Promise<OTPData> {
    let session = await LoginSession.get(this._id);
    return this.strategy.generate_second_factor_OTP(session);
  }
  async verify_first_factor(
    payload: any,
    device?: SessionDevice
  ): Promise<string> {
    let session = await LoginSession.get(this._id);
    try {
      let verificationResult = await this.strategy.verify_first_factor(
        session,
        payload,
        device
      );
      await this.update_session_status(verificationResult);
      return JWTAdapter.sign(
        { session: this._id },
        TokenExpiration.year1,
        this._jwt_private_key
      );
    } catch (e) {
      await this.removeSession();
      throw e;
    }
  }
  private async update_session_status(
    verify_result: AuthStepVerificationResult
  ): Promise<boolean> {
    let modified = await Session.updateOne(
      { _id: this._id },
      {
        $set: {
          expiring: verify_result.expiring,
          status: verify_result.status,
        },
      }
    ).exec();

    return modified.nModified === 1 ? true : false;
  }

  private async removeSession(): Promise<boolean> {
    let removed: any = await Session.remove({ _id: this._id }).exec();
    return removed.nRemoved === 1 ? false : false;
  }
}
