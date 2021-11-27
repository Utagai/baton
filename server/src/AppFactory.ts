import express from 'express';
import fileUpload from 'express-fileupload';
import pino from 'pino';
import cookieParser from 'cookie-parser';
import path from 'path';

import Environment from './Environment';
import Routes from './Routes';
import { UsersDB } from './UsersDB';
import { FilesDB } from './FilesDB';
import loggedInCheck from './LoggedInCheck';
import { logRequests, logErroredRequests } from './LogRequests';

function setLoginRequiredRoutes(
  app: express.Express,
  filesDB: FilesDB,
  fileUploadPath: string,
  fileLifetimeInDays: number,
) {
  app.get('/files', Routes.files(filesDB));
  app.post(
    '/upload',
    Routes.upload(filesDB, fileUploadPath, fileLifetimeInDays),
  );
  app.delete('/delete/:id', Routes.delete(filesDB));
  app.delete('/deleteexpired', Routes.deleteExpired(filesDB));
  app.get('/download/:id', Routes.download(filesDB, fileUploadPath));
  app.get('/isLoggedIn', Routes.isLoggedIn());
}

// AppFactory hides much of the actual configuration of the express server,
// namely, its routes and some dependent components like the sqlite client.
// This serves to keep the main file where we start listening on the app
// relatively clean, and most importantly, lets our tests create express apps on
// the fly.
function AppFactory(
  env: Environment,
  logger: pino.Logger,
  usersDB: UsersDB,
  filesDB: FilesDB,
  fileUploadPath: string,
  fileLifetimeInDays: number,
): express.Express {
  const app = express();

  app.use(express.json());
  app.use(fileUpload());
  app.use(cookieParser());
  // Middleware for logging each request that comes in.
  app.use(logRequests(logger));
  // If we are in production, we should be hooking up the static build files
  // from our React app to be served on root.
  if (env === Environment.Production) {
    app.use(express.static(path.join(__dirname, '..', 'build')));

    // This endpoint does not need the user to be logged in, since this is what
    // loads the app (inlcuding /login) to begin with.
    // Furthermore, this returns an actual file/page, so it should be set before
    // we set the content type to application/json by default.
    app.get('/', Routes.index());
  }

  // Middleware for only ever returning application/json by default for all
  // remaining endpoints.
  app.use((_req, res, next) => {
    res.contentType('application/json');
    next();
  });

  // Define this before loggedinCheck, before setting the loggedInCheck middleware, since we
  // obviously cannot require login to use the /login endpoint (chicken & egg).
  app.post('/login', Routes.login(usersDB));
  app.use(loggedInCheck);

  app.use(logErroredRequests(logger));

  setLoginRequiredRoutes(app, filesDB, fileUploadPath, fileLifetimeInDays);

  return app;
}

export default AppFactory;
