// grab the things we need
const mongoose = require('mongoose');
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;
const date = require('node-datetime');
const DATE_DIFF = require("date-diff-js");

const MessageType = {
    TEXT: 0,
    PICTURE: 1,
    VIDEO: 3,
};

const EventType = {
    MESSAGE: 0,
    JOIN: 1,
    SERVER: 2,
    TYPING: 3
};

const ReadStatus = {
    FAILED: 0,
    SENT: 1,
    READ: 2,
    WAIT: 3,
    ACCEPT: 4,
    DENY: 5,
    STOP: 6,
};

// create a schema
let messageSchema = new Schema({
    //generate autoincrement id
    index: { type: String, unique: true },
    //user who send message
    from: { type: ObjectId, ref: "User", default: null },
    //in which room message sent
    room: { type: ObjectId, ref: "Room", default: null },
    //the content of the message
    content: { type: String, trim: true, default: '(empty)' },
    //type of the message it can be image , text
    content_type: { type: Number, required: true, default: MessageType.TEXT },
    //the type of the event it can be message , join , typing
    event_type: { type: Number, required: true, default: EventType.MESSAGE },
    //use for checking message status , we can use it for check that user is read message or not
    read_status: { type: Number, required: true, default: ReadStatus.SENT },
    //timestamp
    updated_at: { type: Number, required: true, default: new Date().getTime() },
    //timestamp
    created_at: { type: Number, required: true, default: new Date().getTime() }
},
    {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });

messageSchema.pre('save', async function (next) {
    //get the count of the message document
    let count = await Message.countDocuments({});
    // and +1 for unique id
    this.index = count + 1;
    //timestamp
    this.updated_at = new Date().getTime();
    //timestamp
    this.created_at = new Date().getTime();
    next();
});


messageSchema.virtual('get_created_at')
    .get(function () {
        let diff = DATE_DIFF(new Date(this.created_at), new Date(), 'Y').outputs
        if (diff.days > 0) {
            if (diff.months > 0)
                return date.create(this.created_at).format('d/m H:M')
            return 'Ngày ' + date.create(this.created_at).format('d H:M')
        }
        return date.create(this.created_at).format('H:M')
    });

messageSchema.virtual('duration')
    .get(function () {
        let diff = DATE_DIFF(new Date(this.created_at), new Date(this.updated_at), 'Y').outputs
        return diff.minutes + ' phút'
    });

// the schema is useless so far
// we need to create a model using it
let Message = mongoose.model('Message', messageSchema);

// make this available to our users in our Node applications
module.exports = { Message, MessageType, EventType, ReadStatus };