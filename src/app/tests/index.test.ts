import fetch from 'node-fetch';
import MockDate from 'mockdate';
import ClientOauth2 from 'client-oauth2';
import nock from 'nock';
import request from 'supertest';
import express from 'express';
import RedisMock from 'ioredis-mock';
import Redis from 'ioredis';
import {
  EXPRESS_FRONTEND_OPENSRP_CALLBACK_URL,
  EXPRESS_SESSION_LOGIN_URL,
  EXPRESS_KEYCLOAK_LOGOUT_URL,
  EXPRESS_SERVER_LOGOUT_URL,
  EXPRESS_OPENSRP_LOGOUT_URL,
  EXPRESS_FRONTEND_LOGIN_URL,
} from '../../configs/envs';
import app, { errorHandler } from '../index';
import { oauthState, parsedApiResponse, unauthorized } from './fixtures';
import { winstonLogger } from '../../configs/winston';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { extractCookies } = require('./utils');

const authorizationUri = 'http://reveal-stage.smartregister.org/opensrp/oauth/';
const oauthCallbackUri = '/oauth/callback/OpenSRP/?code=Boi4Wz&state=opensrp';

const panic = (err: Error, done: jest.DoneCallback): void => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (err) {
    done(err);
  }
};

jest.mock('ioredis', () => RedisMock);
jest.mock('../../configs/envs');
// mock out winston logger and stream methods - reduce log noise in test output
jest.mock('../../configs/winston', () => ({
  winstonLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
  winstonStream: {
    write: jest.fn(),
  },
}));
jest.mock('node-fetch');

jest.mock('client-oauth2', () => {
  class CodeFlow {
    private client: ClientOauth2;

    public constructor(client: ClientOauth2) {
      this.client = client;
    }

    // eslint-disable-next-line class-methods-use-this
    public getUri() {
      return authorizationUri;
    }

    public async getToken() {
      return this.client.token;
    }
  }
  // tslint:disable-next-line: max-classes-per-file
  class TokenFlow {
    public data = (() => ({
      access_token: '64dc9918-fa1c-435d-9a97-ddb4aa1a8316',
      expires_in: 3221,
      refresh_expires_in: 2592000,
      refresh_token: '808f060c-be93-459e-bd56-3074d9b96229',
      scope: 'read write',
      token_type: 'bearer',
    }))();

    public client: ClientOauth2;

    public constructor(client: ClientOauth2) {
      this.client = client;
    }

    // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-explicit-any
    public sign(_: any) {
      return { url: 'http://someUrl.com' };
    }

    public async refresh() {
      return { data: this.data };
    }
  }

  // tslint:disable-next-line: max-classes-per-file
  return class ClientOAuth2 {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public code = (() => new CodeFlow(this as any))();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public token = (() => new TokenFlow(this as any))();

    public options: ClientOauth2.Options;

    public request: ClientOauth2.Request;

    public constructor(options: ClientOauth2.Options, req: ClientOauth2.Request) {
      this.options = options;
      this.request = req;
    }

    public createToken = () => this.token;
  };
});

