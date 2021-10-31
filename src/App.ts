import express from 'express';
import fileUpload from 'express-fileupload';
import { addDays } from 'date-fns';
import path from 'path';
import process from 'process';
import pino from 'pino';
import expressPino from 'express-pino-logger';

import {
  addFile,
  deleteFile,
  deleteExpiredFiles,
  getFile,
  getFiles,
} from './SQLite';
import uploadedFile from './types';

const defaultFileLifetimeInDays = 7;

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
const port = 8080; // default port to listen

app.use(express.json());
app.use(fileUpload());
app.use(expressPino({ logger }));

// define a route handler for the default home page
app.get('/', (_, res) => {
  res.send('Hello world!');
});

// start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});

// For the react app to hit.
app.get('/files', (_, res) => {
  const files = getFiles();
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
  if ('mv' in fileData) {
    // Check if this is one or multiple files.
    fileData
      .mv(`./uploaded/${file.id}${path.extname(file.filename)}`)
      .then(() => {
        if (addFile(file) !== 1) {
          res.status(500).send('failed to persist upload to metadata');
        } else {
          res.send(file);
        }
      })
      .catch((err) => res.status(500).send(`failed to upload files ${err}`));
  } else {
    res
      .status(400)
      .send(
        `cannot upload more than 1 file (tried to upload ${fileData.length})`,
      );
  }
});

app.delete('/delete/:id', (req, res) => {
  const {
    params: { id },
  } = req;

  if (deleteFile(id) !== 1) {
    res.status(500).send(`failed to delete file with id ${id}`);
  } else {
    res.send({ id });
  }
});

app.delete('/deleteexpired', (_req, _res) => {
  deleteExpiredFiles();
});

app.get('/download/:id', (req, res) => {
  const {
    params: { id },
  } = req;

  const file = getFile(id);

  const fullpath = `${path.join(
    process.cwd(),
    './uploaded/',
    id,
  )}${path.extname(file.filename)}`;
  res.download(fullpath, file.filename, (err) => {
    res.status(500).send(err);
  });
});
