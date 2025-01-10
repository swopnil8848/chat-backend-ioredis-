const Redis = require('ioredis');
const express = require('express');
const MessageModel = require('../models/MessageModel');
const router = express.Router();

const redis = new Redis({
  host: 'localhost',
  port: 6378,
});

// 7 days expiration time for redis
const EXPIRATION_TIME = 7 * 24 * 60 * 60;

// Store a message
exports.storeMessage = async (senderId, receiverId, message) => {
  const chatKey = senderId < receiverId ? `chat:${senderId}:${receiverId}` : `chat:${receiverId}:${senderId}`;
  
  // Push the message to Redis
  await redis.rpush(chatKey, JSON.stringify(message));

  // Set expiration for the key
  await redis.expire(chatKey, EXPIRATION_TIME);
};


// Route to fetch messages
router.get('/messages/:senderId/:receiverId', async (req, res) => {
    const { senderId, receiverId } = req.params;
  
    try {
      // Create consistent key
      const chatKey = senderId < receiverId ? `chat:${senderId}:${receiverId}` : `chat:${receiverId}:${senderId}`;
  
      // Check Redis for messages
      let messages = await redis.lrange(chatKey, 0, -1);
  
      if (messages.length === 0) {
        // If Redis is empty, fetch messages from MongoDB
        messages = await MessageModel.find({
          $or: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
        })
        .limit(10)
        .lean();
        // Optimize query by returning plain objects
        //   .sort({ createdAt: 1 }) // Sort messages by creation time  (just store )
  
        if (messages.length > 0) {
          // Store the messages in Redis for future use
          await redis.rpush(chatKey, ...messages.map(msg => JSON.stringify(msg)));
          // Set expiration for the key
          await redis.expire(chatKey, EXPIRATION_TIME);
        }
      } else {
        // If messages exist in Redis, parse them
        messages = messages.map(msg => JSON.parse(msg));
        // Reset expiration for the key
        await redis.expire(chatKey, EXPIRATION_TIME);
      }
  
      // Return the messages
      res.status(200).json({
        status: 'success',
        messages,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
    }
});
  

module.exports = router;