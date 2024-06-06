"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const envs_1 = require("../../configs/envs");
const winston_1 = require("../../configs/winston");
const getRedisClient = () => {
    // use redis session store if redis is available else default to file store
    // check for and use a single redis node
    if (envs_1.EXPRESS_REDIS_STAND_ALONE_URL !== undefined) {
        // TODO allow options only for dev server
        const redisClient = new ioredis_1.default(envs_1.EXPRESS_REDIS_STAND_ALONE_URL, { maxRetriesPerRequest: null,
            enableReadyCheck: false });
        redisClient.on('connect', () => winston_1.winstonLogger.info('Redis single node client connected!'));
        redisClient.on('reconnecting', () => winston_1.winstonLogger.info('Redis single node client trying to reconnect'));
        redisClient.on('error', (err) => winston_1.winstonLogger.error('Redis single node client error:', err));
        redisClient.on('end', () => winston_1.winstonLogger.error('Redis single node client error: Redis client disconnected'));
        return redisClient;
    }
    // check for and use redis sentinel if available
    else if (envs_1.EXPRESS_REDIS_SENTINEL_CONFIG !== undefined && Object.keys(envs_1.EXPRESS_REDIS_SENTINEL_CONFIG).length > 0) {
        const redisClient = new ioredis_1.default(Object.assign({}, envs_1.EXPRESS_REDIS_SENTINEL_CONFIG));
        redisClient.on('connect', () => winston_1.winstonLogger.info('Redis sentinel client connected!'));
        redisClient.on('reconnecting', () => winston_1.winstonLogger.info('Redis sentinel client trying to reconnect'));
        redisClient.on('error', (err) => winston_1.winstonLogger.error('Redis sentinel client error:', err));
        redisClient.on('end', () => winston_1.winstonLogger.error('Redis sentinel client error: Redis client disconnected'));
        return redisClient;
    }
};
exports.getRedisClient = getRedisClient;
//# sourceMappingURL=redisClient.js.map