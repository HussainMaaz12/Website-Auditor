const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL;

const createRedisConnection = () => {
    const options = {
        maxRetriesPerRequest: null, 
    };

    if (REDIS_URL && REDIS_URL.startsWith('rediss://')) {
        options.tls = { rejectUnauthorized: false };
    }

    const redis = new Redis(REDIS_URL, options);
    
    redis.on('error', (err) => {
        console.error('Redis connection error:', err.message);
    });

    return redis;
};

module.exports = { createRedisConnection, REDIS_URL };
