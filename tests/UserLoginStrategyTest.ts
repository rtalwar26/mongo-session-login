import { before, after } from "intern/lib/interfaces/bdd";
import User from "../implementation/User";
import TestHelper from "../implementation/TestHelper";
import LoginSession from "../LoginSession";
import UserLoginStrategy from "../implementation/UserLoginStrategy";

const { describe, it } = intern.getInterface("bdd");
const { assert } = intern.getPlugin("chai");
const jwt_private_key =
  "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb3dJQkFBS0NBUUVBbkNET0Y1YlZ4c3p5WllWcnNGcUIxM1RVNjVEUStjVEIrbnNVUWFxQkhJOUUzbjZICjlEcTI0RXBodFhkZW82ak1nSjU5bVpFZXVOSGlqMnl1NjM3UGd6NmZDMEp0eEExQXhnZkpOYTBCWTdHcC9Sa2MKVWJUcERmVVZkbWw3UFhoSWs0Y1I4VDJZejJVZFFrT3o2eE1DMC9iQ01SSjVNUWVtRmN6OEZMZjhiaHBmaGJjWApxdlJDVEx1cHpCZTNLUHpPZG1JQ2dqNnFPOFIxZzlnV1V2ZU1WVTEreHFJYTEydHZsN0ZranF6WlZWbTAySm9pCmhrd0pUaTVxejJqbDhUUi9ObDNmNTNNN0Y5VFVnZTVpMXFucnVwUGN1ZnE2cnc5ODF4SmpRUzBXNkZVQkdzRjQKS2QreFg1dGZlUGJNeGhoTlZxQVZYQWpJMDdKcXBqWTkvZmR3ZFFJREFRQUJBb0lCQUhkR0xJd2k1RkJLOUFlUQo1Uk5HSVptTEhMcVYyTUJuaTFXalAzZG5IZG5HcmZOWU1ON3BHQnJEV0YvOHdLVkE2SEorSWkvMmlNVGpPelVjCjc0ampTUDdZRVVMVnpldVB3R05KUVhNckp6dVZWK3NPaXU3MHlYS3JRR2xFN2l5b3ZyRk41K3duaFowemZ5WEgKZVNUbVVpdkNnTnBpWlltS2NWeUlUREE3MnJIMWJHcHUzQVg1UU84b1NNYk9yaDQwQjlFbjR0eG5XVXRpRVVZYQpxK01NS0FVbkRTWnpHRW82c2tHOTFyUnRoVzJmcW00VGtDQm85RDVtRkdSVGVVNE1yRWw4RVlOb28wUENuSTVRCkhxbFZzYk5Md2sxa0lCaWJHOFp6NVIvczUydjBVS2NLdWhkUDhsaWV0MTJ1MThmNmd5M0UvT0xoSExsTHZVRVkKMHg5amZRRUNnWUVBekJmSzlyaGMrZHZja0NWa1pKVHdFck9WOHBqTFRqdXFFcms1RzdSTWFQYXZjazBMZEdKWQpDeWtSM1pUNTFHMGRGMXZKbUt6RTdJc1BpMnFyTFV5ZFNMUVpOWmlWZUNNaFVRbnFER0Z4UDE5VHpLM1ErRHh0CnAxdGkraDVuSldPSk9CYmhKelZuYk1YS0kvc3RyY0VBa0N3N2lwNk4ySVlsMWJ2OE1wNlNMclVDZ1lFQXc5WVgKVlJ6aFlNbWhKNTFkM0o1YmFocGR6Vmp6dE1BdE9DbU1BUThHVE5YdFhoRnBkTmtRUFhrSnhCWWNwYmNIQU9pdgp6WlZ2Z2JneE1HSTdNZGVpcGptbzRndEhwc0tLdUIvWTgrbzc1UFdFUmkzOVVaWXRmMlBqNmliV2lLaTAvM2ZsCmtSYkhZVjZnajNacFVhQXByTS96VlYvNTRUWkJvcTR0Y2NzRGtzRUNnWUJYcDRSWk1GZG1UR0pQV20vaXJ3RG8KMTA1NFVkMUhiV0tmQmdRYi9QU3dRL3FZT2JUSXVKQWR3dmJVVnU1eHFLZE01L1FPYVcxdU5rOW56bGxVYkVwRQo5bXk1VXg0bTZkZWVTWWJHNkhiT0EvQW13U1ExNlNZak1hR3gwS3IyS09pL09UeGNMWmlNNCtuc1NDMlhLWVJICloyZnZJaWZEcmVIRUNTZkl5Y2Y0M1FLQmdFdThReCsrWUlidTB5MGYxY25aVUI4VGZVMUo1azN6dUVrdEFDRDAKcjRvTmZaUFFoZ2tUWFExNC9zYmZpa3FvSXNRK09LYjM4THlwQUJUbkdGOXBObFMwbmRSMWFrdGFsdzBuKzk0dwpxdU1iOUFDMERuQjc5TEo4YmdzQzVCckxxOXZVZ1dwLzliRjVSL3pUWFYyYzVDRVo5dEFBb3dGdTJ5bFAxUEZhCkF0TEJBb0dCQUpOdkpwMXp4c3Y0WUI0aW5TNWdqMEpQTjUwUEpKbi96SVNkdmlSdU85UUt2WTJEOVU4amlTSkkKRExDUnZTRFllSTVkcXJFR2hueVZFTXIyQnZBVmYwYlBXZmJlcHZGMHE5ZE8vd2ZKZ1VhR3pYOFlOZE9DaWsxcwoxa3BlajQzdStTOUVSWEtacVRTUnljbVplUTRpTjc3R1pjYmUzRmtER0hNZEg0S1RxeGRhCi0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0tCg==";
