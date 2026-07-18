const mongoose = require('mongoose');

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.error('FATAL ERROR: MONGODB_URI environment variable is not defined.');
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;