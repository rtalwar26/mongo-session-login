import LoginSession from "../LoginSession";
import UserLoginStrategy from "./UserLoginStrategy";

const run_example = async () => {
  let session_encode: LoginSession = new LoginSession(
    new UserLoginStrategy(),
    "------jwt_private_key------",
    "-----jwt_public_key------"
  );
  session_encode = await session_encode.initiate_first_factor("abc"); // initiate for a particular user
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
