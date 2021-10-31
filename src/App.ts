import express from 'express';
import fileUpload from 'express-fileupload';
import { addDays } from 'date-fns';
import path from 'path';
import process from 'process';
import pino from 'pino';
import expressPino from 'express-pino-logger';

import FilesDB from './FilesDB';
import File from './File';

// TODO: These things should be configurable. Environment variables are probably
// sufficient for all of these, since there aren't many of them.
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const filesDB = new FilesDB('./sqlite/baton_dev.db');
const fileUploadPath = './uploaded/';
const port = 8080;

const app = express();
app.use(express.json());
app.use(fileUpload());
app.use(expressPino({ logger }));

const defaultFileLifetimeInDays = 7;

// sendErr is a tiny helper for returning JSON errors from the express endpoints.
function sendErr(res: express.Response, msg: string, details?: Error | object) {
  logger.error(details, msg);
  if (details instanceof Error) {
    // Hide the error from the client, since it contains server-side 'internal'
    // information.
    // It likely doesn't matter cause I'm the only one that uses it, but
    // whatever.
    res.status(500).send(JSON.stringify({ msg }));
  } else {
    // TODO: We are not handling the case where details has a field named err.
    res.status(500).send(JSON.stringify({ msg, ...details }));
  }
}

// Starts the server.
app.listen(port, () => {
  logger.info(`server started at http://localhost:${port}`);
});

// /files returns a listing of all the files, _including_ expired files.
app.get('/files', (_, res) => {
  const files = filesDB.getAllFiles();
  res.send({
    files,
  });
});

// /upload uploads the specified file contents. Metadata about the file is
// created at this time as well, making the file available for listing/download
// once this endpoint returns.
app.post('/upload', (req, res) => {
  const { body: uploadRequest } = req;
  const file: File = {
    name: uploadRequest.filename,
    size: parseInt(uploadRequest.filesize, 10),
    id: uploadRequest.id,
    uploadTime: new Date(),
    expireTime: addDays(new Date(), defaultFileLifetimeInDays),
  };

  const fileData = req.files?.file;
  // Check if this is one or multiple files.
  if ('mv' in fileData) {
    fileData
      .mv(`${fileUploadPath}${file.id}${path.extname(file.name)}`)
      .then(() => {
        const numChanged = filesDB.addFile(file);
        if (numChanged === 1) {
          sendErr(res, 'failed to persist upload to metadata');
        } else {
          res.send(file);
        }
      })
      .catch((err) => {
        sendErr(res, `failed to upload files`, err);
      });
  } else {
    logger.error(
      'client attempted to upload multiple files (%d)',
      fileData.length,
    );
    sendErr(res, `cannot upload more than 1 file`, {
      attemptedCount: fileData.length,
    });
  }
});

// /delete/:id deletes the file specified by :id. This does not delete the file
// on disk.
// TODO: This _should_ delete the file on disk.
app.delete('/delete/:id', (req, res) => {
  const {
    params: { id },
  } = req;

  if (filesDB.deleteFile(id) !== 1) {
    sendErr(res, `failed to delete file`, { id });
  } else {
    res.send({ id });
  }
});

// /deleteexpired triggers deletion of expired files. Expired files are not
// deleted on disk.
// TODO: Deletion of expired data should actually happen in the background of
// this server or some separate process.
app.delete('/deleteexpired', (_req, _res) => {
  filesDB.deleteExpiredFiles();
});

// /download/:id returns the file specified by :id as a downloadable file. This
// should trigger a download in the user's browser.
app.get('/download/:id', (req, res) => {
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
    logger.error(err, 'failed to send download to client');
    sendErr(res, 'failed to return a download', err);
  });
});
