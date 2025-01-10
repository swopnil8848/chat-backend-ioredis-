const mongoose = require('mongoose');

const connectDB = async () => {
    mongoose.Promise = global.Promise;
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });
        console.log("MongoDB is connected");
    } catch (err) {
        console.error("Cannot connect to MongoDB:", err);
        process.exit(1); // Exit the process if the connection fails
    }
};

module.exports = connectDB;
