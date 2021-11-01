import request from 'supertest';
import pino from 'pino';

import FilesDB from './FilesDB';
import AppFactory from './AppFactory';

const testLogLevel = 'debug';
const testSQLiteDBFile = './sqlite/baton_test.db';
const testUploadPath = './uploaded-test/';

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
  const testTableName = currentTestName.replace(/ /g, '_');
  const filesDB = new FilesDB(testSQLiteDBFile, testTableName);
  const fileUploadPath = testUploadPath;
  const defaultFileLifetimeInDays = 1;
  return AppFactory(logger, filesDB, fileUploadPath, defaultFileLifetimeInDays);
}

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
