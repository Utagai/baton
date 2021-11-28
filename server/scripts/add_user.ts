import 'process';

import { createPasswordHashInfo } from '../src/Password';
import { SQLiteUsersDB } from '../src/UsersDB';

// Just some sloppy validation...
const MAX_ARGS = 5;

if (process.argv.length !== MAX_ARGS) {
  console.error(
    `invalid number of arguments (${process.argv.length}); npm run adduser -- <sqlite db file> <new username> <password>`,
  );
  process.exit(1);
}

const sqliteDBFilepath = process.argv[2];
const newUsername = process.argv[3];
const plaintextPassword = process.argv[4];

console.log(
  `Going to create ${newUsername}, with password: ${'*'.repeat(
    plaintextPassword.length,
  )} @ ${sqliteDBFilepath}`,
);

const passwordHashInfo = createPasswordHashInfo(plaintextPassword);

const usersDB = new SQLiteUsersDB(sqliteDBFilepath, 'users');

usersDB.addUser({
  username: newUsername,
  passwordHashInfo,
});
