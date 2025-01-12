const Redis = require('ioredis');
const express = require('express');
const MessageModel = require('../models/MessageModel');
const router = express.Router();
const admin = require("firebase-admin");
const serviceAccount = require("../config/kuku-426504-firebase-adminsdk-opw1p-33ca6775d0.json");

const redis = new Redis({
  host: 'localhost',
  port: 6378,
});

// admin.initializeApp({
//     credential: admin.credential.applicationDefault(serviceAccount),
// });

// 7 days expiration time for redis
const EXPIRATION_TIME = 30;

// Store a message
exports.storeMessage = async (senderId, receiverId, message) => {
  console.log("sotre message:: ",message)

  const chatKey = senderId < receiverId ? `chat:${senderId}:${receiverId}` : `chat:${receiverId}:${senderId}`;
  
  // Push the message to Redis
  await redis.rpush(chatKey, JSON.stringify(message));

  // Set expiration for the key
  await redis.expire(chatKey, EXPIRATION_TIME);
};

const sendNotification = async (message,)=>{
    admin.messaging().send(message).then(function (response) {
        console.log('FCM response:', response);
      }).catch(function (error) {
        console.log('FCM error:', error);
      });
}


// Route to fetch messages
router.get('/messages/:senderId/:receiverId', async (req, res) => {
    const { senderId, receiverId } = req.params;
    const { offset = 0, limit = 10 } = req.query; // Default offset is 0, limit is 10
  
    try {
      // Create a consistent key for the chat
      const chatKey = senderId < receiverId ? `chat:${senderId}:${receiverId}` : `chat:${receiverId}:${senderId}`;
  
      let messages = [];

    //   const message_for_notification = {
    //     notification: {    // SyntaxError can occur here
    //       "title": data.user_name,
    //       "body": data.message,
    //     },
    //     "token": devicetokens
    //   };
  
      if (offset === 0) {
        // Fetch messages from Redis only if offset is 0
        messages = await redis.lrange(chatKey, 0, limit - 1);
  
        if (messages.length === 0) {
          // If Redis is empty, fetch messages from MongoDB
          messages = await MessageModel.find({
            $or: [
              { senderId, receiverId },
              { senderId: receiverId, receiverId: senderId },
            ],
          })
            .sort({ createdAt: -1 }) // Sort messages by creation time in descending order
            .skip(offset)
            .limit(limit)
            .lean();
  
          if (messages.length > 0) {
            // Only store data in Redis if offset is 0
            await redis.rpush(chatKey, ...messages.map((msg) => JSON.stringify(msg)));
            await redis.expire(chatKey, EXPIRATION_TIME);
          }
        } else {
          // If messages exist in Redis, parse them
          messages = messages.map((msg) => JSON.parse(msg));
          // Reset expiration for the key
          await redis.expire(chatKey, EXPIRATION_TIME);
        }
      } else {
        // Fetch messages directly from MongoDB for non-zero offset
        messages = await MessageModel.find({
          $or: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
        })
          .sort({ createdAt: -1 }) // Sort messages by creation time in descending order
          .skip(Number(offset))
          .limit(Number(limit))
          .lean();
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