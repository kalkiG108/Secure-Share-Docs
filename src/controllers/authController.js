const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Register a new user
exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, aadhaarNumber } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Check if Aadhaar is already registered
        const existingAadhaar = await User.findOne({ aadhaarNumber });
        if (existingAadhaar) {
            return res.status(400).json({ message: 'Aadhaar number already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with basic info
        const userData = {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            aadhaarNumber
        };

        // Add photo if provided
        if (req.file) {
            userData.photo = req.file.buffer;
            userData.photoMimeType = req.file.mimetype;
        }

        const newUser = new User(userData);
        await newUser.save();
        
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error', 
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// Send OTP
exports.sendOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes from now

        // Save OTP to user document
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Set up nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your SecureShare Login OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0d9488;">SecureShare Login Verification</h2>
                    <p>Hello ${user.firstName},</p>
                    <p>Your OTP for login is:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px;">
                        <h1 style="color: #0d9488; margin: 0; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p>This OTP will expire in 5 minutes.</p>
                    <p>If you didn't request this OTP, please ignore this email.</p>
                    <p>Best regards,<br>SecureShare Team</p>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'OTP sent successfully to your email.' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

// Login with OTP verification
exports.login = async (req, res) => {
    const { email, password, otp, rememberMe } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify OTP
        if (!otp) {
            return res.status(401).json({ message: 'OTP required' });
        }

        if (
            user.otp !== otp ||
            !user.otpExpires ||
            user.otpExpires < Date.now()
        ) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Clear OTP after successful verification
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Generate token
        const token = jwt.sign(
            { 
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: rememberMe ? '7d' : '1h' }
        );

        res.status(200).json({ 
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};
