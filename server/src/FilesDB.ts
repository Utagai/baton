import sqlite from 'better-sqlite3';

import SQLiteDB from './SQLiteDB';
import FileMetadata from './FileMetadata';

export interface FilesDB {
  getAllFiles(): FileMetadata[];
  getFile(id: string): FileMetadata | undefined;
  addFile(f: FileMetadata): number;
  deleteFile(id: string): number;
  deleteExpiredFiles(): number;
}

export class SQLiteFilesDB extends SQLiteDB implements FilesDB {
  db: sqlite.Database;

  tableName: string;

  constructor(sqliteDBPath: string, tableName: string = 'files') {
    super(
      sqliteDBPath,
      tableName,
      '(id varchar, name varchar, size int, uploadTime date, expireTime date)',
    );
  }

  getAllFiles(): FileMetadata[] {
    return this.db.prepare(`SELECT * FROM ${this.tableName}`).all();
  }

  getFile(id: string): FileMetadata | undefined {
    const selectStmt = this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE id = @id`,
    );
    return selectStmt.get({ id });
  }

  addFile(f: FileMetadata): number {
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
