
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

const requiredEnvVars = ['MONGODB_URI', 'REDIS_URL'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
    console.error(`FATAL ERROR: Missing required environment variables in worker: ${missingVars.join(', ')}`);
    process.exit(1);
}

const { Worker } = require('bullmq');
const { createRedisConnection } = require('./config/redis');
const connectDB = require('./config/db');
const Audit = require('./models/Audit');
const { runAccessibilityAudit } = require('./services/auditService');

connectDB();

const worker = new Worker(
    'audit',
    async (job) => {
        const { auditId, url, resolvedIp } = job.data;
        console.log(`[Worker] Processing job ${job.id} — auditing ${url} (IP: ${resolvedIp || 'unknown'})`);

        await Audit.findByIdAndUpdate(auditId, { status: 'processing' });

        try {
            
            const auditResults = await runAccessibilityAudit(url, resolvedIp);

            if (auditResults && auditResults.violations) {
                auditResults.violations = auditResults.violations.map(v => ({
                    ...v,
                    nodeCount: v.nodes ? v.nodes.length : 0
                }));
            }

            await Audit.findByIdAndUpdate(auditId, {
                status: 'completed',
                results: auditResults,
            });

            console.log(`[Worker] Job ${job.id} completed — ${url}`);
            return { auditId, status: 'completed' };

        } catch (error) {
            console.error(`[Worker] Job ${job.id} failed — ${error.message}`);

            await Audit.findByIdAndUpdate(auditId, {
                status: 'failed',
                results: { error: error.message },
            });

            throw error; 
        }
    },
    {
        connection: createRedisConnection(),
        concurrency: 3, 
    }
);

worker.on('completed', (job) => {
    console.log(`[Worker] ✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
    console.error(`[Worker] ❌ Job ${job?.id} failed: ${err.message}`);
});

worker.on('error', (err) => {
    console.error('[Worker] Error:', err.message);
});

console.log('[Worker] Audit worker started — listening for jobs (concurrency: 3)...');
