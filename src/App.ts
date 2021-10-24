import express from 'express';
import fileUpload from 'express-fileupload';
import { addFile, getFiles } from './SQLite';
import uploadedFile from './types';

const app = express();
const port = 8080; // default port to listen

app.use(express.json());
app.use(fileUpload());

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
  console.log('hello babie!');
  const files = getFiles();
  res.send({
    files,
  });
});

app.post('/upload', (req, res) => {
  const { body: uploadRequest } = req;
  console.log('filename: ', uploadRequest);
  const file: uploadedFile = {
    filename: uploadRequest.filename,
    filesize: parseInt(uploadRequest.filesize, 10),
    id: uploadRequest.id,
    uploadTime: new Date(),
    expireTime: new Date(), // TODO: This is not a real expiration time, yet.
  };

  const fileData = req.files?.file;
  if ('mv' in fileData) {
    // Check if this is one or multiple files.
    fileData
      .mv(`./uploaded/${fileData.name}`)
      .then(() => {
        console.log('uploaded, now adding file to metadata');
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

// Need to implement:
// An endpoint that accepts arbitrary binary upload.
//  Should support file upload from browser.
//  Should also support straight binary upload (e.g. text inputted into text
//  input).
//  UI updates to include a button for this.
