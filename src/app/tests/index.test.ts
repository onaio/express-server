/* eslint-disable @typescript-eslint/camelcase */
import ClientOauth2 from 'client-oauth2';
import nock from 'nock';
import request from 'supertest';
import { EXPRESS_FRONTEND_OPENSRP_CALLBACK_URL, EXPRESS_SESSION_LOGIN_URL } from '../../configs/envs';
import app from '../index';
import { oauthState, parsedApiResponse, unauthorized } from './fixtures';
import { EXPRESS_FRONTEND_LOGIN_URL } from '../../configs/envs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { extractCookies } = require('./utils');

const authorizationUri = 'http://reveal-stage.smartregister.org/opensrp/oauth/';
const oauthCallbackUri = '/oauth/callback/OpenSRP/?code=Boi4Wz&state=opensrp';

const panic = (err: Error, done: jest.DoneCallback): void => {
    if (err) {
        done(err);
    }
};

jest.mock('../../configs/envs');

jest.mock('client-oauth2', () => {
    class CodeFlow {
        private client: ClientOauth2;
        public constructor(client: ClientOauth2) {
            this.client = client;
        }

        public getUri() {
            return authorizationUri;
        }

        public async getToken() {
            return this.client.token;
        }
    }
    // tslint:disable-next-line: max-classes-per-file
    class TokenFlow {
        public data = (() => {
            return {
                access_token: '64dc9918-fa1c-435d-9a97-ddb4aa1a8316',
                expires_in: 3221,
                refresh_token: '808f060c-be93-459e-bd56-3074d9b96229',
                scope: 'read write',
                token_type: 'bearer',
            };
        })();

        public client: ClientOauth2;
        public constructor(client: ClientOauth2) {
            this.client = client;
        }

        public sign(_: any) {
            return { url: 'http://someUrl.com' };
        }
    }

    // tslint:disable-next-line: max-classes-per-file
    return class ClientOAuth2 {
        public code = (() => {
            return new CodeFlow(this as any);
        })();
        public token = (() => {
            return new TokenFlow(this as any);
        })();
        public options: ClientOauth2.Options;
        public request: ClientOauth2.Request;
        public constructor(options: ClientOauth2.Options, req: ClientOauth2.Request) {
            this.options = options;
            this.request = req;
        }
    };
});

describe('src/index.ts', () => {
    const actualJsonParse = JSON.parse;
    let sessionString: string;
    let cookie: { [key: string]: any };

    afterEach(() => {
        JSON.parse = actualJsonParse;
        jest.resetAllMocks();
    });

    it('serves the build.index.html file', (done) => {
        request(app)
            .get('/')
            .expect(200)
            .expect('Do you mind')
            .end((err: Error) => {
                if (err) {
                    throw err;
                }
                done();
            });
    });

    it('oauth/opensrp redirects to auth-server', (done) => {
        request(app)
            .get('/oauth/opensrp')
            .expect(302)
            .end((err: Error, res) => {
                panic(err, done);
                expect(res.header.location).toEqual(authorizationUri);
                expect(res.notFound).toBeFalsy();
                expect(res.redirect).toBeTruthy();
                done();
            });
    });

    it('E2E: oauth/opensrp/callback works correctly', async (done) => {
        JSON.parse = (body) => {
            if (body === '{}') {
                return parsedApiResponse;
            }
        };
        nock('http://reveal-stage.smartregister.org').get(`/opensrp/user-details`).reply(200, {});

        /** PS: This test will start failing on  Fri, 14 May 3019 11:55:39 GMT */
        jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date('3019-05-14T11:01:58.135Z').valueOf());

        request(app)
            .get(oauthCallbackUri)
            .end((err, res: request.Response) => {
                panic(err, done);
                expect(res.header.location).toEqual(EXPRESS_FRONTEND_OPENSRP_CALLBACK_URL);
                expect(res.notFound).toBeFalsy();
                expect(res.redirect).toBeTruthy();
                sessionString = res.header['set-cookie'][0].split(';')[0];
                cookie = extractCookies(res.header);
                // expect that cookie will expire in: now(a date mocked to be in the future) + token.expires_in
                expect(cookie['reveal-session'].flags).toEqual({
                    Expires: 'Fri, 14 May 3019 11:55:39 GMT',
                    HttpOnly: true,
                    Path: '/',
                });
                done();
            });
    });

    it('/oauth/state works correctly without cookie', (done) => {
        request(app)
            .get('/oauth/state')
            .end((err, res) => {
                panic(err, done);
                expect(res.body).toEqual(unauthorized);
                done();
            });
    });

    it('/oauth/state works correctly with cookie', (done) => {
        request(app)
            .get('/oauth/state')
            .set('cookie', sessionString)
            // .send()
            .end((err: Error, res: request.Response) => {
                panic(err, done);
                expect(res.body).toEqual(oauthState);
                done();
            });
    });

    it('Accessing login url when next path is undefined and logged in', (done) => {
        // when logged in and nextPath is not provided, redirect to home
        request(app)
            .get('/login')
            .set('cookie', sessionString)
            .expect(302)
            .end((err: Error, res) => {
                panic(err, done);
                expect(res.header.location).toEqual('/');
                expect(res.redirect).toBeTruthy();
                done();
            });
    });
        it('Accessing login url when next Path is defined and logged in', (done) => {
        // when logged in and nextPath is not provided, redirect to home
        request(app)
            .get('/login?next=%2Fteams')
            .set('cookie', sessionString)
            .expect(302)
            .end((err: Error, res) => {
                panic(err, done);
                expect(res.header.location).toEqual('/teams');
                expect(res.redirect).toBeTruthy();
                done();
            });
    });

    it('logs user out with cookie', (done) => {
        request(app)
            .get('/logout')
            .set('Cookie', sessionString)
            .end((err, res: request.Response) => {
                panic(err, done);
                expect(res.header.location).toEqual(EXPRESS_SESSION_LOGIN_URL);
                expect(res.redirect).toBeTruthy();
                // check that session is revoked
                request(app)
                    .get('/oauth/state')
                    .end((e: Error, r: request.Response) => {
                        panic(e, done);
                        expect(r.body).toEqual(unauthorized);
                        done();
                    });
            });
    });

    it('Accessing login url when you are logged out', (done) => {
        // this returns express frontend login url when logged out
        request(app)
            .get('/login')
            .expect(302)
            .end((err: Error, res) => {
                panic(err, done);
                expect(res.header.location).toEqual(EXPRESS_FRONTEND_LOGIN_URL);
                expect(res.redirect).toBeTruthy();
                done();
            });
    });
});
