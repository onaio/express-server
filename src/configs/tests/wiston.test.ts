import { winstonLogger, winstonStream } from '../winston';

describe('src/index.ts', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it('Logger emits both info and error logs', (done) => {
    const winstonLoggerInfoSpy = jest.spyOn(winstonLogger, 'info');
    const winstonLoggerErrorSpy = jest.spyOn(winstonLogger, 'error');

    winstonLogger.info('This is an info log');
    winstonLogger.error('This is an error log');

    expect(winstonLoggerInfoSpy).toHaveBeenCalledTimes(1);
    expect(winstonLoggerInfoSpy).toHaveBeenCalledWith('This is an info log');

    expect(winstonLoggerErrorSpy).toHaveBeenCalledTimes(1);
    expect(winstonLoggerErrorSpy).toHaveBeenCalledWith('This is an error log');

    done();
  });

  it('Stream emits info logs on calling write method', (done) => {
    // winstonStream.write method
    const winstonStreamWriteSpy = jest.spyOn(winstonStream, 'write');
    // underlying winston logger info method
    const winstonLoggerInfoSpy = jest.spyOn(winstonLogger, 'info');

    winstonStream.write('This is a stream info log');

    expect(winstonStreamWriteSpy).toHaveBeenCalledTimes(1);
    expect(winstonStreamWriteSpy).toHaveBeenCalledWith('This is a stream info log');

    expect(winstonLoggerInfoSpy).toHaveBeenCalledTimes(1);
    expect(winstonLoggerInfoSpy).toHaveBeenCalledWith('This is a stream info log');

    done();
  });
});
