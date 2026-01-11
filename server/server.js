
const express = require('express');

const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const auditRoutes = require('./routes/auditRoutes');
const app = express();
const PORT = 5000;


app.use(express.json());
app.use('/api/audit', auditRoutes);


app.get('/', (req, res) => {
    
    res.json({ message: 'Hello! The a11y-auditor server is running successfully.' });
});

app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
    console.log(`Hey User ,Server is up and running on http://localhost:${PORT}`);
});
