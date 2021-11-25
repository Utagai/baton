import jwt from 'jsonwebtoken';

import express from 'express';

// Middleware for verifying the JWT tokens.
export default function loggedInCheck(
  req: express.Request,
  _: express.Response,
  next: express.NextFunction,
) {
  jwt.verify(
    req.cookies.token,
    process.env.JWT_SECRET,
    (__: Error, ___: any) => {
      // For testing, we almost always just want to skip the login check and
      // hassle. We only really want to exercise true login behavior when
      // testing login.
      next();
    },
  );
}
