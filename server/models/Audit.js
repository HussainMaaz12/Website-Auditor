const mongoose = require('mongoose');


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
    
    results: {
        type: mongoose.Schema.Types.Mixed,
    },
}, {
    
    timestamps: true,
});


module.exports = mongoose.model('Audit', auditSchema);
