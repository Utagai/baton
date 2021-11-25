import User from './User';
import SQLiteDB from './SQLiteDB';

export interface UsersDB {
  getUser(username: string): User;
  addUser(user: User): number;
}

export class SQLiteUsersDB extends SQLiteDB implements UsersDB {
  constructor(sqliteDBPath: string, tableName: string = 'users') {
    super(
      sqliteDBPath,
      tableName,
      '(username varchar, hashedPassword varchar, salt varchar, iterations int)',
    );
  }

  getUser(username: string): User | undefined {
    const selectStmt = this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE username = @username`,
    );

    const userRow = selectStmt.get({ username });
    if (userRow === undefined) {
      // Couldn't find the user.
      return undefined;
    }
    return {
      username: userRow.username,
      passwordHashInfo: {
        hash: userRow.hashedPassword,
        salt: userRow.salt,
        iterations: userRow.iterations,
      },
    };
  }

  addUser(user: User): number {
    const insertStmt = this.db.prepare(
      `INSERT INTO ${this.tableName} (username, hashedPassword, salt, iterations) ` +
        'VALUES(@username, @hashedPassword, @salt, @iterations)',
    );
    return insertStmt.run({
      username: user.username,
      hashedPassword: user.passwordHashInfo.hash,
      salt: user.passwordHashInfo.salt,
      iterations: user.passwordHashInfo.iterations,
    }).changes;
  }
}
