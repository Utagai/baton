import request from 'supertest';
import pino from 'pino';

import FilesDB from './FilesDB';
import AppFactory from './Server';

function getTestAppFactory(): AppFactory {
  const logger = pino({ level: 'debug' });
  const filesDB = new FilesDB('./sqlite/baton_test.db');
  const fileUploadPath = './uploaded-test/';
  const defaultFileLifetimeInDays = 1;
  return new AppFactory(
    logger,
    filesDB,
    fileUploadPath,
    defaultFileLifetimeInDays,
  );
}

test('GET /files', async () => {
  const app = getTestAppFactory().createApp();
  await request(app).get('/files').expect(200);
});
