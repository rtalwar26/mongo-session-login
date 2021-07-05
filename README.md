# mongo-session-login

An easy implementation of session based login, with support of custom login strategies. see example usage below

---

### Steps to create JWT keys

**Create an RSA key pair**

```shell
openssl genrsa  -out private.pem 2048
openssl rsa -in private.pem -outform PEM -pubout -out public.pem

```

**Convert newly created keys into Base64 format**

```shell
openssl base64 -in private.pem -out private_base64.txt
openssl base64 -in public.pem -out public_base64.txt
```

---

### Usage

```shell
npm install --save mongo-session-login
```

> In this example we have created our custom login strategy under [implementation/UserLoginStrategy.ts](implementation/UserLoginStrategy.ts)

```javascript
import User from "mongo-session-login/implementation/User";
import LoginSession from "mongo-session-login/LoginSession";
import UserLoginStrategy from "mongo-session-login/implementation/UserLoginStrategy";

const run_example = async () => {
  let session_encode: LoginSession = new LoginSession(
    new UserLoginStrategy(),
    "------jwt_private_key------",
    "-----jwt_public_key------"
  );

 let test_user = await new User({ /*here you can also use your application's users collection*/
        mobile: "+910000000000",
        name: "abc xyz",
        approval_status: "approved",
        roles: [""],
      }).save();

  session_encode = await session_encode.initiate_first_factor(test_user._id.toString()); // initiate for a particular user
  await session_encode.verify_first_factor({});
  let { otp_secret } = await session_encode.generate_second_factor_OTP();
  await session_encode.verify_second_factor({ otp_secret });

  let token = await session_encode.generate_session_token("5m"); //token valid for 5 minutes

  let session_decode: LoginSession = await new LoginSession(
    new UserLoginStrategy(),
    "------jwt_private_key------",
    "-----jwt_public_key------"
  );

  // here there is no need to call initiateForUserId since we dont know the user but we just know the token
  let user_id = await session_decode.fetchUserId(token!);
  console.log({ user_id });
};

run_example().then(() => {});

```

### LoginStrategy Interface

If you are implementing your own LoginStrategy , you have to implement a class which implements `LoginStrategy` interface as shown below.

```javascript
interface LoginStrategy {
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
```

### Example Implementation

An example showing a custom login strategy - [UserLoginStrategy.ts](implementation/UserLoginStrategy.ts) class.

```javascript
import { LoginStrategy } from "mongo-session-login/LoginSessionConfig";
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

```
