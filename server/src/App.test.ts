import fs from 'fs';
import path from 'path';
import request from 'supertest';
import pino from 'pino';
import { addDays } from 'date-fns';
import dotenv from 'dotenv';

import FileMetadata from './FileMetadata';
import { SQLiteUsersDB } from './UsersDB';
import { SQLiteFilesDB } from './FilesDB';
import AppFactory from './AppFactory';
import { createPasswordHashInfo } from './Password';

const testLogLevel = 'debug';
const testSQLiteDBFile = './sqlite/baton_test.db';
const testUploadPath = './uploaded-test/';
const testDefaultFileLifetime = 1;

jest.mock('./LoggedInCheck');

dotenv.config();

function getTestTableName(prefix: string, currentTestName: string) {
  return `${prefix}_${currentTestName.replace(/ /g, '_')}`;
}

function getTestUsersDB(currentTestName: string) {
  const testTableName = getTestTableName('users', currentTestName);
  return new SQLiteUsersDB(testSQLiteDBFile, testTableName);
}

function getTestFilesDB(currentTestName: string) {
  const testTableName = getTestTableName('files', currentTestName);
  return new SQLiteFilesDB(testSQLiteDBFile, testTableName);
}

function getTestApp(currentTestName: string) {
  // Make the logs pretty to make debugging test failures easier.
  const logger = pino({
    level: testLogLevel,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  });
  const usersDB = getTestUsersDB(currentTestName);
  const filesDB = getTestFilesDB(currentTestName);
  const fileUploadPath = testUploadPath;
  const defaultFileLifetimeInDays = testDefaultFileLifetime;
  return AppFactory(
    logger,
    usersDB,
    filesDB,
    fileUploadPath,
    defaultFileLifetimeInDays,
  );
}

// Run the clean-up _before_ the tests run, so that on failure, we still have
// the leftover data in SQLite + disk for debugging purposes.
beforeEach(() => {
  const { currentTestName } = expect.getState();
  const filesDB = getTestFilesDB(currentTestName);
  const files = filesDB.getAllFiles();
  files.forEach((file) => {
    expect(filesDB.deleteFile(file.id));
  });

  const usersDB = getTestUsersDB(currentTestName);
  usersDB.db
    .prepare(`DROP TABLE '${getTestTableName('users', currentTestName)}'`)
    .run();
});

beforeAll(() => {
  const files = fs.readdirSync(testUploadPath);
  files.forEach((fi) => {
    fs.unlinkSync(path.join(testUploadPath, fi));
  });
});

test('GET files empty', async () => {
  const app = getTestApp(expect.getState().currentTestName);
  await request(app)
    .get('/files')
    .expect(200)
    .expect('Content-Type', /json/)
    .then((resp) => {
      expect(Array.isArray(resp.body.files)).toBeTruthy();
      expect(resp.body.files.length).toBe(0);
    });
});

test('GET files non empty', async () => {
  const { currentTestName } = expect.getState();
  const filesDB = getTestFilesDB(currentTestName);
  const testFile = {
    name: currentTestName,
    size: 100,
    id: currentTestName,
    uploadTime: new Date(),
    expireTime: addDays(new Date(), testDefaultFileLifetime),
  };
  expect(filesDB.addFile(testFile)).toBe(1); // Expect to have this one file's metadata uploaded.

  const app = getTestApp(currentTestName);
  await request(app)
    .get('/files')
    .expect(200)
    .expect('Content-Type', /json/)
    .then((resp) => {
      expect(Array.isArray(resp.body.files)).toBeTruthy();
      expect(resp.body.files.length).toBe(1);
      // Ideally, we'd just check .toBe(testFile), but remember that this
      // resp is JSON, so the dates are not Date objects but strings. There are
      // some other approaches, e.g. making a new proper File object or maybe
      // some custom matcher thing, but this is dead simple and the number of
      // fields to check 'specially' is quite small.
      expect(resp.body.files[0]).toEqual({
        ...testFile,
        uploadTime: testFile.uploadTime.toISOString(),
        expireTime: testFile.expireTime.toISOString(),
      });
    });
});

