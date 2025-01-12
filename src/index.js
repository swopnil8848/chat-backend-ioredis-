// Required dependencies
const express = require('express');
const cookie = require('cookie');
const http = require('http');
const socketIO = require('socket.io');
const Redis = require('ioredis');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const connectDB = require('./database/database');
const dotenv = require("dotenv");
const Message = require("./models/MessageModel")
const User = require("./models/UserModel")
const serviceAccount = require("./config/kuku-426504-firebase-adminsdk-opw1p-33ca6775d0.json");
const cors = require('cors')
const authRouter = require('./routes/authRoute')
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken')
const globalErrorHandler = require('./routes/globalErrorhandler');
// const { storeMessage } = require('./routes/messageRoute');
const messageRouter = require('./routes/messageRoute');
const deviceModel = require('./models/deviceModel');

dotenv.config();

storeMessage = async (senderId, receiverId, message) => {
  // Generate the chat key based on sender and receiver IDs
  const chatKey = senderId < receiverId ? `chat:${senderId}:${receiverId}` : `chat:${receiverId}:${senderId}`;

  // Push the new message to Redis
  await redis.rpush(chatKey, JSON.stringify(message));

  // Trim the list to ensure only the latest 30 messages are kept
  await redis.ltrim(chatKey, -30, -1);

  // Set expiration for the key (if required)
  await redis.expire(chatKey, EXPIRATION_TIME);
};

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }
});

app.use(cors({
  origin: true, // Allow requests from this origin
  credentials: true, // Allow cookies to be sent with the request
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization,x-auth-token',
  optionsSuccessStatus: 204,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// Redis client setup
const redis = new Redis({
  host: 'localhost',
  port: 6378
});

// MongoDB connection
connectDB()

// Initialize Firebase Admin (for push notifications)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendNotification = function (devicetokens,data){
  console.log("send notificatin is being called",data,devicetokens);

  const message = {
    notification: {    // SyntaxError can occur here
      "title": data.user_name,
      "body": data.message,
    },
    "token": devicetokens.device_token
  };

  admin.messaging().send(message).then(function (response) {
    console.log('FCM response:', response);
  }).catch(function (error) {
    console.log('FCM error:', error);
  });
}

app.use('/api',authRouter)
app.use('/api',messageRouter)

// Socket.IO connection
io.use((socket, next) => {
  try {
    console.log("socket middleware running")
    // Check auth option first
    const tokenFromAuth = socket.handshake.auth?.token;
    
    // Check headers next
    const tokenFromHeader = socket.handshake.headers?.authorization;
    
    // Check cookies last
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const tokenFromCookie = cookies?.jwt;

    console.log("cookies::> ",cookies);

    const token = tokenFromAuth || tokenFromHeader?.split(' ')[1] || tokenFromCookie;

    console.log("Found token:", token);


    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "this is jwt secret");
    socket.userId = decoded.userId; // Attach userId to socket for later use
    next();
  } catch (error) {
    console.error('Socket.IO Auth Error:', error);
    next(new Error('Authentication error: Invalid token'));
    // return res.status(500).json({
    //   status:'fail',
    //   message:error.message || "Something wen't wrong"
    // })
  }
});

// Socket.IO connection handling
io.on('connection', async (socket) => {
  const userId = socket.userId;

  if (!userId) {
    console.log("No userId provided. Disconnecting the socket.");
    return socket.disconnect(true); // Disconnect the client gracefully
  }
  
  // User Connected - Update Status
  await handleUserConnect(userId, socket);
  
  // Join user's personal room
  socket.join(`user:${userId}`);
  
  // Handle new message
  socket.on('message', async (data) => {
    await handleNewMessage(data, socket);
  });
  
  // Handle typing status
  socket.on('typing', async (data) => {
    console.log("typing",data)
    await handleTypingStatus(data, socket);
  });
  
  // Handle message seen
  socket.on('seen', async (data) => {
    await handleMessageSeen(data, socket);
  });
  
  // Handle disconnection
  socket.on('disconnect', async () => {
    await handleUserDisconnect(userId);
  });
});

app.use(globalErrorHandler)

// Helper Functions
async function handleUserConnect(userId, socket) {
  try {
    // Update user status in MongoDB
    await User.findByIdAndUpdate(userId, {
      status: 'online',
      lastSeen: new Date()
    });
    
    // Set user status in Redis for quick access
    await redis.set(`user:${userId}:status`, 'online');
    
    // Notify user's contacts
    socket.broadcast.emit('user:status', {
      userId: userId,
      status: 'online'
    });
    
    // Deliver any pending messages
    await deliverPendingMessages(userId, socket);
  } catch (error) {
    console.error('Error in handleUserConnect:', error);
  }
}

async function handleNewMessage(data, socket) {
  try {
    const { senderId, receiverId, message } = data;
    
    // Create new message in MongoDB
    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
      status: 'sent'
    });
    
    // Check if receiver is online
    const receiverStatus = await redis.get(`user:${receiverId}:status`);

    const user = await User.findOne({_id:senderId})
    const deviceToken = await deviceModel.findOne({user_id:receiverId})

    console.log("deviceToken:: ",deviceToken)

    const token = deviceToken?.device_token;

    if (!token) {
      console.error('No device token found for the user.');
    }

    const message_data = {
      name:user.acct_name + " messaged you",
      message:message
    }

    // send notification on the recieverId device
    sendNotification(deviceToken,message_data,receiverId);
    
    if (receiverStatus === 'online') {
      // Emit to receiver's personal room
      io.to(`user:${receiverId}`).emit('new_message', {
        messageId: newMessage._id,
        senderId,
        message
      });
      
      // Update message status to delivered
      await Message.findByIdAndUpdate(newMessage._id, { status: 'delivered' });
      newMessage.status = 'delivered';

      console.log("type of store message:: ",typeof storeMessage)

      await storeMessage(senderId,receiverId,newMessage);
    } else {
      // Store in Redis for offline delivery
      await redis.lpush(`offline:${receiverId}`, JSON.stringify(newMessage));
      
      // Send push notification
      await sendPushNotification(receiverId, {
        title: 'New Message',
        body: `You have a new message from ${senderId}`
      });
    }
  } catch (error) {
    console.error('Error in handleNewMessage:', error);
  }
}

