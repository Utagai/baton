import { unlink } from 'fs';

import { SQLiteFilesDB } from './FilesDB';

const testDBFile = './sqlite/sqlite_filesdb_test.db';

afterEach(() => {
  unlink(testDBFile, (err) => {
    if (err) {
      throw Error(err.message);
    }
  });
});

describe('sqlite files db', () => {
  test('initializes table on first run correctly', () => {
    const filesDB = new SQLiteFilesDB(testDBFile, 'new_table');
    const expectedFile = {
      name: 'hello',
      size: 42,
      id: 'world',
      uploadTime: new Date(),
      expireTime: new Date(),
    };
    expect(filesDB.addFile(expectedFile)).toBe(1);
    expect(filesDB.getFile(expectedFile.id)).toEqual({
      ...expectedFile,
      uploadTime: expectedFile.uploadTime.toISOString(),
      expireTime: expectedFile.expireTime.toISOString(),
    });
  });
});
