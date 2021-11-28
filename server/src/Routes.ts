import express from 'express';
import { addDays } from 'date-fns';
import path from 'path';
import jwt from 'jsonwebtoken';
import process from 'process';

import FileMetadata from './FileMetadata';
import { passwordMatchesHash } from './Password';
import { UsersDB } from './UsersDB';
import { FilesDB } from './FilesDB';

// sendErr is a tiny helper for returning JSON errors from the express endpoints.
function sendErr(res: express.Response, msg: string, details?: Error | object) {
  res.status(500).send(JSON.stringify({ msg, ...details }));
}

const Routes = {
  // Returns the React app.
  index: (): express.RequestHandler => (_, res) => {
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
  },
  // Returns a listing of all the files, _including_ expired files.
  files:
    (filesDB: FilesDB): express.RequestHandler =>
    (_, res) => {
      const files = filesDB.getAllFiles();
      res.send({
        files,
      });
    },

  // Uploads the specified file contents. Metadata about the file is
  // created at this time as well, making the file available for listing/download
  // once this endpoint returns.
  upload:
    (
      filesDB: FilesDB,
      fileUploadPath: string,
      fileLifetimeInDays: number,
    ): express.RequestHandler =>
    (req, res) => {
      const { body: uploadRequest } = req;
      if (!uploadRequest.name || !uploadRequest.id || !uploadRequest.size) {
        sendErr(
          res,
          'expected "name", "id", and "size" parameters in the form data',
          { got: uploadRequest },
        );
        return;
      }
      const file: FileMetadata = {
        name: uploadRequest.name,
        size: parseInt(uploadRequest.size, 10),
        id: uploadRequest.id,
        uploadTime: new Date(),
        expireTime: addDays(new Date(), fileLifetimeInDays),
      };

      const fileData = req.files?.file;
      // Check if this is one or multiple files.
      if ('mv' in fileData) {
        fileData
          .mv(`${fileUploadPath}${file.id}${path.extname(file.name)}`)
          .then(() => {
            const numChanged = filesDB.addFile(file);
            if (numChanged !== 1) {
              sendErr(res, 'failed to persist upload to metadata', {
                numChanged,
              });
              return;
            }
            res.send(file);
          })
          .catch((err) => {
            // TODO: This error seems to not be logged?
            sendErr(res, `failed to upload files`, err);
          });
      } else {
        sendErr(res, `cannot upload more than 1 file`, {
          attemptedCount: fileData.length,
        });
      }
    },
  // Deletes the file specified by :id. This does not delete the file
  // on disk.
  // TODO: This _should_ delete the file on disk.
  delete:
    (filesDB: FilesDB): express.RequestHandler =>
    (req, res) => {
      const {
        params: { id },
      } = req;

      // We do not verify the number of deletions here because the expired file
      // pruning happens asynchronously to this. What that means is that the user
      // could get into a race where they delete a file that was just pruned but
      // the UI had not yet updated. This would cause an error when it shouldn't.
      filesDB.deleteFile(id);
      res.send({ id });
    },
  // Triggers deletion of expired files. Expired files are not
  // deleted on disk.
  // TODO: Deletion of expired data should actually happen in the background of
  // this server or some separate process.
  deleteExpired:
    (filesDB: FilesDB): express.RequestHandler =>
    (_, res) => {
      filesDB.deleteExpiredFiles();
      res.send({});
    },
  // Returns the file specified by :id as a downloadable file. This
  // should trigger a download in the user's browser.
  download:
    (filesDB: FilesDB, fileUploadPath: string): express.RequestHandler =>
    (req, res) => {
      const {
        params: { id },
      } = req;

      const file = filesDB.getFile(id);

      const fullpath = `${path.join(
        process.cwd(),
        fileUploadPath,
        id,
      )}${path.extname(file.name)}`;
      res.download(fullpath, file.name, (err) => {
        if (!res.headersSent) {
          if (err.message === 'Not Found') {
            res.status(404);
          } else {
            res.status(500);
          }
          res.send({ msg: err.message });
        }
      });
    },
  // Checks the given username/password and logs in the user if they match a
  // known user in the users database.
  login:
    (usersDB: UsersDB): express.RequestHandler =>
    (req, res) => {
      const {
        body: { username, password: plaintextPassword },
      } = req;

      // TODO: Something in this endpoint seems to fail if we start with a fresh
      // sqlite file and run adduser on the remote machine... Maybe we can repro
      // this locally?
      const user = usersDB.getUser(username);

      if (
        user !== undefined &&
        passwordMatchesHash(plaintextPassword, user.passwordHashInfo)
      ) {
        const jwtToken = jwt.sign({ username }, process.env.JWT_SECRET);
        res.cookie('token', jwtToken, { httpOnly: true });
        return res.send({});
      }

      res.status(403);
      return res.send({ err: 'failed authentication' });
    },
  // Checks if the client sending the request is logged in and therefore
  // authenticated.
  isLoggedIn: (): express.RequestHandler => (_, res) => {
    // Due to our login-checking middleware, this code will only ever be
    // executed if the user is already logged in, so simply return 200.
    res.send({});
  },
};

export default Routes;
