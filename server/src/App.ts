import pino from 'pino';
import process from 'process';
import dotenv from 'dotenv';

import Environment, { nodeEnvToEnvironment } from './Environment';
import { SQLiteUsersDB } from './UsersDB';
import { SQLiteFilesDB } from './FilesDB';
import AppFactory from './AppFactory';

// TODO: These things should be configurable. Environment variables are probably
// sufficient for all of these, since there aren't many of them.
// TODO: Should we try to make the logger stay in pretty mode?
const logger = pino({ level: process.env.LOG_LEVEL || 'debug' });
const usersDB = new SQLiteUsersDB('./sqlite/baton_dev.db');
const filesDB = new SQLiteFilesDB('./sqlite/baton_dev.db');
const fileUploadPath = './uploaded/';
const defaultFileLifetimeInDays = 7;
const env: Environment = nodeEnvToEnvironment();

switch (env as Environment) {
  case Environment.Development:
    dotenv.config({ path: './.env.development' });
    break;
  case Environment.Production:
    dotenv.config();
    break;
  case Environment.Testing:
    dotenv.config({ path: './.env.testing' });
    break;
  default:
    throw Error(`unrecognized environment: ${env}`);
}

const hostname = process.env.BATON_HOSTNAME
  ? process.env.BATON_HOSTNAME
  : 'http://localhost';
const port = process.env.BATON_PORT
  ? parseInt(process.env.BATON_PORT, 10)
  : 8080;

const app = AppFactory(
  env,
  logger,
  usersDB,
  filesDB,
  fileUploadPath,
  defaultFileLifetimeInDays,
);

// Starts the express server.
app.listen(port, hostname, () => {
  logger.info(`server started at http://localhost:${port}`);
});
