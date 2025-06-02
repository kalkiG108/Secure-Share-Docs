const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// // Route to register a new user (with photo upload)
// router.post('/register', upload.single('photo'), userController.register);

// Route to get user profile
router.get('/profile', authMiddleware.verifyToken, userController.getProfile);

// Route to update user profile (with photo upload)
router.put('/profile', authMiddleware.verifyToken, upload.single('photo'), userController.updateProfile);

// Route to delete user account
router.delete('/account', authMiddleware.verifyToken, userController.deleteAccount);

// Route to get user profile photo
router.get('/photo', authMiddleware.verifyToken, userController.getProfilePhoto);

module.exports = router;