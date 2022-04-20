import { getOpenSRPUserInfo } from '@onaio/gatekeeper';
import ClientOAuth2 from 'client-oauth2';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import fetch from 'node-fetch';
import morgan from 'morgan';
import path from 'path';
import querystring from 'querystring';
import request from 'request';
import sessionFileStore from 'session-file-store';
import { parse } from 'url';
import { winstonLogger, winstonStream } from '../configs/winston';
import {
  EXPRESS_ALLOW_TOKEN_RENEWAL,
  EXPRESS_FRONTEND_LOGIN_URL,
  EXPRESS_FRONTEND_OPENSRP_CALLBACK_URL,
  EXPRESS_MAXIMUM_SESSION_LIFE_TIME,
  EXPRESS_KEYCLOAK_LOGOUT_URL,
  EXPRESS_OPENSRP_ACCESS_TOKEN_URL,
  EXPRESS_OPENSRP_AUTHORIZATION_URL,
  EXPRESS_OPENSRP_CALLBACK_URL,
  EXPRESS_OPENSRP_CLIENT_ID,
  EXPRESS_OPENSRP_CLIENT_SECRET,
  EXPRESS_OPENSRP_LOGOUT_URL,
  EXPRESS_OPENSRP_OAUTH_STATE,
  EXPRESS_OPENSRP_USER_URL,
  EXPRESS_REACT_BUILD_PATH,
  EXPRESS_SERVER_LOGOUT_URL,
  EXPRESS_SESSION_FILESTORE_PATH,
  EXPRESS_SESSION_LOGIN_URL,
  EXPRESS_SESSION_NAME,
  EXPRESS_SESSION_PATH,
  EXPRESS_SESSION_SECRET,
} from '../configs/envs';
import { SESSION_IS_EXPIRED, TOKEN_NOT_FOUND, TOKEN_REFRESH_FAILED } from '../constants';
import { getOriginFromUrl } from '../utils';

type Dictionary = { [key: string]: unknown };

const opensrpAuth = new ClientOAuth2({
  accessTokenUri: EXPRESS_OPENSRP_ACCESS_TOKEN_URL,
  authorizationUri: EXPRESS_OPENSRP_AUTHORIZATION_URL,
  clientId: EXPRESS_OPENSRP_CLIENT_ID,
  clientSecret: EXPRESS_OPENSRP_CLIENT_SECRET,
  redirectUri: EXPRESS_OPENSRP_CALLBACK_URL,
  scopes: ['read', 'write'],
  state: EXPRESS_OPENSRP_OAUTH_STATE,
});
const loginURL = EXPRESS_SESSION_LOGIN_URL;
const sessionName = EXPRESS_SESSION_NAME;

const app = express();

