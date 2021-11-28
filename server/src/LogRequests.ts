import express from 'express';
import pino from 'pino';

export function logRequests(
  logger: pino.Logger,
): (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => void {
  return (
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
          // TODO: Maybe we should be logging request body here but being
          // smarter about when to redact it?
        },
        res: {
          statusCode: res.statusCode,
          headers: res.getHeaders(),
        },
      },
      'handling request',
    );
    next();
  };
}

export function logErroredRequests(
  logger: pino.Logger,
): (
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => void {
  return (
    err: Error,
    _: express.Request,
    __: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error({ type: 'Error', message: err.message, stack: err.stack });
    return next(err);
  };
}
