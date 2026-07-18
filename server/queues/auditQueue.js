const { Queue } = require('bullmq');
const { createRedisConnection } = require('../config/redis');

const auditQueue = new Queue('audit', {
    connection: createRedisConnection(),
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 3000,
        },
        removeOnComplete: 100, 
        removeOnFail: 50,      
    },
});

module.exports = auditQueue;
