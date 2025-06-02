const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');

// Configure multer for handling file uploads
const upload = multer({
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        console.log('Processing file upload:', file.originalname, file.mimetype);
        if (!file.mimetype.startsWith('image/')) {
            console.error('File type rejected:', file.mimetype);
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    console.error('Multer error:', err);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    next(err);
};

// Register route with error handling
router.post('/register', 
    (req, res, next) => {
        console.log('Registration request received');
        next();
    },
    upload.single('photo'),
    handleMulterError,
    async (req, res, next) => {
        console.log('File upload successful, processing registration');
        try {
            await authController.register(req, res);
        } catch (error) {
            console.error('Registration error:', error);
            next(error);
        }
    }
);

// Login route
router.post('/login', authController.login);

// Verify OTP route
router.post('/send-otp', authController.sendOtp);

module.exports = router;