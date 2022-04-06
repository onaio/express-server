/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-explicit-any */
import 'express-session';
import 'redis';

declare module 'express-session' {
  interface Session {
    preloadedState?: Record<string, any>;
  }
}

declare module 'redis' {
  interface RedisClient {}
}
