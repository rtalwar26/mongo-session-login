"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
class JWTAdapter {
    static async sign(payload, expiresIn, private_key, encoding) {
        return new Promise((resolve, reject) => {
            var cert = Buffer.from(private_key, encoding || "base64");
            jwt.sign(payload, cert, { algorithm: "RS256", expiresIn: expiresIn }, function (err, token) {
                err ? reject(err) : resolve(token);
            });
        });
    }
    static async verify(token, public_key, encoding) {
        return new Promise((resolve, reject) => {
            var cert = Buffer.from(public_key, encoding || "base64");
            jwt.verify(token, cert, { algorithms: ["RS256"] }, function (err, decoded) {
                err ? reject(err) : resolve(decoded);
            });
        });
    }
    static decode(token) {
        var decoded = jwt.decode(token, { complete: true, json: true });
        return decoded;
    }
}
exports.default = JWTAdapter;
