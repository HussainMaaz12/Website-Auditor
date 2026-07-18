const express = require('express');
const router = express.Router();
const dns = require('dns').promises;
const ipaddr = require('ipaddr.js');
const rateLimit = require('express-rate-limit');

const Audit = require('../models/Audit');
const auditQueue = require('../queues/auditQueue');

const auditRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    limit: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 10,
    message: { message: 'Too many audit requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const startAuditController = async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ message: 'URL is required' });
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch (e) {
        return res.status(400).json({ message: 'Invalid URL format' });
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return res.status(400).json({ message: 'URL must use http or https protocol' });
    }

    try {
        
        const lookup = await dns.lookup(parsedUrl.hostname);
        const ip = lookup.address;

        if (ipaddr.isValid(ip)) {
            const addr = ipaddr.parse(ip);
            const range = addr.range();
            
            if (['private', 'loopback', 'unspecified', 'linkLocal', 'uniqueLocal', 'ipv4Mapped', 'rfc6052', 'rfc6145', 'multicast', 'broadcast'].includes(range)) {
                return res.status(400).json({ message: 'Internal network addresses are not allowed' });
            }
        }

        const newAudit = new Audit({ url: url, status: 'pending' });
        await newAudit.save();

        await auditQueue.add('run-audit', {
            auditId: newAudit._id.toString(),
            url: url,
            resolvedIp: ip,
        });

        res.status(202).json({
            auditId: newAudit._id,
            status: 'pending',
            message: 'Audit queued successfully',
        });

    } catch (error) {
        if (error.code === 'ENOTFOUND') {
            return res.status(400).json({ message: 'Could not resolve hostname' });
        }
        console.error('Error queuing audit:', error);
        res.status(500).json({ message: 'Failed to queue audit', error: error.message });
    }
};

const getAuditController = async (req, res) => {
    try {
        const audit = await Audit.findById(req.params.id);
        if (!audit) {
            return res.status(404).json({ message: 'Audit not found' });
        }
        res.status(200).json(audit);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching audit', error: error.message });
    }
};

const streamAuditController = async (req, res) => {
    const auditId = req.params.id;

    const audit = await Audit.findById(auditId);
    if (!audit) {
        return res.status(404).json({ message: 'Audit not found' });
    }

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', 
    });

    res.write(`data: ${JSON.stringify({ status: audit.status })}\n\n`);

    if (audit.status === 'completed' || audit.status === 'failed') {
        res.end();
        return;
    }

    let lastStatus = audit.status;
    const intervalId = setInterval(async () => {
        try {
            const current = await Audit.findById(auditId).lean();
            if (!current) {
                clearInterval(intervalId);
                res.write(`data: ${JSON.stringify({ status: 'failed', error: 'Audit not found' })}\n\n`);
                res.end();
                return;
            }

            if (current.status !== lastStatus) {
                lastStatus = current.status;
                res.write(`data: ${JSON.stringify({ status: current.status })}\n\n`);
            }

            if (current.status === 'completed' || current.status === 'failed') {
                clearInterval(intervalId);
                res.end();
            }
        } catch (err) {
            console.error('SSE polling error:', err);
            clearInterval(intervalId);
            res.end();
        }
    }, 2000);

    req.on('close', () => {
        clearInterval(intervalId);
    });
};

const getStatsController = async (req, res) => {
    try {
        const stats = await Audit.aggregate([
            { $match: { status: 'completed' } },
            { $unwind: '$results.violations' },
            { $group: {
                _id: '$results.violations.id',
                help: { $first: '$results.violations.help' },
                impact: { $first: '$results.violations.impact' },
                occurrences: { $sum: 1 }, 
                totalNodes: { $sum: '$results.violations.nodeCount' }
            }},
            { $sort: { occurrences: -1, totalNodes: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json(stats);
    } catch (error) {
        console.error('Error generating stats:', error);
        res.status(500).json({ message: 'Error generating stats', error: error.message });
    }
};

router.post('/', auditRateLimiter, startAuditController);
router.get('/stats', getStatsController);
router.get('/:id', getAuditController);
router.get('/:id/stream', streamAuditController);

module.exports = router;
