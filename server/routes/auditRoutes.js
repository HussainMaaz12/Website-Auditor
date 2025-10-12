const express = require('express');
const router = express.Router();

const Audit = require('../models/Audit');

const { runAccessibilityAudit } = require('../services/auditService');

const startAuditController = async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ message: 'URL is required' });
    }

    
    const newAudit = new Audit({ url: url, status: 'pending' });
    await newAudit.save();

    try {
       
        const auditResults = await runAccessibilityAudit(url);

        
        newAudit.results = auditResults;
        newAudit.status = 'completed';
        const savedAudit = await newAudit.save();

        
        res.status(200).json(savedAudit);

    } catch (error) {
        
        newAudit.status = 'failed';
        newAudit.results = { error: error.message };
        await newAudit.save();

        res.status(500).json({ message: 'Failed to run audit', error: error.message });
    }
};

router.post('/', startAuditController);

module.exports = router;