async function handleTypingStatus(data, socket) {
  const { userId, receiverId } = data;
  
  // Emit typing status to receiver
  io.to(`user:${receiverId}`).emit('typing_status', {
    userId,
    status: 'typing'
  });
  
  // Set typing status with expiration
  await redis.set(`user:${userId}:typing`, 'true', 'EX', 5);
}

async function handleMessageSeen(data, socket) {
  try {
    const { messageId, receiverId } = data;
    
    // Update message status in MongoDB
    await Message.findByIdAndUpdate(messageId, { status: 'seen' });
    
    // Notify sender
    io.to(`user:${receiverId}`).emit('message_seen', {
      messageId
    });
  } catch (error) {
    console.error('Error in handleMessageSeen:', error);
  }
}

async function handleUserDisconnect(userId) {
  try {
    const now = new Date();
    
    // Update user status in MongoDB
    await User.findByIdAndUpdate(userId, {
      status: 'offline',
      lastSeen: now
    });
    
    // Update Redis status
    await redis.set(`user:${userId}:status`, 'offline');
    
    // Notify user's contacts
    io.emit('user:status', {
      userId,
      status: 'offline',
      lastSeen: now
    });
  } catch (error) {
    console.error('Error in handleUserDisconnect:', error);
  }
}

async function deliverPendingMessages(userId, socket) {
  try {
    // Get all pending messages from Redis
    const pendingMessages = await redis.lrange(`offline:${userId}`, 0, -1);
    
    for (const messageStr of pendingMessages) {
      const message = JSON.parse(messageStr);
      
      // Emit each message to the user
      socket.emit('new_message', {
        messageId: message._id,
        senderId: message.senderId,
        message: message.message
      });
      
      // Update message status to delivered
      await Message.findByIdAndUpdate(message._id, { status: 'delivered' });
    }
    
    // Clear pending messages
    await redis.del(`offline:${userId}`);
  } catch (error) {
    console.error('Error in deliverPendingMessages:', error);
  }
}

async function sendPushNotification(userId, notification) {
  try {
    const user = await User.findById(userId);
    if (user && user.fcmToken) {
      await admin.messaging().send({
        token: user.fcmToken,
        notification: notification
      });
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
});