import express from 'express';

const app = express();
const port = 8080; // default port to listen

// define a route handler for the default home page
app.get('/', (_: express.Request, res: express.Response) => {
  res.send('Hello world!');
});

// start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});

// For the react app to hit.
app.get('/express_backend', (_: express.Request, res: express.Response) => {
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
