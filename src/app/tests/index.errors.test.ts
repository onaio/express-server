import ClientOauth2 from 'client-oauth2';
import request from 'supertest';
import app, { HttpException } from '../index';

const oauthCallbackUri = '/oauth/callback/OpenSRP/?code=Boi4Wz&state=openssh';

jest.mock('../../configs/envs');

const panic = (err: Error, done: jest.DoneCallback): void => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (err) {
    done(err);
  }
};

jest.mock('client-oauth2', () => {
  class CodeFlow {
    private client: ClientOauth2;

    public constructor(client: ClientOauth2) {
      this.client = client;
    }

    // eslint-disable-next-line class-methods-use-this
    public async getToken() {
      throw new Error('Token not found');
    }
  }

  // tslint:disable-next-line: max-classes-per-file
  return class ClientOAuth2 {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public code = (() => new CodeFlow(this as any))();

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

  afterEach(() => {
    JSON.parse = actualJsonParse;
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it('exercise httpexception code', () => {
    const errorMessage = 'some error Message';
    const err = new HttpException(500, errorMessage);

    expect(err.message).toBe(errorMessage);
    expect(err.statusCode).toBe(500);
  });

  it('E2E: oauth/opensea/callback handles error correctly', (done) => {
    const spyOnError = jest.spyOn(global, 'Error');

    request(app)
      .get(oauthCallbackUri)
      .then((res: request.Response) => {
        expect(spyOnError.mock.calls).toEqual([
          ['Token not found'],
          ['cannot GET /oauth/callback/OpenSRP/?code=Boi4Wz&state=openssh (500)'],
          ['Internal Server Error'],
        ]);
        expect(res.notFound).toBeFalsy();
        expect(res.serverError).toBeTruthy();
        done();
      })
      .catch((err: Error) => {
        panic(err, done);
      });
  });
});
