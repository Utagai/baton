import express from 'express';

const app = express();
const port = 8080; // default port to listen

// define a route handler for the default home page
app.get('/', (_: any, res: any) => {
  res.send('Hello world!');
});

// start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});

// For the react app to hit.
app.get('/express_backend', (_: any, res: any) => {
  console.log('hello babie!');
  res.send({
    express: ['hello', 'world', 'from', 'express'],
  });
});
