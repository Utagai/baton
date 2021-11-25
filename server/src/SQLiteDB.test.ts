import { unlink } from 'fs';
import sqlite from 'better-sqlite3';

import SQLiteDB from './SQLiteDB';

const testDBFile = './sqlite/sqlite_filesdb_test.db';

afterEach(() => {
  unlink(testDBFile, (err) => {
    if (err) {
      throw Error(err.message);
    }
  });
});

describe('sqlite db', () => {
  test('initializes table on first run correctly', () => {
    const newTableName = 'new_table';
    // eslint-disable-next-line
    const _ = new SQLiteDB(testDBFile, newTableName);
    const db = sqlite(testDBFile);
    const listTablesStmt = db.prepare('SELECT * FROM sqlite_master');
    // This is a fresh sqlite file, so there should only be a single row for the
    // new table.
    const row = listTablesStmt.get();
    expect(row.name).toEqual(newTableName);
  });
});
