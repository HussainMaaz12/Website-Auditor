const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
    id: String,
    impact: String,
    help: String,
    description: String,
    helpUrl: String,
    nodeCount: Number, 
    nodes: mongoose.Schema.Types.Mixed
}, { _id: false });

const resultsSchema = new mongoose.Schema({
    violations: [violationSchema],
    passes: mongoose.Schema.Types.Mixed,
    incomplete: mongoose.Schema.Types.Mixed,
    inapplicable: mongoose.Schema.Types.Mixed,
}, { _id: false, strict: false });

const auditSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true, 
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'], 
        default: 'pending', 
    },
    
    results: resultsSchema,
}, {
    
    timestamps: true,
});

module.exports = mongoose.model('Audit', auditSchema);
