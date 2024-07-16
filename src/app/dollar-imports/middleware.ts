import { NextFunction, Request, Response } from 'express';
import { importQ } from './queue';
import { generateImporterSCriptConfig, writeImporterScriptConfig } from './importerConfigWriter';
import { redisClient } from '../helpers/redisClient';

// Ensures that requests are authenticated
export const sessionChecker = (req: Request, res: Response, next: NextFunction) => {
  // if(false){
  // }
  console.log('Invoked');
  if (!req.session.preloadedState) {
    return res.json({ error: 'Not authorized' });
  }

  next();
};

/** Checks that redis is enabled for the data import */
export const redisRequiredMiddleWare = (_: Request, res: Response, next: NextFunction) => {
  if (!redisClient || !importQ) {
    console.log('++++++++++++++++++++++', !redisClient, !importQ);
    return res.json({ error: 'No redis connection found. Redis is required to enable this feature.' });
  }
  next();
};

/** A middleware that writes the bulk upload importer config. */
export const writeImporterConfigMiddleware = async (req: Request, __: Response, next: NextFunction) => {
  const accessToken = req.session.preloadedState?.session?.extraData?.oAuth2Data?.access_token;
  const refreshToken = req.session.preloadedState?.session?.extraData?.oAuth2Data?.refresh_token;
  const importerConfig = generateImporterSCriptConfig(accessToken, refreshToken);
  await writeImporterScriptConfig(importerConfig);
  next();
};
