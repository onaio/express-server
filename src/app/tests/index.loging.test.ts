/* eslint-disable @typescript-eslint/camelcase */
import MockDate from 'mockdate';
import ClientOauth2 from 'client-oauth2';
import nock from 'nock';
import request from 'supertest';
import app from '../index';
import { parsedApiResponse } from './fixtures';
import { winstonLogger } from '../../configs/winston';

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
            throw new Error('token not found');
        }
    }
    // tslint:disable-next-line: max-classes-per-file
    class TokenFlow {
        public data = (() => {
            return {
                access_token: '64dc9918-fa1c-435d-9a97-ddb4aa1a8316',
                expires_in: 3221,
                refresh_expires_in: 2592000,
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
        public async refresh() {
            return { data: this.data };
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
        public createToken = () => {
            return this.token;
        };
    };
});

describe('src/index.ts', () => {
    const actualJsonParse = JSON.parse;
    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterEach(() => {
        JSON.parse = actualJsonParse;
        jest.resetAllMocks();
    });

    it('Logs app activities', (done) => {
        MockDate.set('1/1/2020');
        const logsSpy = jest.spyOn(winstonLogger, 'info');
        // pick any route
        request(app)
            .get('/oauth/state')
            .end(() => {
                expect(logsSpy).toHaveBeenCalledTimes(1);
                expect(logsSpy).toHaveBeenCalledWith(
                    `::ffff:127.0.0.1 - - [01/Jan/2020:00:00:00 +0000] \"GET /oauth/state HTTP/1.1\" 200 26 \"-\" \"node-superagent/3.8.3\"\n`,
                );
                done();
            });
    });

    it('Logs app errors', async (done) => {
        MockDate.set('1/1/2020');
        const errorSpy = jest.spyOn(winstonLogger, 'error');
        JSON.parse = (body) => {
            if (body === '{}') {
                return parsedApiResponse;
            }
        };

        nock('http://reveal-stage.smartregister.org').get(`/opensrp/user-details`).reply(200, {});

        request(app)
            .get(oauthCallbackUri)
            .end((err, res: request.Response) => {
                panic(err, done);
                expect(res.notFound).toBeFalsy();
                expect(errorSpy).toHaveBeenCalledTimes(1);
                expect(errorSpy.mock.calls).toMatchInlineSnapshot(`
                    Array [
                      Array [
                        "500 - token not found-\\"Error: token not found\\\\n    at CodeFlow.<anonymous> (/home/ona/projects/express-server/src/app/tests/index.loging.test.ts:33:19)\\\\n    at Generator.next (<anonymous>)\\\\n    at /home/ona/projects/express-server/src/app/tests/index.loging.test.ts:8:71\\\\n    at new Promise (<anonymous>)\\\\n    at __awaiter (/home/ona/projects/express-server/src/app/tests/index.loging.test.ts:4:12)\\\\n    at CodeFlow.getToken (/home/ona/projects/express-server/src/app/tests/index.loging.test.ts:25:20)\\\\n    at oauthCallback (/home/ona/projects/express-server/src/app/index.ts:188:10)\\\\n    at Layer.handle [as handle_request] (/home/ona/projects/express-server/node_modules/express/lib/router/layer.js:95:5)\\\\n    at trim_prefix (/home/ona/projects/express-server/node_modules/express/lib/router/index.js:317:13)\\\\n    at /home/ona/projects/express-server/node_modules/express/lib/router/index.js:284:7\\"",
                      ],
                    ]
                `);
                done();
            });
    });
});
