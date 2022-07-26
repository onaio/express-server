import { getOpenSRPUserInfo } from '@onaio/gatekeeper';
import { SessionState } from '@onaio/session-reducer';
import ClientOAuth2 from 'client-oauth2';
import express from 'express';
import jwt from 'jsonwebtoken';
import { EXPRESS_SESSION_NAME } from '../configs/envs';

const sessionName = EXPRESS_SESSION_NAME;

/** gets JWT access-token, decodes it and transforms it into session state object */
const decodeAndparseJwtToken = (oauthClient: ClientOAuth2.Token) => {
  const tokenClaims = jwt.decode(oauthClient.accessToken) as jwt.JwtPayload | null;
  if (tokenClaims) {
    const rawUserInfo = {
      ...tokenClaims,
      oAuth2Data: oauthClient.data,
    };
    const opensrpUserInfo = getOpenSRPUserInfo(rawUserInfo) as unknown as SessionState;
    return opensrpUserInfo;
  }

  throw Error('Could not parse token');
};

/** kill session */
const sessionLogout = (req: express.Request, res: express.Response) => {
  req.session.destroy(() => undefined);
  res.clearCookie(sessionName);
};

export { decodeAndparseJwtToken, sessionLogout };
