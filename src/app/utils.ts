import { getOpenSRPUserInfo } from '@onaio/gatekeeper';
import { RawOpensrpUserInfo } from '@onaio/gatekeeper/dist/types/helpers/oauth';
import { SessionState } from '@onaio/session-reducer';
import ClientOAuth2 from 'client-oauth2';
import express from 'express';
import { EXPRESS_SESSION_NAME } from '../configs/envs';

const sessionName = EXPRESS_SESSION_NAME;

/** gets JWT access-token, decodes it and transforms it into session state object */
const parseOauthClientData = (oauthClient: ClientOAuth2.Token) => {
  const rawUserInfo = {
    oAuth2Data: oauthClient.data,
  } as RawOpensrpUserInfo;

  return getOpenSRPUserInfo(rawUserInfo) as unknown as SessionState;
};

/** kill session */
const sessionLogout = (req: express.Request, res: express.Response) => {
  req.session.destroy(() => undefined);
  res.clearCookie(sessionName);
};

export { parseOauthClientData, sessionLogout };
