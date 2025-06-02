const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  documentType: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  file: { 
    type: Buffer, 
    required: true 
  }, // Store PDF binary data here
  fileMimeType: { 
    type: String, 
    default: "application/pdf" 
  }, // Optional: store MIME type
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  access: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private',
  },
});

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
