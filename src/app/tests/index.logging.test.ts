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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (err) {
    done(err);
  }
};

jest.mock('../../configs/envs');

const errorText = 'Token not found';

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

    // eslint-disable-next-line class-methods-use-this
    public async getToken() {
      throw new Error(errorText);
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
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    JSON.parse = actualJsonParse;
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it('Logs app activities', (done) => {
    MockDate.set('1/1/2020');
    const logsSpy = jest.spyOn(winstonLogger, 'info');
    // pick any route
    request(app)
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
    MockDate.set('1/1/2020');
    const errorSpy = jest.spyOn(winstonLogger, 'error');
    JSON.parse = (body) => {
      if (body === '{}') {
        return parsedApiResponse;
      }
    };

    nock('http://reveal-stage.smartregister.org').get('/opensrp/user-details').reply(200, {});

    request(app)
      .get(oauthCallbackUri)
      .then((res: request.Response) => {
        expect(res.notFound).toBeFalsy();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        // We will only check part of the error
        // because the other part points to directories and specific file numbers were the error occured.
        // This will be unstable to test because any additional code changing
        // the line were the error occures leads to failure of the test
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((errorSpy.mock.calls[0][0] as any).split('at CodeFlow')[0]).toEqual(
          /* eslint-disable-next-line no-useless-escape */
          `500 - ${errorText}-\"Error: ${errorText}\\n    `,
        );
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });
});
