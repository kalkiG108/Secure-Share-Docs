const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        console.log('Dropping users collection...');
        await mongoose.connection.collection('users').drop();
        console.log('Users collection dropped successfully');

        console.log('Database reset complete');
    } catch (error) {
        if (error.code === 26) {
            console.log('Collection does not exist, skipping drop');
        } else {
            console.error('Error resetting database:', error);
        }
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
}

resetDatabase(); 