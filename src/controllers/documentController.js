const Document = require('../models/document');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Upload a document (PDF)
exports.uploadDocument = async (req, res) => {
    try {
        console.log('UPLOAD DOC req.body:', req.body);
        console.log('UPLOAD DOC req.file:', req.file);
        const { userId, documentType, title, description, access } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }
        const newDocument = new Document({
            userId,
            documentType,
            title,
            description,
            access,
            file: req.file.buffer,
            fileMimeType: req.file.mimetype
        });
        await newDocument.save();
        res.status(201).json({ message: 'Document uploaded successfully', document: newDocument });
    } catch (error) {
        console.error('UPLOAD DOC ERROR:', error.stack || error);
        res.status(500).json({ message: 'Error uploading document', error: error.message });
    }
};

// View (download) a document PDF
exports.viewDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        const token = req.query.token;
        console.log('Viewing document:', documentId);

        if (!token) {
            console.log('No token provided for document:', documentId);
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified for user:', decoded.id);

        const document = await Document.findById(documentId);
        if (!document || !document.file) {
            console.log('Document or file not found:', documentId);
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Check if user has access to this document
        if (document.userId.toString() !== decoded.id && document.access !== 'public') {
            console.log('Access denied for user:', decoded.id, 'to document:', documentId);
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Verify that the file is actually a PDF by checking its magic numbers
        const isPDF = document.file.slice(0, 4).toString('hex') === '25504446';
        if (!isPDF) {
            console.log('Invalid PDF file for document:', documentId);
            return res.status(400).json({ success: false, message: 'Invalid PDF file' });
        }

        // Set appropriate headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${document.title}.pdf"`);
        res.setHeader('Content-Length', document.file.length);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Accept-Ranges', 'bytes');
        
        // Send the PDF file buffer directly
        res.end(document.file);
        
    } catch (error) {
        console.error('Error in viewDocument:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update a document PDF
exports.updateDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        console.log('Updating document:', documentId);
        
        // First check if document exists and user has access
        const existingDoc = await Document.findById(documentId);
        if (!existingDoc) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Check if user has permission to update
        if (existingDoc.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You do not have permission to update this document' });
        }

        const updates = req.body;
        let updateData = { ...updates };

        if (req.file) {
            // Validate file is PDF
            const isPDF = req.file.mimetype === 'application/pdf';
            if (!isPDF) {
                return res.status(400).json({ success: false, message: 'Only PDF files are allowed' });
            }
            updateData.file = req.file.buffer;
            updateData.fileMimeType = req.file.mimetype;
        }

        // Only allow updating specific fields
        const allowedFields = ['title', 'description', 'access', 'file', 'fileMimeType'];
        Object.keys(updateData).forEach(key => {
            if (!allowedFields.includes(key)) delete updateData[key];
        });

        // Validate required fields
        if (!updateData.title) {
            return res.status(400).json({ success: false, message: 'Title is required' });
        }

        const updatedDocument = await Document.findByIdAndUpdate(
            documentId, 
            updateData,
            { new: true, runValidators: true }
        );

        console.log('Document updated successfully:', documentId);
        res.status(200).json({ 
            success: true, 
            message: 'Document updated successfully', 
            document: updatedDocument 
        });
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating document', 
            error: error.message 
        });
    }
};

// Delete a document
exports.deleteDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        console.log('Delete request received for document:', documentId);

        // Find the document first to check permissions
        const document = await Document.findById(documentId);
        
        if (!document) {
            console.log('Document not found:', documentId);
            return res.status(404).json({ 
                success: false, 
                message: 'Document not found' 
            });
        }

        // Check if user has permission to delete
        if (document.userId.toString() !== req.user.id) {
            console.log('Permission denied for user:', req.user.id);
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to delete this document' 
            });
        }

        // Delete the document
        await Document.findByIdAndDelete(documentId);
        console.log('Document deleted successfully:', documentId);

        res.status(200).json({ 
            success: true, 
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting document', 
            error: error.message 
        });
    }
};

// Share a document
exports.shareDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        const { email, accessLevel, message } = req.body;
        console.log('Share request received:', { documentId, email, accessLevel });

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Find the document
        const document = await Document.findById(documentId);
        if (!document) {
            console.log('Document not found:', documentId);
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Check if user has permission to share
        if (document.userId.toString() !== req.user.id) {
            console.log('Permission denied for user:', req.user.id);
            return res.status(403).json({ success: false, message: 'You do not have permission to share this document' });
        }

        console.log('Setting up email transport with:', {
            service: 'gmail',
            user: process.env.EMAIL_USER ? 'configured' : 'missing',
            pass: process.env.EMAIL_PASS ? 'configured' : 'missing'
        });

        // Set up nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Verify transporter
        try {
            await transporter.verify();
            console.log('Email transporter verified successfully');
        } catch (verifyError) {
            console.error('Email transporter verification failed:', verifyError);
            return res.status(500).json({ 
                success: false, 
                message: 'Email service configuration error',
                error: verifyError.message
            });
        }

        // Email template
        const emailTemplate = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #0d9488; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">Document Shared with You</h2>
                </div>
                <div style="padding: 20px; background-color: #f8f9fa;">
                    <p>Hello,</p>
                    <p>A document has been shared with you from SecureShare Docs.</p>
                    <p><strong>Document:</strong> ${document.title}</p>
                    <p><strong>Shared by:</strong> ${req.user.email || 'A user'}</p>
                    ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
                    <p>The document is attached to this email.</p>
                </div>
                <div style="text-align: center; padding: 20px; color: #666;">
                    <p style="font-size: 0.8em;">SecureShare Docs - Secure Document Sharing Platform</p>
                </div>
            </div>
        `;

        // Email options with PDF attachment
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `${req.user.firstName || 'Someone'} shared a document with you: ${document.title}`,
            html: emailTemplate,
            attachments: [
                {
                    filename: `${document.title}.pdf`,
                    content: document.file,
                    contentType: 'application/pdf'
                }
            ]
        };

        console.log('Attempting to send email to:', email);

        try {
            // Send email
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);

            // Update document's shared status if needed
            if (document.access !== 'public') {
                document.access = 'shared';
                await document.save();
                console.log('Document status updated to shared');
            }

            res.status(200).json({ 
                success: true, 
                message: 'Document shared successfully via email',
                messageId: info.messageId
            });
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            return res.status(500).json({ 
                success: false, 
                message: 'Error sending email',
                error: emailError.message
            });
        }

    } catch (error) {
        console.error('Error in share document process:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error sharing document', 
            error: error.message 
        });
    }
};

// Get all documents for a user
exports.getUserDocuments = async (req, res) => {
    try {
        // Assuming userId is available in req.user from authMiddleware
        const userId = req.user.id;
        const documents = await Document.find({ userId });
        res.status(200).json({ documents });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents', error: error.message });
    }
};

// Get a single document
exports.getDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        console.log('Fetching document details for ID:', documentId);
        
        const document = await Document.findById(documentId).select('-file'); // Exclude the file data
        
        if (!document) {
            console.log('Document not found:', documentId);
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Check if user has access to this document
        if (document.userId.toString() !== req.user.id && document.access !== 'public') {
            console.log('Access denied for user:', req.user.id, 'to document:', documentId);
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        console.log('Successfully fetched document details for ID:', documentId);
        res.status(200).json(document);
    } catch (error) {
        console.error('Error in getDocument:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

