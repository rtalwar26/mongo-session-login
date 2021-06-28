/**
 * Created by rohittalwar on 04/05/16.
 */
import * as mongoose from "mongoose";

class DBConnection {
  static async connect(dbName: string): Promise<any> {
    let db = DBConnection.connectToPath(`mongodb://localhost:27017/${dbName}`);
    return db;
  }

  private static async connectToPath(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      mongoose
        .connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(resolve, reject);
    });
  }
}

export default class TestHelper {
  static db: any;
  static async connectDB(): Promise<any> {
    let dbName = "testDB";
    TestHelper.db = await DBConnection.connect(dbName);
    return TestHelper.db;
  }

  static mock(obj: any, field: string, value: any) {
    obj[`_${field}`] = obj[field];
    obj[field] = value;
  }
  static unmock(obj: any, field: string) {
    obj[field] = obj[`_${field}`] || obj[field];
    delete obj[`_${field}`];
  }

  static randomNumber(length: number) {
    var text = "";
    var possible = "1234567890";

    for (var i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }
  static getRandomString(): string {
    return String(new Date().getTime()) + Math.random().toString(36).slice(-5);
  }

  static async disconnectMongo(
    dropDb: boolean = true,
    callback?: any
  ): Promise<any> {
    try {
      dropDb &&
        TestHelper.db &&
        (await TestHelper.db.connection.dropDatabase());
      TestHelper.db && (await TestHelper.db.connection.close());
      return await mongoose.connection.close();
    } catch (e) {}
    return {};
  }
}
