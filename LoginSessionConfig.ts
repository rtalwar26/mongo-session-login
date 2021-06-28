import {
  ISession,
  SessionDevice,
  ISessionModel,
  SessionStatus,
} from "./db-schemas/Session";

export interface OTPData {
  email?: string;
  mobile?: string;
  otp_secret: string;
  two_fa_enabled?: boolean;
}

export interface LoginSessionChallenge {
  _id: string;
  details: {
    pow_hash_prefix: string;
    pow_salt: string;
    pow_secret: number;
    key_length: number;
    pow_rounds: number;
  };
}

export interface AuthStepVerificationResult {
  expiring: number;
  status: SessionStatus;
}
export interface LoginStrategy {
  type: string;
  initiate_first_factor(
    user_id: string,
    device?: SessionDevice
  ): Promise<ISession>;
  verify_first_factor(
    session: ISessionModel,
    payload: any,
    device?: SessionDevice
  ): Promise<AuthStepVerificationResult>;
  generate_second_factor_OTP(session: ISessionModel): Promise<OTPData>;
  verify_second_factor(
    session: ISessionModel,
    payload: any,
    device?: SessionDevice
  ): Promise<AuthStepVerificationResult>;
  fetchUserId(sessionId: string): Promise<string>;
}