describe('upload', () => {
  test('successful', async () => {
    const { currentTestName } = expect.getState();
    const app = getTestApp(expect.getState().currentTestName);

    const dataToUpload = Buffer.from('hello world!');
    // Make it a 'valid' filename (technically we don't have to do this to make
    // it valid but it makes it look a tiny bit nicer on the filesystem when you
    // run `ls`).
    const testID = `${currentTestName}_test.txt`.replace(/ /g, '_');
    await request(app)
      .post('/upload')
      .field('name', currentTestName)
      .field('size', '100')
      .field('id', testID)
      .attach('file', dataToUpload)
      .expect(200)
      .expect('Content-Type', /json/)
      .then((resp) => {
        // console.log('resp body:', resp.text);
        expect(resp.body).toEqual({
          name: currentTestName,
          size: 100,
          id: testID,
          uploadTime: expect.any(String),
          expireTime: expect.any(String),
        });
        // Now, be a bit more strict with testing of our dates. We won't expect a
        // perfect match of course, but we'd like to verify that the server is
        // setting reasonable upload & expiration times. Namely, that isn't, for
        // example, setting the expiration time to 500 years in the future even
        // though our configured expiration time is 1 day.
        // NOTE: The parameter of -1 we pass to toBeCloseTo() translates to a
        // generous 5 second tolerance.
        expect(Date.parse(resp.body.uploadTime) / 1000.0).toBeCloseTo(
          new Date().getTime() / 1000.0,
          -1,
        );
        expect(Date.parse(resp.body.expireTime) / 1000.0).toBeCloseTo(
          addDays(new Date(), testDefaultFileLifetime).getTime() / 1000.0,
          -1,
        );

        // Finally, confirm that the data we wanted to upload has been uploaded:
        const actualData = fs
          .readFileSync(path.join(testUploadPath, testID), 'utf8')
          .toString();
        expect(actualData).toEqual(dataToUpload.toString());
      });
  });

  test('fail on multiple files', async () => {
    const { currentTestName } = expect.getState();
    const app = getTestApp(expect.getState().currentTestName);

    const dataToUpload = Buffer.from('hello world!');
    await request(app)
      .post('/upload')
      .field('name', currentTestName)
      .field('size', '100')
      .field('id', currentTestName)
      .attach('file', dataToUpload)
      .attach('file', dataToUpload) // This second attachment should cause this to fail.
      .expect(500)
      .expect('Content-Type', /json/)
      .then((resp) => {
        expect(resp.body).toEqual({
          msg: 'cannot upload more than 1 file',
          attemptedCount: 2,
        });
      });
  });

  test('invalid form data fields', async () => {
    const { currentTestName } = expect.getState();
    const app = getTestApp(expect.getState().currentTestName);

    const dataToUpload = Buffer.from('hello world!');
    await request(app)
      .post('/upload')
      .field('filename', currentTestName) // This & below could be a common mistake.
      .field('filesize', '100')
      .field('id', currentTestName)
      .attach('file', dataToUpload)
      .expect(500)
      .expect('Content-Type', /json/)
      .then((resp) => {
        expect(resp.body).toEqual({
          msg: 'expected "name", "id", and "size" parameters in the form data',
          got: {
            filename: 'upload invalid form data fields',
            filesize: '100',
            id: 'upload invalid form data fields',
          },
        });
      });
  });

  test('mimic empty database update', async () => {
    const { currentTestName } = expect.getState();
    // Make the logs pretty to make debugging test failures easier.
    const logger = pino({
      level: testLogLevel,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    });
    const fileUploadPath = testUploadPath;
    const defaultFileLifetimeInDays = testDefaultFileLifetime;
    const mockedFilesDB = {
      getAllFiles: () => [] as FileMetadata[],
      getFile: (_: string) => undefined as FileMetadata | undefined,
      addFile: (_: FileMetadata) => 0,
      deleteFile: (_: string) => 0,
      deleteExpiredFiles: () => 0,
    };
    const app = AppFactory(
      logger,
      getTestUsersDB(currentTestName),
      mockedFilesDB,
      fileUploadPath,
      defaultFileLifetimeInDays,
    );

    const dataToUpload = Buffer.from('hello world!');
    await request(app)
      .post('/upload')
      .field('name', currentTestName) // This & below could be a common mistake.
      .field('size', '100')
      .field('id', currentTestName)
      .attach('file', dataToUpload)
      .expect(500)
      .expect('Content-Type', /json/)
      .then((resp) => {
        expect(resp.body).toEqual({
          msg: 'failed to persist upload to metadata',
          numChanged: 0,
        });
      });
  });
});

