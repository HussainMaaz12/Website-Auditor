require('dotenv').config();
const mongoose = require('mongoose');
const Audit = require('./models/Audit');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const audits = await Audit.find({ status: 'completed' });
        console.log(`Found ${audits.length} completed audits to migrate`);

        let updatedCount = 0;

        for (const audit of audits) {
            if (audit.results && audit.results.violations) {
                let needsUpdate = false;
                const newViolations = audit.results.violations.map(v => {
                    if (v.nodeCount === undefined) {
                        needsUpdate = true;
                        return {
                            ...v,
                            nodeCount: v.nodes ? v.nodes.length : 0
                        };
                    }
                    return v;
                });

                if (needsUpdate) {
                    audit.results.violations = newViolations;
                    audit.markModified('results.violations');
                    await audit.save();
                    updatedCount++;
                }
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} audits.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
