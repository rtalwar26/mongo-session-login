"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by rohittalwar on 04/05/16.
 */
const mongoose = require("mongoose");
class DBConnection {
    static async connect(dbName) {
        let db = DBConnection.connectToPath(`mongodb://localhost:27017/${dbName}`);
        return db;
    }
    static async connectToPath(url) {
        return new Promise((resolve, reject) => {
            mongoose
                .connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
                .then(resolve, reject);
        });
    }
}
class TestHelper {
    static async connectDB() {
        let dbName = "testDB";
        TestHelper.db = await DBConnection.connect(dbName);
        return TestHelper.db;
    }
    static mock(obj, field, value) {
        obj[`_${field}`] = obj[field];
        obj[field] = value;
    }
    static unmock(obj, field) {
        obj[field] = obj[`_${field}`] || obj[field];
        delete obj[`_${field}`];
    }
    static randomNumber(length) {
        var text = "";
        var possible = "1234567890";
        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }
    static getRandomString() {
        return String(new Date().getTime()) + Math.random().toString(36).slice(-5);
    }
    static async disconnectMongo(dropDb = true, callback) {
        try {
            dropDb &&
                TestHelper.db &&
                (await TestHelper.db.connection.dropDatabase());
            TestHelper.db && (await TestHelper.db.connection.close());
            return await mongoose.connection.close();
        }
        catch (e) { }
        return {};
    }
}
exports.default = TestHelper;
