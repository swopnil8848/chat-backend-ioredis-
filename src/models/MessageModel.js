const mongoose = require('mongoose');


const MessageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true, index: true 
  },
  receiverId: {
    type: String, 
    required: true, index: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'seen'], 
    default: 'sent' 
  },
  createdAt: {  
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Message', MessageSchema);