const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const userRoutes = require('./routes/users');
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database connection
console.log('Connecting to MongoDB:', process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI, {
    // Mongoose 7 has these options by default now
    // No need to specify them explicitly
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        type: err.constructor.name
    });

    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ message: `File upload error: ${err.message}` });
    }

    if (err.name === 'ValidationError') {
        console.error('Validation error:', err);
        return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }

    console.error('Server error:', err);
    res.status(500).json({ 
        message: 'Something went wrong!', 
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});