import express from 'express';
import fileUpload from 'express-fileupload';
import { addFile } from './SQLite';
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
app.get('/express_backend', (_, res) => {
  console.log('hello babie!');
  res.send({
    express: [
      {
        filename: 'pretty.jpg',
        filesize: '7 MB',
        uploadTime: 'October 23, 9:23 PM',
        expireTime: '18 hours',
      },
      {
        filename: 'data.json',
        filesize: '1.2 GB',
        uploadTime: 'October 23, 9:23 PM',
        expireTime: '6 hours',
      },
      {
        filename: 'article_link.txt',
        filesize: '53 B',
        uploadTime: 'October 22, 1:44 AM',
        expireTime: '12 minutes',
      },
    ],
  });
});

app.post('/upload', (req, res) => {
  const { body: uploadRequest } = req;
  console.log('filename: ', uploadRequest);
  const file: uploadedFile = {
    filename: uploadRequest.filename,
    filesize: uploadRequest.filesize,
    uploadTime: new Date(),
    expireTime: new Date(), // TODO: This is not a real expiration time, yet.
  };

  const fileData = req.files?.file;
  if ('mv' in fileData) {
    fileData
      .mv(`./uploaded/${fileData.name}`)
      .then(() => {
        console.log('uploaded, now adding file to metadata');
        if (addFile(file) !== 1) {
          res.status(500).send('failed to persist upload to metadata');
        } else {
          res.send({ uploaded: true });
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
