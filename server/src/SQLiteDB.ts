import sqlite from 'better-sqlite3';

class SQLiteDB {
  db: sqlite.Database;

  tableName: string;

  constructor(sqliteDBPath: string, tableName: string) {
    this.db = sqlite(sqliteDBPath);
    this.tableName = tableName;
    if (
      this.db
        .prepare(
          `SELECT name FROM sqlite_schema WHERE type = 'table' AND name='${tableName}'`,
        )
        .get() === undefined
    ) {
      // If the table does not yet exist, create it.
      this.db
        .prepare(
          `create table ${tableName}(id varchar, name varchar, size int, uploadTime date, expireTime date)`,
        )
        .run();
    }
  }
}

export default SQLiteDB;
