"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const mockdate_1 = __importDefault(require("mockdate"));
const supertest_1 = __importDefault(require("supertest"));
const ioredis_1 = __importDefault(require("ioredis"));
const path_1 = require("path");
const envs_1 = require("../../configs/envs");
const index_1 = __importStar(require("../index"));
const fixtures_1 = require("./fixtures");
const winston_1 = require("../../configs/winston");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { extractCookies } = require('./utils');
const authorizationUri = 'http://reveal-stage.smartregister.org/opensrp/oauth/';
const oauthCallbackUri = '/oauth/callback/OpenSRP/?code=Boi4Wz&state=opensrp';
const panic = (err, done) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (err) {
        done(err);
    }
};
jest.mock('ioredis', () => jest.requireActual('ioredis-mock'));
jest.mock('../../configs/envs');
jest.mock('node-fetch');
jest.mock('client-oauth2', () => {
    const jwtAccessTokenMock = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJHZ0NjX3c0UG9Gd25vbThILXpQMEQ4UTc1ZjZ1LWdHLUJTZV9Xc1QxSkU0In0.eyJleHAiOjE2NTg3MzQyMTcsImlhdCI6MTY1ODczNDE1NywiYXV0aF90aW1lIjoxNjU4NzM0MTUxLCJqdGkiOiJkZmNhNDExOS05NDViLTQ5ZDYtOWI2Mi00OGM1OTcwNWZhMGQiLCJpc3MiOiJodHRwczovL2tleWNsb2FrLXN0YWdlLnNtYXJ0cmVnaXN0ZXIub3JnL2F1dGgvcmVhbG1zL29wZW5zcnAtd2ViLXN0YWdlIiwiYXVkIjpbInJlYWxtLW1hbmFnZW1lbnQiLCJhY2NvdW50Il0sInN1YiI6ImRiOTAwOTJmLWI5ODMtNGYyNi1iMTI5LWRhZGRhZjAyMzg0ZiIsInR5cCI6IkJlYXJlciIsImF6cCI6Im9wZW5zcnAtc3RhZ2Utc2VydmVyIiwic2Vzc2lvbl9zdGF0ZSI6Ijk1NjIyZDM3LTE3NTctNDJkMy05ZWRhLWRhOTkxMjExNTNlYSIsImFsbG93ZWQtb3JpZ2lucyI6WyJodHRwczovL3dlYi5vbi1wcmVtaXNlLms4cy5zbWFydHJlZ2lzdGVyLm9yZyIsImh0dHBzOi8vb3BlbnNycC5vbi1wcmVtaXNlLms4cy5zbWFydHJlZ2lzdGVyLm9yZyIsImh0dHBzOi8vc3VwZXJzZXQtb2F1dGgtZGVtby5yaXZlcnMub25hbGFicy5vcmciLCJodHRwczovL3dlYi5sYWJzLnNtYXJ0cmVnaXN0ZXIub3JnLyoiLCJodHRwOi8vbG9jYWxob3N0OjkwOTAvKiIsImh0dHBzOi8vemVpci5zbWFydHJlZ2lzdGVyLm9yZy8qIiwiaHR0cDovL2xvY2FsaG9zdDo4MDgwLyoiLCJodHRwOi8vd2ViLnplaXIuc21hcnRyZWdpc3Rlci5vcmcvKiIsImh0dHBzOi8vb3BlbnNycC1zdGFnZS1zZW50aW5lbC5sYWJzLnNtYXJ0cmVnaXN0ZXIub3JnLyoiLCJodHRwczovL3dlYi5vcGVuc3JwLXN0YWdlLnNtYXJ0cmVnaXN0ZXIub3JnIiwiaHR0cHM6Ly9maGlyLmxhYnMuc21hcnRyZWdpc3Rlci5vcmciLCJodHRwczovL29wZW5zcnAtc3RhZ2UubGFicy5zbWFydHJlZ2lzdGVyLm9yZyIsImh0dHBzOi8vd2ViLndlbGxuZXNzcGFzcy1wcmV2aWV3LnNtYXJ0cmVnaXN0ZXIub3JnLyIsImh0dHA6Ly9sb2NhbGhvc3Q6NTAwMCIsImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCIsImh0dHBzOi8vb3BlbnNycC1zdGFnZS5zbWFydHJlZ2lzdGVyLm9yZyIsImh0dHA6Ly8xOTIuMTY4LjEwMC4yOjgwODAvKiIsImh0dHBzOi8vd2ViLnplaXIuc21hcnRyZWdpc3Rlci5vcmciLCJodHRwOi8vd2ViLmxhYnMuc21hcnRyZWdpc3Rlci5vcmcvKiIsImh0dHA6Ly8xNzIuMjAuMTI3LjIzMTo5MDkwLyoiLCJodHRwczovL2ZoaXItd2ViLm9wZW5zcnAtc3RhZ2Uuc21hcnRyZWdpc3Rlci5vcmciLCJodHRwOi8vZmhpci5sYWJzLnNtYXJ0cmVnaXN0ZXIub3JnIiwiaHR0cDovL29wZW5zcnAub24tcHJlbWlzZS5rOHMuc21hcnRyZWdpc3Rlci5vcmcvKiIsImh0dHA6Ly9vcGVuc3JwLXN0YWdlLXNlbnRpbmVsLmxhYnMuc21hcnRyZWdpc3Rlci5vcmcvKiIsImh0dHA6Ly9vcGVuc3JwLXN0YWdlLmxhYnMuc21hcnRyZWdpc3Rlci5vcmcvKiIsImh0dHA6Ly93ZWIub24tcHJlbWlzZS5rOHMuc21hcnRyZWdpc3Rlci5vcmciXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIk1BTkFHRV9SRVBPUlRTIiwiT1BFTk1SUyIsInJlYWxtLWFkbWluIiwiRURJVF9LRVlDTE9BS19VU0VSUyIsIlZJRVdfS0VZQ0xPQUtfVVNFUlMiLCJQTEFOU19GT1JfVVNFUiIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJBTExfRVZFTlRTIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJtYW5hZ2UtdXNlcnMiLCJ2aWV3LXVzZXJzIiwicXVlcnktZ3JvdXBzIiwicXVlcnktdXNlcnMiXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIHJlYWQgcHJvZmlsZSB3cml0ZSBlbWFpbCIsInNpZCI6Ijk1NjIyZDM3LTE3NTctNDJkMy05ZWRhLWRhOTkxMjExNTNlYSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6IkRlbW8gVXNlciIsInByZWZlcnJlZF91c2VybmFtZSI6ImRlbW8iLCJnaXZlbl9uYW1lIjoiRGVtbyIsImZhbWlseV9uYW1lIjoiVXNlciJ9.AhC1rYONG37Er8YUw0OvEM6h3FqaFYFBN845kOZN2bFo8_x3kpaWuZ5qGGxh8LfPqnMsjnpkL4dXD_3E8uTvjBZBFIeLdck2RaYmxoPXK7j0lDnf4ia36oz2TKUVSBDijacNFdmxmVbyeddFcN6ZPluzO9bvgFkIqIEyCwrLLZEnZwsUdUlgfD4V_ebwkOcSH0z69AkQprZSRPksd5CsY8cPqqDYNRhjRBNqvBdcxtlPwv48Mtpau4rs3yucYKahscNolVAkE_FetEI0KenZdYV5g9N3VdneCsjW4DdZkcuZDrKaA6g64gBUyXEptRsL4wYPwup4_G5NU8vrD-L2cA';
    class CodeFlow {
        constructor(client) {
            this.data = (() => ({
                access_token: jwtAccessTokenMock,
                id_token: 'id_token_hint',
                expires_in: 3221,
                refresh_expires_in: 2592000,
                refresh_token: '808f060c-be93-459e-bd56-3074d9b96229',
                scope: 'openid read write',
                token_type: 'bearer',
            }))();
            this.client = client;
        }
        // eslint-disable-next-line class-methods-use-this
        getUri() {
            return authorizationUri;
        }
        getToken() {
            return __awaiter(this, void 0, void 0, function* () {
                return { data: this.data, accessToken: this.data.access_token };
            });
        }
    }
    // tslint:disable-next-line: max-classes-per-file
    class TokenFlow {
        constructor(client) {
            this.data = (() => ({
                access_token: jwtAccessTokenMock,
                id_token: 'id_token_hint',
                expires_in: 3221,
                refresh_expires_in: 2592000,
                refresh_token: '808f060c-be93-459e-bd56-3074d9b96229',
                scope: 'openid read write',
                token_type: 'bearer',
            }))();
            this.client = client;
            this.accessToken = jwtAccessTokenMock;
            this.refreshToken = '808f060c-be93-459e-bd56-3074d9b96229';
            this.tokenType = 'bearer';
        }
        // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-explicit-any
        sign(_) {
            return { url: 'http://someUrl.com' };
        }
        refresh() {
            return __awaiter(this, void 0, void 0, function* () {
                return { data: this.data, accessToken: this.accessToken };
            });
        }
    }
    // tslint:disable-next-line: max-classes-per-file
    return class ClientOAuth2 {
        constructor(options, req) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.code = (() => new CodeFlow(this))();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.token = (() => new TokenFlow(this))();
            this.createToken = () => this.token;
            this.options = options;
            this.request = req;
        }
    };
});
describe('src/index.ts', () => {
    // const actualJsonParse = JSON.parse;
    let sessionString;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cookie;
    afterEach((done) => {
        jest.resetAllMocks();
        jest.clearAllMocks();
        new ioredis_1.default()
            .flushall()
            .then(() => done())
            .catch((err) => panic(err, done));
    });
    it('serves the build.index.html file', (done) => {
        (0, supertest_1.default)(index_1.default)
            .get('/')
            .expect(200)
            .expect((res) => {
            const csp = res.headers['content-security-policy'];
            const reportTo = res.headers['report-to'];
            expect(csp).toContain(`default-src 'self';report-uri https://example.com;`);
            expect(reportTo).toEqual('{ "group": "csp-endpoint", "max_age": 10886400, "endpoints": [{ "url": "https://example.com/csp-reports" }] }, { "group": "hpkp-endpoint", "max_age": 10886400, "endpoints": [{ "url": "https://example.com/hpkp-reports" }] }');
        })
            .expect('Do you mind\n')
            .catch((err) => {
            throw err;
        })
            .finally(() => {
            done();
        });
    });
    it('oauth/opensrp redirects to auth-server', (done) => {
        (0, supertest_1.default)(index_1.default)
            .get('/oauth/opensrp')
            .expect(302)
            .then((res) => {
            expect(res.header.location).toEqual(authorizationUri);
            expect(res.notFound).toBeFalsy();
            expect(res.redirect).toBeTruthy();
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
    it('E2E: oauth/opensrp/callback works correctly', (done) => {
        mockdate_1.default.set('1/1/2020');
        (0, supertest_1.default)(index_1.default)
            .get(oauthCallbackUri)
            .then((res) => {
            expect(res.header.location).toEqual(envs_1.EXPRESS_FRONTEND_OPENSRP_CALLBACK_URL);
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
            .catch((err) => {
            panic(err, done);
        });
    });
    it('/oauth/state works correctly without cookie', (done) => {
        (0, supertest_1.default)(index_1.default)
            .get('/oauth/state')
            .then((res) => {
            expect(res.body).toEqual(fixtures_1.unauthorized);
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
    it('/oauth/state works correctly with cookie', (done) => {
        mockdate_1.default.set('1/1/2020');
        (0, supertest_1.default)(index_1.default)
            .get('/oauth/state')
            .set('cookie', sessionString)
            .then((res) => {
            expect(res.body).toEqual(fixtures_1.oauthState);
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
    it('/refresh/token works ok', (done) => {
        mockdate_1.default.set('1/1/2020');
        // when no session is found
        (0, supertest_1.default)(index_1.default)
            .get('/refresh/token')
            .then((res) => {
            expect(res.status).toEqual(500);
            expect(res.body).toEqual({ message: 'Access token or Refresh token not found' });
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
        // call refresh token
        (0, supertest_1.default)(index_1.default)
            .get('/refresh/token')
            .set('cookie', sessionString)
            .then((res) => {
            expect(res.body).toEqual(fixtures_1.refreshOauthState2);
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
    it('/refresh/token works correctly when session life time is exceeded', (done) => {
        mockdate_1.default.set('1/2/2020');
        (0, supertest_1.default)(index_1.default)
            .get('/refresh/token')
            .set('cookie', sessionString)
            .then((res) => {
            expect(res.status).toEqual(500);
            expect(res.body).toEqual({
                message: 'Session is Expired',
            });
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
    it('/refresh/token does not change session expiry date', (done) => {
        // change date
        mockdate_1.default.set('1/1/2019');
        (0, supertest_1.default)(index_1.default)
            .get('/refresh/token')
            .set('cookie', sessionString)
            .then((res) => {
            expect(res.body.session_expires_at).toEqual(fixtures_1.oauthState.session_expires_at);
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
    it('Accessing login url when next path is undefined and logged in', (done) => {
        // when logged in and nextPath is not provided, redirect to home
        (0, supertest_1.default)(index_1.default)
            .get('/login')
            .set('cookie', sessionString)
            .expect(302)
            .then((res) => {
            expect(res.header.location).toEqual('/');
            expect(res.redirect).toBeTruthy();
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
    it('Accessing login url when next Path is defined and logged in', (done) => {
        // when logged in and nextPath is not provided, redirect to home
        (0, supertest_1.default)(index_1.default)
            .get('/login?next=%2Fteams')
            .set('cookie', sessionString)
            .expect(302)
            .then((res) => {
            expect(res.header.location).toEqual('/teams');
            expect(res.redirect).toBeTruthy();
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
    it('logs user out from opensrp and calls keycloak', (done) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node_fetch_1.default.mockImplementation(() => Promise.resolve('successfull'));
        (0, supertest_1.default)(index_1.default)
            .get('/logout?serverLogout=true')
            .set('Cookie', sessionString)
            .then((res) => {
            expect(res.header.location).toEqual('https://keycloak-stage.smartregister.org/auth/realms/reveal-stage/protocol/openid-connect/logout?post_logout_redirect_url=http%3A%2F%2Flocalhost%3A3000%2Flogout&id_token_hint=id_token_hint');
            expect(res.redirect).toBeTruthy();
            expect(node_fetch_1.default).toHaveBeenCalledTimes(1);
            expect(node_fetch_1.default).toHaveBeenCalledWith(envs_1.EXPRESS_OPENSRP_LOGOUT_URL, {
                headers: {
                    accept: 'application/json',
                    authorization: `Bearer ${fixtures_1.jwtAccessToken}`,
                    contentType: 'application/json;charset=UTF-8',
                },
                method: 'GET',
            });
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
    it('logs user out with cookie', (done) => {
        (0, supertest_1.default)(index_1.default)
            .get('/logout')
            .set('Cookie', sessionString)
            .then((res) => {
            expect(res.header.location).toEqual(envs_1.EXPRESS_SESSION_LOGIN_URL);
            expect(res.redirect).toBeTruthy();
            // check that session is revoked
            (0, supertest_1.default)(index_1.default)
                .get('/oauth/state')
                .then((r) => {
                expect(r.body).toEqual(fixtures_1.unauthorized);
                done();
            })
                .catch((e) => {
                panic(e, done);
            });
        })
            .catch((err) => {
            panic(err, done);
        });
    });
    it('Accessing login url when you are logged out', (done) => {
        // this returns express frontend login url when logged out
        (0, supertest_1.default)(index_1.default)
            .get('/login')
            .expect(302)
            .then((res) => {
            expect(res.header.location).toEqual(envs_1.EXPRESS_FRONTEND_LOGIN_URL);
            expect(res.redirect).toBeTruthy();
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
    it('/refresh/token works correctly when refresh is not allowed', (done) => {
        mockdate_1.default.set('1/1/2020');
        // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
        const envModule = require('../../configs/envs');
        envModule.EXPRESS_ALLOW_TOKEN_RENEWAL = false;
        // call refresh token
        (0, supertest_1.default)(index_1.default)
            .get('/refresh/token')
            .then((res) => {
            expect(res.status).toEqual(500);
            expect(res.body).toEqual({
                message: 'Session is Expired',
            });
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
    it('handle error middleware works', (done) => {
        const winston = jest.spyOn(winston_1.winstonLogger, 'error');
        const res = {};
        res.redirect = jest.fn();
        res.status = jest.fn().mockImplementation(() => {
            return { json: jest.fn() };
        });
        (0, index_1.errorHandler)({
            name: 'error',
            statusCode: 500,
            message: 'resource owner or authorization server denied the request',
        }, {}, res, {});
        (0, index_1.errorHandler)({ name: 'error', statusCode: 500, message: 'generic error' }, {}, res, {});
        expect(winston).toHaveBeenCalledTimes(2);
        done();
    });
    it('can disable express csp configs', (done) => {
        jest.resetModules();
        jest.mock('../../configs/envs', () => (Object.assign(Object.assign({}, jest.requireActual('../../configs/envs')), { EXPRESS_CONTENT_SECURITY_POLICY_CONFIG: 'false', EXPRESS_REACT_BUILD_PATH: (0, path_1.resolve)(__dirname, '../../configs/__mocks__/build') })));
        const { default: app2 } = jest.requireActual('../index');
        (0, supertest_1.default)(app2)
            .get('/')
            .expect(200)
            .expect((res) => {
            const csp = res.headers['content-security-policy'];
            expect(csp).toBeUndefined();
        })
            .catch((err) => {
            throw err;
        })
            .finally(() => {
            done();
        });
    });
    it('can report csp conflicts instead of failing', (done) => {
        jest.resetModules();
        jest.mock('../../configs/envs', () => (Object.assign(Object.assign({}, jest.requireActual('../../configs/envs')), { EXPRESS_CONTENT_SECURITY_POLICY_CONFIG: `{"reportOnly": true, "useDefaults": false, "default-src": ["''self''"]}`, EXPRESS_REACT_BUILD_PATH: (0, path_1.resolve)(__dirname, '../../configs/__mocks__/build') })));
        const { default: app2 } = jest.requireActual('../index');
        (0, supertest_1.default)(app2)
            .get('/')
            .expect(200)
            .expect((res) => {
            const csp = res.headers['content-security-policy'];
            const cspOnly = res.headers['content-security-policy-report-only'];
            expect(csp).toBeUndefined();
            expect(cspOnly).toEqual(`default-src ''self''`);
        })
            .catch((err) => {
            throw err;
        })
            .finally(() => {
            done();
        });
    });
    it('uses single redis node as session storage', (done) => {
        jest.resetModules();
        jest.mock('../../configs/envs', () => (Object.assign(Object.assign({}, jest.requireActual('../../configs/envs')), { EXPRESS_REDIS_STAND_ALONE_URL: 'redis://:@127.0.0.1:1234' })));
        const { default: app2 } = jest.requireActual('../index');
        const { winstonLogger: winstonLogger2 } = jest.requireActual('../../configs/winston');
        const logsSpy = jest.spyOn(winstonLogger2, 'info');
        (0, supertest_1.default)(app2)
            .get('/test/endpoint')
            .then(() => {
            expect(logsSpy).toHaveBeenCalledWith('Redis single node client connected!');
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
    it('uses redis sentinel as session storage', (done) => {
        jest.resetModules();
        jest.mock('../../configs/envs', () => (Object.assign(Object.assign({}, jest.requireActual('../../configs/envs')), { EXPRESS_REDIS_SENTINEL_CONFIG: '{"name":"mymaster","sentinels":[{"host":"127.0.0.1","port":26379},{"host":"127.0.0.1","port":6380},{"host":"127.0.0.1","port":6379}]}' })));
        const { default: app2 } = jest.requireActual('../index');
        const { winstonLogger: winstonLogger2 } = jest.requireActual('../../configs/winston');
        const logsSpy = jest.spyOn(winstonLogger2, 'info');
        (0, supertest_1.default)(app2)
            .get('/test/endpoint')
            .then(() => {
            expect(logsSpy).toHaveBeenCalledWith('Redis sentinel client connected!');
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
});
//# sourceMappingURL=index.test.js.map