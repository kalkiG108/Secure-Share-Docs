const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Route to get all documents for a user
router.get('/', authMiddleware.verifyToken, documentController.getUserDocuments);

// Get document details
router.get('/details/:documentId', authMiddleware.verifyToken, documentController.getDocument);

// View a document
router.get('/view/:documentId', documentController.viewDocument);

// Route to upload a document
router.post('/', authMiddleware.verifyToken, upload.single('file'), documentController.uploadDocument);

// Route to update a document
router.put('/:documentId', authMiddleware.verifyToken, upload.single('file'), documentController.updateDocument);

// Route to delete a document
router.delete('/:documentId', authMiddleware.verifyToken, documentController.deleteDocument);

// Route to share a document
router.post('/share/:documentId', authMiddleware.verifyToken, documentController.shareDocument);

module.exports = router;