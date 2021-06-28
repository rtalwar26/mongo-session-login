/**
 * Created by rohittalwar on 01/06/16.
 */
import * as mongoose from "mongoose";
import { sanitizeSchema } from "mongo-sanitize-save";

export enum SessionStatus {
  FA_1_INITIATED = "FA_1_INITIATED",
  FA_1_VERIFIED = "FA_1_VERIFIED",
  FA_2_INITIATED = "FA_1_VERIFIED",
  FA_2_VERIFIED = "FA_2_VERIFIED",
  DISAPPROVED = "DISAPPROVED",
}

interface SessionDetail {
  otp_secret?: string;
  pow_secret: number;
  pow_salt: string;
  pow_hash_prefix: string;
}
export interface SessionDevice {
  fingerprint?: string;
  ip?: string;
  location?: string;
  hardware?: string;
  os?: string;
  app_version?: string;
  redirect_link?: string;
}

export interface ISession {
  expiring: number;
  status: string;
  value: string;
  type: string;
  details?: SessionDetail;
  device?: SessionDevice;
}
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

sanitizeSchema(detailSchema);

sanitizeSchema(mySchema);

sanitizeSchema(deviceSchema);

export interface ISessionModel extends ISession, mongoose.Document {}

export default mongoose.model<ISessionModel>("sessions", mySchema);
