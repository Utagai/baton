import jwt from 'jsonwebtoken';

import express from 'express';

// Middleware for verifying the JWT tokens.
export default function loggedInCheck(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  jwt.verify(
    req.cookies.token,
    process.env.JWT_SECRET,
    (err: Error, _: any) => {
      if (err) {
        res.status(403).send({ msg: 'failed to authenticate' });
      } else {
        next();
      }
    },
  );
}
