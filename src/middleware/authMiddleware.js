const jwt = require('jsonwebtoken');
const User = require('../models/user');

const verifyToken = (req, res, next) => {
    let token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // If token starts with 'Bearer ', remove it
    if (token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

const isAdmin = (req, res, next) => {
    User.findById(req.user.id)
        .then(user => {
            if (user && user.role === 'admin') {
                next();
            } else {
                res.status(403).json({ message: 'Access denied. Not an admin.' });
            }
        })
        .catch(err => res.status(500).json({ message: 'Server error.' }));
};

module.exports = {
    verifyToken,
    isAdmin
};