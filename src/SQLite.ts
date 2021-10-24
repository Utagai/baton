import sqlite from 'better-sqlite3';

import uploadedFile from './types';

const db = sqlite('./sqlite/baton_dev.db');

export function getFiles(): uploadedFile[] {
  return db.prepare('SELECT * FROM files').all();
}

export function addFile(f: uploadedFile): number {
  const insert = db.prepare(
    'INSERT INTO files (id, filename, filesize, uploadTime, expireTime) ' +
      'VALUES(@id, @filename, @filesize, @uploadTime, @expireTime)',
  );
  return insert.run({
    id: f.id,
    filename: f.filename,
    filesize: f.filesize,
    uploadTime: f.uploadTime,
    expireTime: f.expireTime,
  }).changes;
}
