import sqlite from 'better-sqlite3';

import uploadedFile from './types';

class FilesDB {
  db: sqlite.Database;

  constructor(sqliteDBPath: string) {
    this.db = sqlite(sqliteDBPath);
  }

  getAllFiles(): uploadedFile[] {
    return this.db.prepare('SELECT * FROM files').all();
  }

  getFile(id: string): uploadedFile {
    const selectStmt = this.db.prepare('SELECT * FROM files WHERE id = @id');
    return selectStmt.get({ id });
  }

  addFile(f: uploadedFile): number {
    const insertStmt = this.db.prepare(
      'INSERT INTO files (id, filename, filesize, uploadTime, expireTime) ' +
        'VALUES(@id, @filename, @filesize, @uploadTime, @expireTime)',
    );
    return insertStmt.run({
      id: f.id,
      filename: f.filename,
      filesize: f.filesize,
      uploadTime: f.uploadTime.toISOString(),
      expireTime: f.expireTime.toISOString(),
    }).changes;
  }

  deleteFile(id: string): number {
    const deleteStmt = this.db.prepare('DELETE FROM files WHERE id = @id');
    return deleteStmt.run({ id }).changes;
  }

  deleteExpiredFiles() {
    const deleteStmt = this.db.prepare(
      'DELETE FROM files WHERE @now > expireTime',
    );
    // Normally we return the number of rows deleted but there's no point.
    // Sometimes we honestly won't delete anything and other times we will.
    deleteStmt.run({ now: new Date().toISOString() });
  }
}

export default FilesDB;
