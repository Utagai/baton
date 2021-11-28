import pino from 'pino';
import process from 'process';
import dotenv from 'dotenv';

import Environment, { nodeEnvToEnvironment } from './Environment';
import { SQLiteUsersDB } from './UsersDB';
import { SQLiteFilesDB } from './FilesDB';
import AppFactory from './AppFactory';

// TODO: This is not currently set in the environment.
// TODO: The logs are really hard to read in the production journal... anything
// we can do to improve that? Perhaps logging pretty would actually be OK?
const logger = pino({ level: process.env.LOG_LEVEL || 'debug' });
// TODO: We should be getting these from the environment as well...
const usersDB = new SQLiteUsersDB('./sqlite/baton_dev.db');
const filesDB = new SQLiteFilesDB('./sqlite/baton_dev.db');
// TODO: We should be more intelligent about where to store the files, because
// right now re-deploys delete pre-existing files. Not the worst thing in the
// world for an _ephemeral_ file storage service, but could be better.
const fileUploadPath = './uploaded/';
// TODO: Ditto environment...
const defaultFileLifetimeInDays = 7;
const env: Environment = nodeEnvToEnvironment();

switch (env as Environment) {
  case Environment.Development:
    dotenv.config({ path: './.env.development' });
    break;
  case Environment.Production:
    dotenv.config({ path: './.env.production' });
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
