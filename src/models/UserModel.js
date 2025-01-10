const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let AccountSchema = new Schema({
    acct_name: {
        type: String,
        required: true
    },

    acct_username: {
        type: String,
        required: true,
        unique: true
    },
    email:{
        type:String,
        
    },

    acct_age: {
        type: Number,
        required: true
    },

    acct_birthday: {
        type: Date,
        required: true
    },

    acct_gender: {
        type: String,
        required: true
    },

    acct_phoneno: {
        type: String
    },

    acct_appleid: {
        type: String
    },

    acct_facebookid: {
        type: String
    },

    acct_googleid: {
        type: String
    },

    acct_mailid: {
        type: String
    },

    acct_sync: {
        type: String // account synchronize with facebook (or) phonenumber
    },

    acct_photo: {
        type: String,
        default: "user.png"
    },

    acct_payment_account: {
        type: String
    },

    acct_createdat: {
        type: Date,
        default: Date.now
    },

    acct_live: {
        type: String,
        enum: ["0", "1", "2", "3"], // 0-of'fline  1-online 2-insearch 3-inchat
        default: "0"
    },

    acct_membership: {
        type: String,
        enum: ["sub", "unsub"], // sub-subscribe  unsub-unsubscribe
        default: "unsub"
    },

    acct_membership_till: {
        type: Date,
        default: Date.now
    },

    acct_location: {
        type: String,
        default: "global"
    },

    acct_status: {
        type: Number,
        default: 1 // 0 - inactive , 1- active, 2- deleted
    },

    acct_payment_id: {
        type: String
    },

    acct_gems: {
        type: Number,
        default: 0
    },

    acct_gifts: {
        type: Number,
        default: 0
    },

    // Gifts Earned (as gems)
    acct_gift_earnings: {
        type: Number,
        default: 0
    },

    // Privacy Settings
    acct_show_age: {
        type: Boolean,
        default: false
    },

    acct_show_contactme: {
        type: Boolean,
        default: false
    },

    // Notification Settings
    acct_follow_alert: {
        type: Boolean,
        default: true
    },

    acct_chat_alert: {
        type: Boolean,
        default: true
    },

    acct_alert: {
        type: Boolean,
        default: false
    },

    acct_chat_snap: {
        type: String
    },

    // Blocked account reset
    acct_block_reset: {
        type: Date
    },

    // referral code
    acct_referral_code: {
        type: String
    },

    // referral code
    acct_platform: {
        type: String
    },

    // i'm followed by
    acct_followers_count: {
        type: Number,
        default: 0
    },

    // i'm following
    acct_followings_count: {
        type: Number,
        default: 0
    },

    // streams
    acct_streams: {
        type: Number,
        default: 0
    },

    // video
    acct_videos: {
        type: Number,
        default: 0
    },

    // watched streams
    acct_watched_count: {
        type: Number,
        default: 0
    },

    // unread broadcasts
    acct_unread_broadcasts: {
        type: Boolean,
        default: false
    },
    acct_bio: {
        type: String
    },
    acct_interests: {
        type: Array,
    },
    videolikes_got: {
        type: Number,
        default: 0
    },
    comment_privacy: {
        type: String,
        default: "Everyone"
    },
    message_privacy: {
        type: String,
        default: "Everyone"
    },
    deleted_at: {
        type: Date,
    },
    password:{
        type:String,
    }
});

/* exports model */
module.exports = mongoose.model("Accounts", AccountSchema);