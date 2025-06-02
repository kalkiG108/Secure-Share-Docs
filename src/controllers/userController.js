const User = require('../models/user');
const bcrypt = require('bcrypt');

// Function to get user profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Function to update user profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;
        if (req.file) {
            updates.photo = req.file.buffer;
            updates.photoMimeType = req.file.mimetype;
        }
        const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Function to delete user account
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Function to get user profile photo
exports.getProfilePhoto = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('photo photoMimeType');
        if (!user || !user.photo) {
            return res.status(404).send('No profile photo');
        }
        res.set('Content-Type', user.photoMimeType || 'image/jpeg');
        res.send(user.photo);
    } catch (error) {
        res.status(500).send('Error retrieving profile photo');
    }
};