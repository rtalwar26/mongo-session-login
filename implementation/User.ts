import * as mongoose from "mongoose";
export interface IUser {
  name: string;
  mobile: string;
  roles?: [string];
  approval_status: string;
  settings?: {
    two_fa_enabled: boolean;
  };
}
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

export interface IUserModel extends IUser, mongoose.Document {}

export default mongoose.model<IUserModel>(
  "mongo_session_login_test_users",
  mySchema
);
