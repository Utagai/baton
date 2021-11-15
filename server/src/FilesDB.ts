import sqlite from 'better-sqlite3';

import File from './File';

export interface FilesDB {
  getAllFiles(): File[];
  getFile(id: string): File | undefined;
  addFile(f: File): number;
  deleteFile(id: string): number;
  deleteExpiredFiles(): number;
}

export class SQLiteFilesDB implements FilesDB {
  db: sqlite.Database;

  tableName: string;

  constructor(sqliteDBPath: string, tableName: string = 'files') {
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

  getAllFiles(): File[] {
    return this.db.prepare(`SELECT * FROM ${this.tableName}`).all();
  }

  getFile(id: string): File | undefined {
    const selectStmt = this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE id = @id`,
    );
    return selectStmt.get({ id });
  }

  addFile(f: File): number {
    const insertStmt = this.db.prepare(
      `INSERT INTO ${this.tableName} (id, name, size, uploadTime, expireTime) ` +
        'VALUES(@id, @name, @size, @uploadTime, @expireTime)',
    );
    return insertStmt.run({
      id: f.id,
      name: f.name,
      size: f.size,
      uploadTime: f.uploadTime.toISOString(),
      expireTime: f.expireTime.toISOString(),
    }).changes;
  }

  deleteFile(id: string): number {
    const deleteStmt = this.db.prepare(
      `DELETE FROM ${this.tableName} WHERE id = @id`,
    );
    return deleteStmt.run({ id }).changes;
  }

  deleteExpiredFiles(): number {
    const deleteStmt = this.db.prepare(
      `DELETE FROM ${this.tableName} WHERE @now > expireTime`,
    );
    // Normally we return the number of rows deleted but there's no point.
    // Sometimes we honestly won't delete anything and other times we will.
    return deleteStmt.run({ now: new Date().toISOString() }).changes;
  }
}
