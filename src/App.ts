import express from 'express';
import fileUpload from 'express-fileupload';
import { addDays } from 'date-fns';
import path from 'path';
import process from 'process';
import pino from 'pino';
import expressPino from 'express-pino-logger';

import FilesDB from './FilesDB';
import uploadedFile from './types';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const filesdb = new FilesDB('./sqlite/baton_dev.db');
const app = express();
const port = 8080;

app.use(express.json());
app.use(fileUpload());
app.use(expressPino({ logger }));

const defaultFileLifetimeInDays = 7;

// start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});

// A tiny helper for returning JSON errors.
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

// For the react app to hit.
app.get('/files', (_, res) => {
  const files = filesdb.getAllFiles();
  res.send({
    files,
  });
});

app.post('/upload', (req, res) => {
  const { body: uploadRequest } = req;
  const file: uploadedFile = {
    filename: uploadRequest.filename,
    filesize: parseInt(uploadRequest.filesize, 10),
    id: uploadRequest.id,
    uploadTime: new Date(),
    expireTime: addDays(new Date(), defaultFileLifetimeInDays),
  };

  const fileData = req.files?.file;
  // Check if this is one or multiple files.
  if ('mv' in fileData) {
    fileData
      .mv(`./uploaded/${file.id}${path.extname(file.filename)}`)
      .then(() => {
        const numChanged = filesdb.addFile(file);
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

app.delete('/delete/:id', (req, res) => {
  const {
    params: { id },
  } = req;

  if (filesdb.deleteFile(id) !== 1) {
    sendErr(res, `failed to delete file`, { id });
  } else {
    res.send({ id });
  }
});

app.delete('/deleteexpired', (_req, _res) => {
  filesdb.deleteExpiredFiles();
});

app.get('/download/:id', (req, res) => {
  const {
    params: { id },
  } = req;

  const file = filesdb.getFile(id);

  const fullpath = `${path.join(
    process.cwd(),
    './uploaded/',
    id,
  )}${path.extname(file.filename)}`;
  res.download(fullpath, file.filename, (err) => {
    logger.error(err, 'failed to send download to client');
    sendErr(res, 'failed to return a download', err);
  });
});