app.use(compression()); // Compress all routes
// helps mitigate cross-site scripting attacks and other known vulnerabilities
app.use(
  helmet({
    // override default contentSecurityPolicy directive like script-src to include cloudflare cdn and github static content
    // might consider turning this off to allow individual front-ends set Content-Security-Policy on meta tags themselves if list grows long
    // <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'  https://cdnjs.cloudflare.com;" >
    contentSecurityPolicy: {
      directives: {
        'script-src': ["'self'", 'https://cdnjs.cloudflare.com', "'unsafe-inline'"],
        'img-src': ["'self'", 'https://github.com', 'https://*.githubusercontent.com'],
        // allow connection from keycloak and opensrp server
        'connect-src': [
          "'self'",
          ...getOriginFromUrl(EXPRESS_OPENSRP_AUTHORIZATION_URL),
          ...getOriginFromUrl(EXPRESS_OPENSRP_USER_URL),
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(morgan('combined', { stream: winstonStream })); // send logs to winston

const FileStore = sessionFileStore(session);
const fileStoreOptions: sessionFileStore.Options = {
  path: EXPRESS_SESSION_FILESTORE_PATH || './sessions',
  // channel session-file-store warnings to winston
  logFn: (message) => winstonLogger.info(message),
};

let nextPath: string | undefined;

const sess = {
  cookie: {
    httpOnly: true,
    path: EXPRESS_SESSION_PATH || '/',
    secure: false,
  },
  name: sessionName,
  resave: true,
  saveUninitialized: true,
  secret: EXPRESS_SESSION_SECRET || 'hunter2',
  store: new FileStore(fileStoreOptions),
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  sess.cookie.secure = true; // serve secure cookies
}

app.use(cookieParser());
app.use(session(sess));

class HttpException extends Error {
  public statusCode: number;

  public message: string;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

const handleError = (err: HttpException, res: express.Response) => {
  const { message } = err;
  if (message.includes('resource owner or authorization server denied the request')) {
    return res.redirect(EXPRESS_FRONTEND_LOGIN_URL);
  }
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    message,
    status: 'error',
    statusCode,
  });
};

const BUILD_PATH = EXPRESS_REACT_BUILD_PATH;
const filePath = path.resolve(BUILD_PATH, 'index.html');

// need to add docstrings and type defs
const renderer = (_: express.Request, res: express.Response) => {
  res.sendFile(filePath);
};

const oauthLogin = (_: express.Request, res: express.Response) => {
  const provider = opensrpAuth;
  const uri = provider.code.getUri();
  res.redirect(uri);
};

const processUserInfo = (
  req: express.Request,
  res: express.Response,
  authDetails: Dictionary,
  userDetails?: Dictionary,
  isRefresh?: boolean,
) => {
  // get user details from session. will be needed when refreshing token
  const userInfo = userDetails ?? req.session.preloadedState?.session?.extraData ?? {};
  const date = new Date(Date.now());
  const sessionExpiryTime = req.session.preloadedState?.session_expires_at;
  const sessionExpiresAt = isRefresh
    ? sessionExpiryTime
    : new Date(date.setSeconds(date.getSeconds() + EXPRESS_MAXIMUM_SESSION_LIFE_TIME)).toISOString();
  userInfo.oAuth2Data = authDetails;
  const sessionState = getOpenSRPUserInfo(userInfo);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (sessionState) {
    const gatekeeperState = {
      success: true,
      result: sessionState.extraData,
    };
    const preloadedState = {
      gatekeeper: gatekeeperState,
      session: sessionState,
      session_expires_at: sessionExpiresAt,
    };
    req.session.preloadedState = preloadedState;
    const expireAfterMs = (sessionState.extraData?.oAuth2Data.refresh_expires_in as number) * 1000;
    req.session.cookie.maxAge = expireAfterMs;
    // you have to save the session manually for POST requests like this one
    req.session.save(() => undefined);
    // when refreshing token we only need the preloaded state
    if (isRefresh) {
      return preloadedState;
    }
    if (nextPath) {
      /** reset nextPath to undefined; its value once set should only be used
       * once and invalidated after being used, which is here. Failing to invalidate the previous value
       * would result in the user being redirected to the same url the next time they pass through
       * here irrespective of whether they should or shouldn't
       */
      const localNextPath = nextPath;
      nextPath = undefined;
      return res.redirect(localNextPath);
    }
    return res.redirect(EXPRESS_FRONTEND_OPENSRP_CALLBACK_URL);
  }
};

const refreshToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // check if token refreshing is allowed
  if (!EXPRESS_ALLOW_TOKEN_RENEWAL) {
    winstonLogger.info(SESSION_IS_EXPIRED);
    return res.status(500).send({ message: SESSION_IS_EXPIRED });
  }
  const accessToken = req.session.preloadedState?.session?.extraData?.oAuth2Data?.access_token;
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const refreshToken = req.session.preloadedState?.session?.extraData?.oAuth2Data?.refresh_token;
  const sessionExpiryTime = req.session.preloadedState?.session_expires_at;
  if (!accessToken || !refreshToken || !sessionExpiryTime) {
    winstonLogger.info(TOKEN_NOT_FOUND);
    return res.status(500).send({ message: TOKEN_NOT_FOUND });
  }
  // check if session set maxmum life is exceeded
  if (new Date(Date.now()) >= new Date(sessionExpiryTime)) {
    winstonLogger.info(SESSION_IS_EXPIRED);
    return res.status(500).send({ message: SESSION_IS_EXPIRED });
  }
  const provider = opensrpAuth;
  // re-create an access token instance
  const token = provider.createToken(accessToken, refreshToken);
  return token
    .refresh()
    .then((oauthRes) => {
      const preloadedState = processUserInfo(req, res, oauthRes.data, undefined, true);
      return res.json(preloadedState);
    })
    .catch((error: Error) => {
      next(error); // pass error to express
      return res.status(500).send({ message: error.message || TOKEN_REFRESH_FAILED });
    });
};

const oauthCallback = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const provider = opensrpAuth;
  provider.code
    .getToken(req.originalUrl)
    .then((user: ClientOAuth2.Token) => {
      const url = EXPRESS_OPENSRP_USER_URL;
      request.get(
        url,
        user.sign({
          method: 'GET',
          url,
        }),
        (error: Error, _: request.Response, body: string) => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (error) {
            next(error); // pass error to express
          }
          let apiResponse: Dictionary;
          try {
            const { state } = req.query;
            if (state && typeof state === 'string') nextPath = state;
            apiResponse = JSON.parse(body);
            processUserInfo(req, res, user.data, apiResponse);
          } catch (__) {
            res.redirect('/logout?serverLogout=true');
          }
        },
      );
    })
    .catch((e: Error) => {
      next(e); // pass error to express
    });
};

const oauthState = (req: express.Request, res: express.Response) => {
  // check if logged in
  if (!req.session.preloadedState) {
    winstonLogger.info('Not authorized');
    return res.json({ error: 'Not authorized' });
  }
  // only return this when user has valid session
  return res.json(req.session.preloadedState);
};

const loginRedirect = (req: express.Request, res: express.Response, _: express.NextFunction) => {
  // check if logged in and redirect
  const parsedUrl = parse(req.originalUrl);
  const searchParam = parsedUrl.search;
  if (searchParam) {
    let searchString = searchParam;
    // remove the leading '?'
    if (searchParam.charAt(0) === '?') {
      searchString = searchParam.replace('?', '');
    }
    const searchParams = querystring.parse(searchString);
    nextPath = searchParams.next as string | undefined;
  }
  const localNextPath = nextPath || '/';

  return req.session.preloadedState
    ? res.redirect(localNextPath)
    : res.redirect(`${EXPRESS_FRONTEND_LOGIN_URL}/${localNextPath.replace('/', '')}`);
};

const logout = async (req: express.Request, res: express.Response) => {
  if (req.query.serverLogout) {
    const accessToken = req.session.preloadedState?.session?.extraData?.oAuth2Data?.access_token;
    const payload = {
      headers: {
        accept: 'application/json',
        contentType: 'application/json;charset=UTF-8',
        authorization: `Bearer ${accessToken}`,
      },
      method: 'GET',
    };
    if (accessToken) {
      await fetch(EXPRESS_OPENSRP_LOGOUT_URL, payload);
    }
    const keycloakLogoutFullPath = `${EXPRESS_KEYCLOAK_LOGOUT_URL}?redirect_uri=${EXPRESS_SERVER_LOGOUT_URL}`;
    res.redirect(keycloakLogoutFullPath);
  } else {
    req.session.destroy(() => undefined);
    res.clearCookie(sessionName);
    res.redirect(loginURL);
  }
};

// OAuth views
const router = express.Router();
router.use('/oauth/opensrp', oauthLogin);
router.use('/oauth/callback/OpenSRP', oauthCallback);
router.use('/oauth/state', oauthState);
router.use('/refresh/token', refreshToken);
// handle login
router.use(loginURL, loginRedirect);
// logout
router.use('/logout', logout);

// render React app
router.use('^/$', renderer);
// other static resources should just be served as they are
router.use(express.static(BUILD_PATH, { maxAge: '30d' }));
// sends other routes to be handled by React Router
router.use('*', renderer);

// tell the app to use the above rules
app.use(router);

export const errorHandler = (
  err: HttpException,
  _: express.Request,
  res: express.Response,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __: express.NextFunction,
) => {
  winstonLogger.error(`${err.statusCode || 500} - ${err.message}-${JSON.stringify(err.stack)}`);
  handleError(err, res);
};

app.use(errorHandler);

export default app;
