const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

// module.protect = async (req,res,next)=>{
//     //1) getting token and check if it's there\
//     let token;
//     if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
//         token = req.headers.authorization.split(' ')[1];
//     }else if (req.cookies.jwt) {
//       token = req.cookies.jwt;
//     }

//     if(!token){
//         return res.status(400).json({
//             status:'fail',
//             message:'User Not Found'
//         })
//     } 

//     //2) verification token
//     const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET)

//     //3) check if user still exists
//     const freshUser = await User.findById(decoded.id)
    
//     if(!freshUser){
//         return next(
//             new AppError('the user belonging to this token does no longer exist',401)
//         )
//     }

//     // grant acess to protected route
//     req.user = freshUser;
//     next();
// };


exports.getUserId = async()