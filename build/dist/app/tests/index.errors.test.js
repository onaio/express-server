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
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importStar(require("../index"));
const oauthCallbackUri = '/oauth/callback/OpenSRP/?code=Boi4Wz&state=openssh';
jest.mock('../../configs/envs');
const panic = (err, done) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (err) {
        done(err);
    }
};
jest.mock('client-oauth2', () => {
    class CodeFlow {
        constructor(client) {
            this.client = client;
        }
        // eslint-disable-next-line class-methods-use-this
        getToken() {
            return __awaiter(this, void 0, void 0, function* () {
                throw new Error('Token not found');
            });
        }
    }
    // tslint:disable-next-line: max-classes-per-file
    return class ClientOAuth2 {
        constructor(options, req) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.code = (() => new CodeFlow(this))();
            this.options = options;
            this.request = req;
        }
    };
});
describe('src/index.ts', () => {
    const actualJsonParse = JSON.parse;
    afterEach(() => {
        JSON.parse = actualJsonParse;
        jest.resetAllMocks();
        jest.clearAllMocks();
    });
    it('exercise httpexception code', () => {
        const errorMessage = 'some error Message';
        const err = new index_1.HttpException(500, errorMessage);
        expect(err.message).toBe(errorMessage);
        expect(err.statusCode).toBe(500);
    });
    it('E2E: oauth/opensea/callback handles error correctly', (done) => {
        const spyOnError = jest.spyOn(global, 'Error');
        (0, supertest_1.default)(index_1.default)
            .get(oauthCallbackUri)
            .then((res) => {
            expect(spyOnError.mock.calls).toEqual([
                ['Token not found'],
                ['cannot GET /oauth/callback/OpenSRP/?code=Boi4Wz&state=openssh (500)'],
                ['Internal Server Error'],
            ]);
            expect(res.notFound).toBeFalsy();
            expect(res.serverError).toBeTruthy();
            done();
        })
            .catch((err) => {
            panic(err, done);
        });
    });
});
//# sourceMappingURL=index.errors.test.js.map