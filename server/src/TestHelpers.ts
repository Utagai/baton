// TODO: We should be moving this and our other test files into a __test__
// directory for cleanliness. And then removing the Test prefix from this file.
//
import pino from 'pino';

import Environment from './Environment';
import { SQLiteUsersDB } from './UsersDB';
import { SQLiteFilesDB } from './FilesDB';
import AppFactory from './AppFactory';
import { createPasswordHashInfo } from './Password';

export const testLogLevel = 'debug';
export const testSQLiteDBFile = './sqlite/baton_test.db';
export const testUploadPath = './uploaded-test/';
export const testDefaultFileLifetime = 1;

export function getTestTableName(prefix: string, currentTestName: string) {
  return `${prefix}_${currentTestName.replace(/ /g, '_')}`;
}

export function getTestUsersDB(currentTestName: string) {
  const testTableName = getTestTableName('users', currentTestName);
  return new SQLiteUsersDB(testSQLiteDBFile, testTableName);
}

export function getTestFilesDB(currentTestName: string) {
  const testTableName = getTestTableName('files', currentTestName);
  return new SQLiteFilesDB(testSQLiteDBFile, testTableName);
}

export function getTestApp(currentTestName: string) {
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
    Environment.Development,
    logger,
    usersDB,
    filesDB,
    fileUploadPath,
    defaultFileLifetimeInDays,
  );
}

export const testUsername = 'test';
export const testPlaintextPassword = 'helloworld';

export function addTestUserToDB(currentTestName: string) {
  const usersDB = getTestUsersDB(currentTestName);
  const testPasswordHashInfo = createPasswordHashInfo(testPlaintextPassword);
  expect(
    usersDB.addUser({
      username: testUsername,
      passwordHashInfo: testPasswordHashInfo,
    }),
  ).toBe(1);
}
