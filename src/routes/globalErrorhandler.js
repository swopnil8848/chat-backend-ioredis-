module.exports = (err, req, res, next) => {
    console.log("global error handler being called:: ",err)
    message = err.message || "Something went wrong"
  
    res.status(200).json({
        status:'fail',
        message:message
    }) 
};
  