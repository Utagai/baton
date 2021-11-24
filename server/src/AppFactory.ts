import express from 'express';
import fileUpload from 'express-fileupload';
import { addDays } from 'date-fns';
import path from 'path';
import process from 'process';
import pino from 'pino';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';

import { UsersDB } from './UsersDB';
import { FilesDB } from './FilesDB';
import { passwordMatchesHash } from './Password';
import FileMetadata from './FileMetadata';

// AppFactory hides much of the actual configuration of the express server,
// namely, its routes and some dependent components like the sqlite client.
// This serves to keep the main file where we start listening on the app
// relatively clean, and most importantly, lets our tests create express apps on
// the fly.
function AppFactory(
  logger: pino.Logger,
  usersDB: UsersDB,
  filesDB: FilesDB,
  fileUploadPath: string,
  fileLifetimeInDays: number,
): express.Express {
  const app = express();
  // TODO: We should also add 'secure' here for production.
  const csrfProtection = csurf({ cookie: { httpOnly: true } });

  app.use(express.json());
  app.use(fileUpload());
  app.use(cookieParser());

  // Middleware for logging each request that comes in.
  // TODO: The middleware here and throughout should be factored out.
  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      logger.debug(
        {
          req: {
            method: req.method,
            url: req.url,
            query: req.query,
            params: req.params,
            headers: req.headers,
            remoteAddr: req.ip,
            body: req.body,
          },
          res: {
            statusCode: res.statusCode,
            headers: res.getHeaders(),
          },
        },
        'handling request',
      );
      next();
    },
  );

  // Middleware for only ever returning application/json by default.
  app.use((_req, res, next) => {
    res.contentType('application/json');
    next();
  });

  // Middleware for verifying the JWT tokens.
  const mustBeLoggedIn = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    jwt.verify(
      req.cookies.token,
      process.env.JWT_SECRET,
      (err: Error, _: any) => {
        if (err) {
          console.log('err: ', err);
          res.redirect('/');
        } else {
          next();
        }
      },
    );
  };

  // sendErr is a tiny helper for returning JSON errors from the express endpoints.
  const sendErr = (
    res: express.Response,
    msg: string,
    details?: Error | object,
  ) => {
    res.status(500).send(JSON.stringify({ msg, ...details }));
  };

  // /files returns a listing of all the files, _including_ expired files.
  app.get('/files', csrfProtection, mustBeLoggedIn, (req, res) => {
    const files = filesDB.getAllFiles();
    res.send({
      files,
    });
  });

  // /upload uploads the specified file contents. Metadata about the file is
  // created at this time as well, making the file available for listing/download
  // once this endpoint returns.
  app.post('/upload', csrfProtection, mustBeLoggedIn, (req, res) => {
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

    // sendErr(res, 'uh oh', { info: 'hello world' });

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
          sendErr(res, `failed to upload files`, err);
        });
    } else {
      sendErr(res, `cannot upload more than 1 file`, {
        attemptedCount: fileData.length,
      });
    }
  });

  // /delete/:id deletes the file specified by :id. This does not delete the file
  // on disk.
  // TODO: This _should_ delete the file on disk.
  app.delete('/delete/:id', csrfProtection, mustBeLoggedIn, (req, res) => {
    const {
      params: { id },
    } = req;

    // We do not verify the number of deletions here because the expired file
    // pruning happens asynchronously to this. What that means is that the user
    // could get into a race where they delete a file that was just pruned but
    // the UI had not yet updated. This would cause an error when it shouldn't.
    filesDB.deleteFile(id);
    res.send({ id });
  });

  // /deleteexpired triggers deletion of expired files. Expired files are not
  // deleted on disk.
  // TODO: Deletion of expired data should actually happen in the background of
  // this server or some separate process.
  app.delete('/deleteexpired', csrfProtection, mustBeLoggedIn, (_req, res) => {
    filesDB.deleteExpiredFiles();
    res.send({});
  });

  // /download/:id returns the file specified by :id as a downloadable file. This
  // should trigger a download in the user's browser.
  app.get('/download/:id', csrfProtection, mustBeLoggedIn, (req, res) => {
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
  });

  // /download/:id returns the file specified by :id as a downloadable file. This
  // should trigger a download in the user's browser.
  app.post('/login', csrfProtection, (req, res) => {
    const {
      body: { username, password: plaintextPassword },
    } = req;

    const user = usersDB.getUser(username);

    if (
      user !== undefined &&
      passwordMatchesHash(plaintextPassword, user.passwordHashInfo)
    ) {
      const jwtToken = jwt.sign({ username }, process.env.JWT_SECRET);
      res.cookie('token', jwtToken, { httpOnly: true });
      return res.send({
        jwtToken,
        antiCSRFToken: req.csrfToken(),
      });
    }

    res.status(401);
    return res.send({ err: 'failed authentication' });
  });

  app.get('/getTokens', csrfProtection, (req, res) => {
    // TODO: Although anti-CSRF token would have been a better name, it is now
    // convention that the name is simply CSRF token. We should stick with
    // convention. This applies to backend + frontend code.
    return res.send({
      jwtToken: req.cookies.token,
      antiCSRFToken: req.csrfToken(),
    });
  });

  app.use(
    (
      err: Error,
      req: express.Request,
      __: express.Response,
      next: express.NextFunction,
    ) => {
      console.log('err: ', err.name);
      // if (err.name === 'ForbiddenError') {
      //   console.log('yo req csrf: ', req.csrfToken());
      // }
      // I don't know why logger.error(err) does not do the trick :(.
      // It only shows the error code. I seem to have to get it in this format
      // for it to print out everything and do so nicely.
      logger.error({ type: 'Error', message: err.message, stack: err.stack });
      return next(err);
    },
  );
  return app;
}

export default AppFactory;