const jwt_public_key =
  "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuQ0RPRjViVnhzenlaWVZyc0ZxQgoxM1RVNjVEUStjVEIrbnNVUWFxQkhJOUUzbjZIOURxMjRFcGh0WGRlbzZqTWdKNTltWkVldU5IaWoyeXU2MzdQCmd6NmZDMEp0eEExQXhnZkpOYTBCWTdHcC9Sa2NVYlRwRGZVVmRtbDdQWGhJazRjUjhUMll6MlVkUWtPejZ4TUMKMC9iQ01SSjVNUWVtRmN6OEZMZjhiaHBmaGJjWHF2UkNUTHVwekJlM0tQek9kbUlDZ2o2cU84UjFnOWdXVXZlTQpWVTEreHFJYTEydHZsN0ZranF6WlZWbTAySm9paGt3SlRpNXF6MmpsOFRSL05sM2Y1M003RjlUVWdlNWkxcW5yCnVwUGN1ZnE2cnc5ODF4SmpRUzBXNkZVQkdzRjRLZCt4WDV0ZmVQYk14aGhOVnFBVlhBakkwN0pxcGpZOS9mZHcKZFFJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==";

describe("UserLoginStrategyTests ", () => {
  before(async () => {
    await TestHelper.connectDB();
  });

  it(`creates and verifies a token`, (done) => {
    return (async () => {
      let user = await new User({
        mobile: "+910000000000",
        name: "abc xyz",
        approval_status: "approved",
        roles: [""],
      }).save();
      let session_encode: LoginSession = new LoginSession(
        new UserLoginStrategy(),
        jwt_private_key,
        jwt_public_key
      );
      session_encode = await session_encode.initiate_first_factor(
        user._id.toString()
      ); // initiate for a particular user
      await session_encode.verify_first_factor({});
      let { otp_secret } = await session_encode.generate_second_factor_OTP();
      await session_encode.verify_second_factor({ otp_secret });

      let token = await session_encode.generate_session_token("5m"); //token valid for 5 minutes

      let session_decode: LoginSession = await new LoginSession(
        new UserLoginStrategy(),
        jwt_private_key,
        jwt_public_key
      );

      // here there is no need to call initiateForUserId since we dont know the user but we just know the token
      let user_id = await session_decode.fetchUserId(token!);
      assert.strictEqual(user_id, user._id.toString());
      return;
    })();
  });

  after(() => {
    return (async () => {
      await User.deleteMany({});
      await TestHelper.disconnectMongo(false);
    })();
  });
});
