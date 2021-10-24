import sqlite from 'better-sqlite3';

import file from './types';

const db = sqlite('./sqlite/baton_dev.db');

export function getFileListing(): file[] {
  return db.prepare('SELECT * FROM files').all();
}

export function addFile(f: file): number {
  const insert = db.prepare(
    'INSERT INTO files (filename, filesize, uploadTime, expireTime) VALUES(@filename, @filesize, @uploadTime, @expireTime)',
  );
  return insert.run(f).changes;
}
