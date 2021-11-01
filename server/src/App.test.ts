import request from 'supertest';
import pino from 'pino';

import FilesDB from './FilesDB';
import AppFactory from './AppFactory';

const testLogLevel = 'debug';
const testSQLiteDBFile = './sqlite/baton_test.db';
const testUploadPath = './uploaded-test/';

function getTestFilesDB(currentTestName: string) {
  const testTableName = currentTestName.replace(/ /g, '_');
  return new FilesDB(testSQLiteDBFile, testTableName);
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
  const filesDB = getTestFilesDB(currentTestName);
  const fileUploadPath = testUploadPath;
  const defaultFileLifetimeInDays = 1;
  return AppFactory(logger, filesDB, fileUploadPath, defaultFileLifetimeInDays);
}

beforeEach(() => {
  const { currentTestName } = expect.getState();
  const filesDB = getTestFilesDB(currentTestName);
  const files = filesDB.getAllFiles();
  files.forEach((file) => {
    expect(filesDB.deleteFile(file.id));
  });
});

test('GET files empty', async () => {
  const app = getTestApp(expect.getState().currentTestName);
  await request(app)
    .get('/files')
    .expect(200)
    .expect('Content-Type', /json/)
    .then((resp) => {
      console.log('resp body:', resp.body);
      expect(Array.isArray(resp.body.files)).toBeTruthy();
      expect(resp.body.files.length).toBe(0);
    });
});

test('GET files non empty', async () => {
  const { currentTestName } = expect.getState();
  const filesDB = getTestFilesDB(currentTestName);
  const fileToUpload = {
    name: 'test',
    size: 100,
    id: currentTestName,
    uploadTime: new Date(),
    expireTime: new Date(), // This is a bit weird, but not invalid.
  };
  expect(filesDB.addFile(fileToUpload)).toBe(1); // Expect to have this one file's metadata uploaded.

  const app = getTestApp(currentTestName);
  await request(app)
    .get('/files')
    .expect(200)
    .expect('Content-Type', /json/)
    .then((resp) => {
      console.log('resp body:', resp.body);
      expect(Array.isArray(resp.body.files)).toBeTruthy();
      expect(resp.body.files.length).toBe(1);
      // Ideally, we'd just check .toBe(fileToUpload), but remember that this
      // resp is JSON, so the dates are not Date objects but strings. There are
      // some other approaches, e.g. making a new proper File object or maybe
      // some custom matcher thing, but this is dead simple and the object is
      // relatively small.
      expect(resp.body.files[0].name).toBe(fileToUpload.name);
      expect(resp.body.files[0].size).toBe(fileToUpload.size);
      expect(resp.body.files[0].id).toBe(fileToUpload.id);
      expect(resp.body.files[0].uploadTime).toBe(
        fileToUpload.uploadTime.toISOString(),
      );
      expect(resp.body.files[0].expireTime).toBe(
        fileToUpload.expireTime.toISOString(),
      );
    });
});
