import sqlite from 'better-sqlite3';

import uploadedFile from './types';

const db = sqlite('./sqlite/baton_dev.db');

export function getFiles(): uploadedFile[] {
  return db.prepare('SELECT * FROM files').all();
}

export function addFile(f: uploadedFile): number {
  const insertStmt = db.prepare(
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

export function deleteFile(id: string): number {
  const deleteStmt = db.prepare('DELETE FROM files WHERE id = @id');
  return deleteStmt.run({ id }).changes;
}
