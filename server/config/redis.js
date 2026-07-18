const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL;

const createRedisConnection = () => {
    return new Redis(REDIS_URL, {
        maxRetriesPerRequest: null, 
    });
};

module.exports = { createRedisConnection, REDIS_URL };
