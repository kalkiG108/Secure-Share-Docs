const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: [8, 'Password must be at least 8 characters long']
    },
    aadhaarNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^\d{12}$/.test(v);
            },
            message: props => `${props.value} is not a valid Aadhaar number!`
        }
    },
    photo: {
        type: Buffer,
        required: false
    },
    photoMimeType: {
        type: String,
        required: false,
        default: 'image/jpeg'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    }
});

// Virtual for user's full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ aadhaarNumber: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;