test('delete file by id', async () => {
  const { currentTestName } = expect.getState();
  const filesDB = getTestFilesDB(currentTestName);
  const testFile = {
    name: currentTestName,
    size: 100,
    id: currentTestName,
    uploadTime: new Date(),
    expireTime: addDays(new Date(), testDefaultFileLifetime),
  };
  expect(filesDB.addFile(testFile)).toBe(1);

  const app = getTestApp(currentTestName);
  await request(app)
    .delete(`/delete/${testFile.id}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .then((resp) => {
      expect(resp.body.id).toBe(currentTestName);
    });
});

test('delete file by id', async () => {
  const { currentTestName } = expect.getState();
  const filesDB = getTestFilesDB(currentTestName);
  const testFile = {
    name: currentTestName,
    size: 100,
    id: currentTestName,
    uploadTime: new Date(),
    // Add a negated version so that this file is guaranteed to be considered expired.
    expireTime: addDays(new Date(), -testDefaultFileLifetime),
  };
  expect(filesDB.addFile(testFile)).toBe(1);

  const app = getTestApp(currentTestName);
  await request(app)
    .delete('/deleteexpired')
    .expect(200)
    .expect('Content-Type', /json/)
    .then(() => {
      // This file should no longer exist since it is expired and we
      // presumably deleted all of the expired files.
      expect(filesDB.getFile(currentTestName)).toBeUndefined();
    });
});

describe('download', () => {
  test('successful', async () => {
    const { currentTestName } = expect.getState();
    const filesDB = getTestFilesDB(currentTestName);
    const testID = `${currentTestName}_test.txt`.replace(/ /g, '_');
    const testFile = {
      name: currentTestName,
      size: 100,
      id: testID,
      uploadTime: new Date(),
      expireTime: addDays(new Date(), testDefaultFileLifetime),
    };
    expect(filesDB.addFile(testFile)).toBe(1);

    // We also need to create the file so that the server can find it.
    const fileContents = 'hello world!';
    fs.writeFileSync(path.join(testUploadPath, testID), fileContents);

    let downloadedData = '';
    const app = getTestApp(currentTestName);
    await request(app)
      .get(`/download/${testFile.id}`)
      .buffer()
      .parse((res, callback) => {
        res.setEncoding('binary');
        res.on('data', (chunk) => {
          downloadedData += chunk;
        });
        res.on('end', () => {
          callback(null, Buffer.from(downloadedData, 'binary'));
        });
      })
      .expect(200)
      .then(() => {
        expect(downloadedData).toEqual(fileContents);
      });
  });

  test('file that does not exist', async () => {
    const { currentTestName } = expect.getState();
    const filesDB = getTestFilesDB(currentTestName);
    const testFile = {
      name: currentTestName,
      size: 100,
      id: currentTestName,
      uploadTime: new Date(),
      expireTime: addDays(new Date(), testDefaultFileLifetime),
    };
    expect(filesDB.addFile(testFile)).toBe(1);

    const app = getTestApp(currentTestName);
    await request(app)
      .get(`/download/${testFile.id}`)
      .expect(404)
      .then((resp) => {
        expect(resp.body.msg).toBe('Not Found');
      });
  });
});

describe('login', () => {
  test('successful login', async () => {
    const { currentTestName } = expect.getState();
    const usersDB = getTestUsersDB(currentTestName);
    const testUsername = 'test';
    const testPlaintextPassword = 'helloworld';
    const testPasswordHashInfo = createPasswordHashInfo(testPlaintextPassword);
    expect(
      usersDB.addUser({
        username: testUsername,
        passwordHashInfo: testPasswordHashInfo,
      }),
    ).toBe(1);

    const app = getTestApp(currentTestName);
    await request(app)
      .post('/login')
      .field('username', testUsername)
      .field('password', testPlaintextPassword)
      .expect(200);
  });

  test('invalid login due to bad credentials', async () => {
    const { currentTestName } = expect.getState();
    const usersDB = getTestUsersDB(currentTestName);
    const testUsername = 'test';
    const testPlaintextPassword = 'helloworld';
    const testPasswordHashInfo = createPasswordHashInfo(testPlaintextPassword);
    expect(
      usersDB.addUser({
        username: testUsername,
        passwordHashInfo: testPasswordHashInfo,
      }),
    ).toBe(1);

    const app = getTestApp(currentTestName);
    await request(app)
      .post('/login')
      .field('username', testUsername)
      .field('password', 'i am wrong')
      .expect(403);
  });

  test('invalid login due to non existent user', async () => {
    const { currentTestName } = expect.getState();

    const app = getTestApp(currentTestName);
    await request(app)
      .post('/login')
      .field('username', 'i dont exist')
      .field('password', 'and neither do i')
      .expect(403);
  });
});
