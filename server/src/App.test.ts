import request from 'supertest';
import pino from 'pino';

import FilesDB from './FilesDB';
import AppFactory from './AppFactory';

function getTestFilesDB(): FilesDB {
  return new FilesDB('./sqlite/baton_test.db');
}

function getTestAppFactory(): AppFactory {
  const logger = pino({ level: 'debug' });
  const filesDB = getTestFilesDB();
  const fileUploadPath = './uploaded-test/';
  const defaultFileLifetimeInDays = 1;
  return new AppFactory(
    logger,
    filesDB,
    fileUploadPath,
    defaultFileLifetimeInDays,
  );
}

test('GET /files (empty)', async () => {
  const app = getTestAppFactory().createApp();
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