describe('src/index.ts', () => {
  const actualJsonParse = JSON.parse;
  let sessionString: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cookie: { [key: string]: any };

  afterEach((done) => {
    JSON.parse = actualJsonParse;
    jest.resetAllMocks();
    jest.clearAllMocks();
    new Redis()
      .flushall()
      .then(() => done())
      .catch((err) => panic(err, done));
  });

  it('serves the build.index.html file', (done) => {
    request(app)
      .get('/')
      .expect(200)
      .expect((res) => {
        const csp = res.headers['content-security-policy'];
        expect(csp).toContain(`default-src 'self';report-uri https://example.com;`);
      })
      .expect('Do you mind\n')
      .catch((err: Error) => {
        throw err;
      })
      .finally(() => {
        done();
      });
  });

  it('oauth/opensrp redirects to auth-server', (done) => {
    request(app)
      .get('/oauth/opensrp')
      .expect(302)
      .then((res: request.Response) => {
        expect(res.header.location).toEqual(authorizationUri);
        expect(res.notFound).toBeFalsy();
        expect(res.redirect).toBeTruthy();
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });

  it('E2E: oauth/opensrp/callback works correctly', (done) => {
    MockDate.set('1/1/2020');
    JSON.parse = (body) => {
      if (body === '{}') {
        return parsedApiResponse;
      }
    };
    nock('http://reveal-stage.smartregister.org').get('/opensrp/user-details').reply(200, {});

    request(app)
      .get(oauthCallbackUri)
      .then((res: request.Response) => {
        expect(res.header.location).toEqual(EXPRESS_FRONTEND_OPENSRP_CALLBACK_URL);
        expect(res.notFound).toBeFalsy();
        expect(res.redirect).toBeTruthy();
        // eslint-disable-next-line prefer-destructuring
        sessionString = res.header['set-cookie'][0].split(';')[0];
        cookie = extractCookies(res.header);
        // expect that cookie will expire in: now(a date mocked to be in the future) + token.expires_in
        expect(cookie['reveal-session'].flags).toEqual({
          Expires: 'Fri, 31 Jan 2020 00:00:00 GMT',
          HttpOnly: true,
          Path: '/',
        });
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });

  it('/oauth/state works correctly without cookie', (done) => {
    request(app)
      .get('/oauth/state')
      .then((res: request.Response) => {
        expect(res.body).toEqual(unauthorized);
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });

  it('/oauth/state works correctly with cookie', (done) => {
    MockDate.set('1/1/2020');
    request(app)
      .get('/oauth/state')
      .set('cookie', sessionString)
      .then((res: request.Response) => {
        expect(res.body).toEqual(oauthState);
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });

  it('/refresh/token works correctly', (done) => {
    MockDate.set('1/1/2020');
    // when no session is found
    request(app)
      .get('/refresh/token')
      .then((res: request.Response) => {
        expect(res.status).toEqual(500);
        expect(res.body).toEqual({ message: 'Access token or Refresh token not found' });
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });

    // call refresh token
    request(app)
      .get('/refresh/token')
      .set('cookie', sessionString)
      .then((res: request.Response) => {
        expect(res.body).toEqual(oauthState);
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });

  it('/refresh/token works correctly when session life time is exceeded', (done) => {
    MockDate.set('1/2/2020');
    request(app)
      .get('/refresh/token')
      .set('cookie', sessionString)
      .then((res: request.Response) => {
        expect(res.status).toEqual(500);
        expect(res.body).toEqual({
          message: 'Session is Expired',
        });
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });

  it('/refresh/token does not change session expiry date', (done) => {
    // change date
    MockDate.set('1/1/2019');
    request(app)
      .get('/refresh/token')
      .set('cookie', sessionString)
      .then((res: request.Response) => {
        expect(res.body.session_expires_at).toEqual(oauthState.session_expires_at);
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });

  it('Accessing login url when next path is undefined and logged in', (done) => {
    // when logged in and nextPath is not provided, redirect to home
    request(app)
      .get('/login')
      .set('cookie', sessionString)
      .expect(302)
      .then((res: request.Response) => {
        expect(res.header.location).toEqual('/');
        expect(res.redirect).toBeTruthy();
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });
  it('Accessing login url when next Path is defined and logged in', (done) => {
    // when logged in and nextPath is not provided, redirect to home
    request(app)
      .get('/login?next=%2Fteams')
      .set('cookie', sessionString)
      .expect(302)
      .then((res: request.Response) => {
        expect(res.header.location).toEqual('/teams');
        expect(res.redirect).toBeTruthy();
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });

  it('logs user out from opensrp and calls keycloak', (done) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fetch as any).mockImplementation(() => Promise.resolve('successfull'));
    request(app)
      .get('/logout?serverLogout=true')
      .set('Cookie', sessionString)
      .then((res: request.Response) => {
        expect(res.header.location).toEqual(`${EXPRESS_KEYCLOAK_LOGOUT_URL}?redirect_uri=${EXPRESS_SERVER_LOGOUT_URL}`);
        expect(res.redirect).toBeTruthy();
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(EXPRESS_OPENSRP_LOGOUT_URL, {
          headers: {
            accept: 'application/json',
            authorization: 'Bearer 64dc9918-fa1c-435d-9a97-ddb4aa1a8316',
            contentType: 'application/json;charset=UTF-8',
          },
          method: 'GET',
        });
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });

  it('oauth/opensrp/callback works correctly if response is not stringfied JSON', (done) => {
    MockDate.set('1/1/2020');
    JSON.parse = (body) => {
      if (body === '{}') {
        return 'string';
      }
    };
    nock('http://reveal-stage.smartregister.org').get('/opensrp/user-details').reply(200, {});

    request(app)
      .get(oauthCallbackUri)
      .then((res: request.Response) => {
        expect(res.header.location).toEqual('/logout?serverLogout=true');
        expect(res.notFound).toBeFalsy();
        expect(res.redirect).toBeTruthy();
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });

  it('logs user out with cookie', (done) => {
    request(app)
      .get('/logout')
      .set('Cookie', sessionString)
      .then((res: request.Response) => {
        expect(res.header.location).toEqual(EXPRESS_SESSION_LOGIN_URL);
        expect(res.redirect).toBeTruthy();
        // check that session is revoked
        request(app)
          .get('/oauth/state')
          .then((r: request.Response) => {
            expect(r.body).toEqual(unauthorized);
            done();
          })
          .catch((e: Error) => {
            panic(e, done);
          });
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });

  it('Accessing login url when you are logged out', (done) => {
    // this returns express frontend login url when logged out
    request(app)
      .get('/login')
      .expect(302)
      .then((res: request.Response) => {
        expect(res.header.location).toEqual(EXPRESS_FRONTEND_LOGIN_URL);
        expect(res.redirect).toBeTruthy();
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });

  it('/refresh/token works correctly when refresh is not allowed', (done) => {
    MockDate.set('1/1/2020');
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const envModule = require('../../configs/envs');
    envModule.EXPRESS_ALLOW_TOKEN_RENEWAL = false;
    // call refresh token
    request(app)
      .get('/refresh/token')
      .then((res: request.Response) => {
        expect(res.status).toEqual(500);
        expect(res.body).toEqual({
          message: 'Session is Expired',
        });
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });

  it('handle error middleware works', (done) => {
    const winston = jest.spyOn(winstonLogger, 'error');
    const res = {} as express.Response;
    res.redirect = jest.fn();
    res.status = jest.fn().mockImplementation(() => {
      return { json: jest.fn() };
    });

    errorHandler(
      {
        name: 'error',
        statusCode: 500,
        message: 'resource owner or authorization server denied the request',
      },
      {} as express.Request,
      res,
      {} as express.NextFunction,
    );

    errorHandler(
      { name: 'error', statusCode: 500, message: 'generic error' },
      {} as express.Request,
      res,
      {} as express.NextFunction,
    );

    expect(winston).toHaveBeenCalledTimes(2);

    done();
  });
  // it('uses single redis node as session storage', (done) => {
  //   const logsSpy = jest.spyOn(winstonLogger, 'info');

  //   request(app)
  //     .get('/test/endpoint')
  //     .then(() => {
  //       expect(logsSpy).toHaveBeenCalledWith('Redis single node client connected!');
  //       done();
  //     })
  //     .catch((err: Error) => {
  //       panic(err, done);
  //     });
  // });
  // it('uses redis sentinel as session storage', (done) => {
  //   const logsSpy = jest.spyOn(winstonLogger, 'info');

  //   request(app)
  //     .get('/test/endpoint')
  //     .then(() => {
  //       expect(logsSpy).toHaveBeenCalledWith('Redis sentinel client connected!');
  //       done();
  //     })
  //     .catch((err: Error) => {
  //       panic(err, done);
  //     });
  // });
  // it('shows no redis configs', (done) => {
  //   const logsSpy = jest.spyOn(winstonLogger, 'error');

  //   request(app)
  //     .get('/test/endpoint')
  //     .then(() => {
  //       expect(logsSpy).toHaveBeenCalledWith(
  //         'Redis Connection Error: Redis configs not provided using file session store',
  //       );
  //       done();
  //     })
  //     .catch((err: Error) => {
  //       panic(err, done);
  //     });
  // });
  // it('shows errors when single redis node disconnects', (done) => {
  //   const logsSpy = jest.spyOn(winstonLogger, 'info');

  //   request(app)
  //     .get('/test/endpoint')
  //     .then(() => {
  //       new Redis().quit().catch((err) => panic(err, done));

  //       expect(logsSpy).toHaveBeenCalledWith('Redis single node client error: Redis client disconnected');
  //       done();
  //     })
  //     .catch((err: Error) => {
  //       panic(err, done);
  //     });
  // });
});
