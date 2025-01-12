const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let UserdevicesSchema = new Schema({
  user_id: {
    type: String,
    required: true
  },
  device_token: {
    type: String,  
  },
   voip_token: {
    type: String,
   
  },
  device_type: {
    type: String,
    required: true
  },
  device_mode: {
    type: String
  },
  device_id: {
    type: String,
    required: true
  },
  device_model: {
    type: String,
    required: true
  },
  notified_at: {
    type: Date
  },
    fcm_token: {
    type: String,
    
  },
  deleted: {
    type: Number,
    default: 0 // 1 - deleted, 0 - active
  }
});

module.exports = mongoose.model("Devices", UserdevicesSchema);
