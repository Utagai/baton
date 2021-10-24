import sqlite from 'better-sqlite3';

import uploadedFile from './types';

const db = sqlite('./sqlite/baton_dev.db');

export function getFileListing(): uploadedFile[] {
  return db.prepare('SELECT * FROM files').all();
}

export function addFile(f: uploadedFile): number {
  const insert = db.prepare(
    'INSERT INTO files (filename, filesize, uploadTime, expireTime) ' +
      'VALUES(@filename, @filesize, @uploadTime, @expireTime)',
  );
  return insert.run({
    filename: f.filename,
    filesize: f.filesize,
    uploadTime: f.uploadTime.toISOString(),
    expireTime: f.expireTime.toISOString(),
  }).changes;
}
