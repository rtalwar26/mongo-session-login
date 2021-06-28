import * as jwt from "jsonwebtoken";

export default class JWTAdapter {
  static async sign(
    payload: any,
    expiresIn: string,
    private_key: string,
    encoding?: /** defaults to 'base64' */
    "ascii" | "utf8" | "utf16le" | "ucs2" | "base64" | "binary" | "hex"
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      var cert = Buffer.from(private_key, encoding || "base64");

      jwt.sign(
        payload,
        cert,
        { algorithm: "RS256", expiresIn: expiresIn },
        function (err, token) {
          err ? reject(err) : resolve(token!);
        }
      );
    });
  }

  static async verify(
    token: string,
    public_key: string,
    encoding?: /** defaults to 'base64' */
    "ascii" | "utf8" | "utf16le" | "ucs2" | "base64" | "binary" | "hex"
  ): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      var cert = Buffer.from(public_key, encoding || "base64");

      jwt.verify(
        token,
        cert,
        { algorithms: ["RS256"] },
        function (err, decoded) {
          err ? reject(err) : resolve(decoded);
        }
      );
    });
  }

  static decode(token: string): any {
    var decoded = jwt.decode(token, { complete: true, json: true });
    return decoded;
  }
}
