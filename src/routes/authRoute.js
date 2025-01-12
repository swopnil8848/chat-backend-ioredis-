const express = require('express');
const router = express.Router();
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
// const UserModel = require('../models/UserModel');

router.post("/login", async (req, res) => {
    try {
      const { acct_username } = req.body;
  
      // Check if user exists
      const user = await User.findOne({ acct_username });
      if (!user) {
        return res.status(400).json({ status: 'fail', message: "Invalid username" });
      }
  
      // Create and send token
      const token = jwt.sign({ userId: user._id }, "this is jwt secret", {
        expiresIn: "30d",
      });
  
      const CookieOptions = {
        expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "lax"  
      };
  
      // Set the cookie with the token
      res.cookie('jwt', token, CookieOptions);
  
      const filteredUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        membershipStatus: user.membershipStatus,
        phoneNumber: user.phoneNumber,
      };
  
      res.status(200).json({
        status: true,
        data: filteredUser,
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
});

router.post("/getid", async (req, res) => {
try {
    // Get the JWT from cookies
    const token = req.cookies.jwt;  // 'jwt' is the name of the cookie
    
    if (!token) {
    return res.status(400).json({
        status: 'fail',
        message: 'Token not found in cookies'
    });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, "this is jwt secret");

    // Access the user ID from the decoded token
    const userId = decoded.userId;

    if (!userId) {
      return res.status(400).json({
          status: 'fail',
          message: 'User ID not found in token'
      });
    }

    // Respond with the user ID (or any other user-related data you want)
    res.status(200).json({
    status: 'success',
    userId: userId
    });

} catch (error) {
    console.error("Error in /getid:", error);
    res.status(500).json({
    status: 'fail',
    message: error.message || "Something went wrong"
    });
}
});

// router.post()
router.get("/getUsers",async (req,res)=>{
  const users = await User.find();

  return res.status(200).json({
    status:'success',
    data:users
  })
})    

module.exports = router;
