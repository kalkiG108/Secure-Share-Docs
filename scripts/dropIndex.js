const mongoose = require('mongoose');
require('dotenv').config();

async function dropUsernameIndex() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        console.log('Dropping username index...');
        await mongoose.connection.collection('users').dropIndex('username_1');
        console.log('Username index dropped successfully');

    } catch (error) {
        if (error.code === 27) {
            console.log('Index does not exist, nothing to drop');
        } else {
            console.error('Error dropping index:', error);
        }
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
}

dropUsernameIndex(); 