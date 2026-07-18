
const express = require('express');

const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
connectDB();

const auditRoutes = require('./routes/auditRoutes');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

const requiredEnvVars = ['MONGODB_URI', 'FRONTEND_URL', 'REDIS_URL'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
    console.error(`FATAL ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}

app.use(cors({
    origin: process.env.FRONTEND_URL,
    optionsSuccessStatus: 200
}));

app.use(express.json());
app.use('/api/audit', auditRoutes);

app.use(express.static(path.join(__dirname, '../client/build')));

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is up and running on port ${PORT}`);
});
