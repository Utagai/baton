import pino from 'pino';

import { SQLiteFilesDB } from './FilesDB';
import AppFactory from './AppFactory';

// TODO: These things should be configurable. Environment variables are probably
// sufficient for all of these, since there aren't many of them.
// TODO: Should we try to make the logger stay in pretty mode?
const logger = pino({ level: process.env.LOG_LEVEL || 'debug' });
const filesDB = new SQLiteFilesDB('./sqlite/baton_dev.db');
const fileUploadPath = './uploaded/';
const defaultFileLifetimeInDays = 7;
const port = 8080;

const app = AppFactory(
  logger,
  filesDB,
  fileUploadPath,
  defaultFileLifetimeInDays,
);

// Starts the express server.
app.listen(port, () => {
  logger.info(`server started at http://localhost:${port}`);
});
