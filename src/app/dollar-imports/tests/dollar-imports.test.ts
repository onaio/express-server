/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import express from 'express';
import path from 'path';
import app from '../..';
import { mockSession } from './fixtures/fixtures';

const spawnMock = jest.fn();

jest.mock('child_process', () => {
  return {
    ...jest.requireActual('child_process'),
    spawn: function mySpawn(...args: any) {
      spawnMock(...args);
      return {
        stdout: {
          on: jest.fn(),
        },
        stderr: {
          on: jest.fn(),
        },
        on: jest.fn(),
      };
    },
  };
});

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'mocked-uuid'),
}));

jest.mock('../../../configs/envs');

describe('dollar import Unauthenticated', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it('unauthorized access', async () => {
    const response = await request(app).get('/$import/');
    expect(response.statusCode).toEqual(401);
    expect(response.text).toEqual('{"error":"Not authorized"}');
  });
});

jest.mock('../../../configs/envs', () => ({
  __esModule: true,
  ...{ ...jest.requireActual('../../../configs/envs') },
}));

describe('dollar import authenticated', () => {
  beforeEach(() => {});

  afterEach(async () => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it('needs redis connection to work', async () => {
    jest.resetModules();
    jest.mock('../../../configs/envs', () => ({
      ...jest.requireActual('../../../configs/envs'),
      EXPRESS_REDIS_STAND_ALONE_URL: undefined,
    }));

    const { importerRouter } = await import('../index');
    const app2 = express();
    app2.use((req, res, next) => {
      req.session = mockSession as any;
      next();
    });
    app2.use(importerRouter);

    const response = await request(app2).get('/');
    expect(response.statusCode).toEqual(500);
    expect(response.text).toEqual('{"error":"No redis connection found. Redis is required to enable this feature."}');
  });

  it('works correctly for get', async () => {
    jest.resetModules();
    jest.mock('../../../configs/envs', () => ({
      ...jest.requireActual('../../../configs/envs'),
      EXPRESS_REDIS_STAND_ALONE_URL: process.env.REDIS_CONNECTION_URL,
    }));

    const { importerRouter } = await import('../index');
    const app2 = express();
    app2.use((req, res, next) => {
      req.session = mockSession as any;
      next();
    });
    app2.use(importerRouter);

    let response = await request(app2).get('/');
    expect(response.statusCode).toEqual(200);
    expect(response.text).toEqual('[]');

    response = await request(app2).get('/nonExistent');
    expect(response.statusCode).toEqual(404);
    expect(response.text).toEqual('{"message":"Workflow with id nonExistent was not found"}');
  });

  it('can post jobs.', async () => {
    jest.resetModules();
    const sampleCsv = `${path.resolve(__dirname, 'fixtures/sample.csv')}`;
    const actualSetInterval = global.setInterval;
    jest.spyOn(global, 'setInterval').mockImplementation((callback, ms) => {
      if (ms === 1000) {
        return actualSetInterval(callback, 0);
      }
      return actualSetInterval(callback, ms);
    });

    jest.mock('../../../configs/envs', () => ({
      ...jest.requireActual('../../../configs/envs'),
      EXPRESS_REDIS_STAND_ALONE_URL: process.env.REDIS_CONNECTION_URL,
    }));

    const { importerRouter } = await import('../index');
    const app2 = express();
    app2.use((req, res, next) => {
      req.session = mockSession as any;
      next();
    });
    app2.use(importerRouter);

    const response = await request(app2).post('/').attach('users', sampleCsv);
    expect(response.statusCode).toEqual(200);
    const data = JSON.parse(response.text);
    expect(data).toMatchObject([
      {
        workflowId: 'mocked-uuid_users',
        status: 'active',
        workflowType: 'users',
        filename: 'sample.csv',
        internalFilename: expect.any(String),
        author: 'demo',
      },
    ]);
  }, 10000);
});
