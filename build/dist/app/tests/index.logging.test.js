"use strict";
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
const mockdate_1 = __importDefault(require("mockdate"));
const nock_1 = __importDefault(require("nock"));
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index"));
const fixtures_1 = require("./fixtures");
const winston_1 = require("../../configs/winston");
const authorizationUri = 'http://reveal-stage.smartregister.org/opensrp/oauth/';
const oauthCallbackUri = '/oauth/callback/OpenSRP/?code=Boi4Wz&state=opensrp';
const panic = (err, done) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (err) {
        done(err);
    }
};
jest.mock('../../configs/envs');
const errorText = 'Token not found';
jest.mock('client-oauth2', () => {
    class CodeFlow {
        constructor(client) {
            this.client = client;
        }
        // eslint-disable-next-line class-methods-use-this
        getUri() {
            return authorizationUri;
        }
        // eslint-disable-next-line class-methods-use-this
        getToken() {
            return __awaiter(this, void 0, void 0, function* () {
                throw new Error(errorText);
            });
        }
    }
    // tslint:disable-next-line: max-classes-per-file
    class TokenFlow {
        constructor(client) {
            this.data = (() => ({
                access_token: '64dc9918-fa1c-435d-9a97-ddb4aa1a8316',
                expires_in: 3221,
                refresh_expires_in: 2592000,
                refresh_token: '808f060c-be93-459e-bd56-3074d9b96229',
                scope: 'read write',
                token_type: 'bearer',
            }))();
            this.client = client;
        }
        // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-explicit-any
        sign(_) {
            return { url: 'http://someUrl.com' };
        }
        refresh() {
            return __awaiter(this, void 0, void 0, function* () {
                return { data: this.data };
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
    const actualJsonParse = JSON.parse;
    beforeEach(() => {
        jest.resetAllMocks();
    });
    afterEach(() => {
        JSON.parse = actualJsonParse;
        jest.resetAllMocks();
        jest.clearAllMocks();
    });
    it('Logs app activities', (done) => {
        mockdate_1.default.set('1/1/2020');
        const logsSpy = jest.spyOn(winston_1.winstonLogger, 'info');
        // pick any route
        (0, supertest_1.default)(index_1.default)
            .get('/oauth/state')
            .then((res) => {
            // one by winston, other by morgan
            expect(logsSpy).toHaveBeenCalledTimes(2);
            expect(logsSpy).toHaveBeenCalledWith('Not authorized');
            expect(res.status).toBe(200);
            expect(res.text).toMatch('Not authorized');
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
    it('Logs app errors', (done) => {
        mockdate_1.default.set('1/1/2020');
        const errorSpy = jest.spyOn(winston_1.winstonLogger, 'error');
        JSON.parse = (body) => {
            if (body === '{}') {
                return fixtures_1.parsedApiResponse;
            }
        };
        (0, nock_1.default)('http://reveal-stage.smartregister.org').get('/opensrp/user-details').reply(200, {});
        (0, supertest_1.default)(index_1.default)
            .get(oauthCallbackUri)
            .then((res) => {
            expect(res.notFound).toBeFalsy();
            expect(errorSpy).toHaveBeenCalledTimes(1);
            // We will only check part of the error
            // because the other part points to directories and specific file numbers were the error occured.
            // This will be unstable to test because any additional code changing
            // the line were the error occures leads to failure of the test
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(errorSpy.mock.calls[0][0].split('at CodeFlow')[0]).toEqual(
            /* eslint-disable-next-line no-useless-escape */
            `500 - ${errorText}-\"Error: ${errorText}\\n    `);
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
});
//# sourceMappingURL=index.logging.test.js.map