import sqlite from 'better-sqlite3';

class SQLiteDB {
  db: sqlite.Database;

  tableName: string;

  // columnDescription is a SQL-style CREATE TABLE column listing.
  // e.g. (id varchar, size int).
  constructor(
    sqliteDBPath: string,
    tableName: string,
    columnDescription: string,
  ) {
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
      this.db.prepare(`create table ${tableName}${columnDescription}`).run();
    }
  }
}

export default SQLiteDB;
