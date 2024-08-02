import { NextFunction, Request, Response } from 'express';
import { getImportQueue } from './queue';
import { getRedisClient } from '../../helpers/redisClient';

// Ensures that requests are authenticated
export const sessionChecker = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.preloadedState) {
    return res.json({ error: 'Not authorized' });
  }

  next();
};

/** Checks that redis is enabled for the data import */
export const redisRequiredMiddleWare = (_: Request, res: Response, next: NextFunction) => {
  const redisClient = getRedisClient();
  const importQ = getImportQueue();
  if (!redisClient || !importQ) {
    return res.json({ error: 'No redis connection found. Redis is required to enable this feature.' });
  }
  next();
};

export const importRouterErrorhandler = (err: Error, req: Request, res: Response, _: NextFunction) => {
  // log error
  res.status(500).send(err.message);
};
