const { Message, MessageType, EventType, ReadStatus } = require('../models/message');
const response = require('../config/response')
const { Room } = require('../models/room')
const cloudMessage = require('./CloudMessageController');

const MAX_PAGE_SIZE = 50;
const fs = require("fs");

// const mongoose = require('mongoose');
// let Schema = mongoose.Schema;
// let ObjectId = require('mongoose').Types.ObjectId;


//send message and store it in database/
exports.sendMessage = async function (data, io) {

    let count = 0;
    //get user from database
    let room = await Room.findById(data.room);
    let name = new Date().getTime() + ".png"
    let location = __basedir + "/public/images/messages/" + name;
    let id = "";

    //check if there is such room
    if (!room) {
        console.log('Không có phòng chat nào đc tìm thấy ');
        //send error message
    }
    else
        try {
            //create message model with received data
            if (data.content_type == MessageType.PICTURE) {
                console.log('count: ' + count++)
                let image = await data.content.replace(/^data:image\/png;base64,/, "");
                // console.log('data.content ', data.content);
                await fs.writeFile(location, image, 'base64', function (err) {
                    console.log('fs.writeFile ', err);
                });
                data.content = name;
            }


            if ((data.read_status == ReadStatus.WAIT && data.content_type == MessageType.VIDEO)
                || data.content_type != MessageType.VIDEO
            ) {
                data.created_at = new Date().getTime()
                let newMessage = await new Message(data);
                //save to data base
                await newMessage.save()


                //set this message to room's last message
                await Room.findByIdAndUpdate(room._id, { last_msg_id: newMessage._id });

                console.log('message content', newMessage._id)
                //get store message and populate it "from"
                let newContent = await Message.findById(newMessage._id).populate('from', '_id name email avatar last_seen')

                console.log('message', newContent)
                //send back to user

                if (data.content_type == MessageType.PICTURE)
                    newContent.content = name
                console.log('message', newContent.content + ' ----  ' + newContent.content_type)
                await io.sockets.in(room._id).emit('message', newContent);
            } else {
                if (data.read_status == ReadStatus.ACCEPT)
                    data.created_at = new Date().getTime()
                data.updated_at = new Date().getTime()
                // const id = new ObjectId(data.content);
                console.log('data ', data)
                await Message.findByIdAndUpdate(data.content, data,
                    { 
                        new: true 
                    },
                    async function (error, update) {
                        // In this moment, you recive a result object or error

                        console.log('message update', update)
                        //set this message to room's last message
                        await Room.findByIdAndUpdate(room._id, { last_msg_id: update._id });

                        //get store message and populate it "from"
                        let updateContent = await Message.findById(update._id).populate('from', '_id name email avatar last_seen')

                        console.log('message', updateContent)
                        //send back to user

                        if (data.content_type == MessageType.PICTURE)
                            updateContent.content = name
                        console.log('message', updateContent.content + ' ----  ' + updateContent.content_type)
                        await io.sockets.in(room._id).emit('message', updateContent);
                        // ... Your code when have result ... //
                    });

            }


        } catch (e) {
            console.log(e)
        }
};

//notify user that room has been changed
exports.notifyDataSetChanged = async function (data, io, clients) {

    let roomId = data.room;
    //get room from database
    let room = await Room.findById(roomId);

    //check if there is a such room
    if (!room) {
        //send error message
    }
    try {
        //get the current room from database and populate all the ref
        let foundedRoom = await Room.findById(room._id)
            .populate("user", '_id name email avatar last_seen fcm_key')
            .populate("last_msg_id").populate({ path: 'last_msg_id', populate: { path: 'from' } })
            .populate("admin", '_id name email avatar last_seen fcm_key');

        //create loop for every user in the room object
        let users = [];
        users.push(foundedRoom.user)
        users.push(foundedRoom.admin)

        await users.forEach(function (user) {

            // console.log('user', user)
            //check from the hashmap that is user was connect to socket or not
            let socketId = clients.search((user._id).toString());

            //if connected
            if (socketId) {
                // console.log('change', foundedRoom)
                //get socket id and emit the change and pass room object
                io.sockets.to(socketId).emit('change', foundedRoom);
            } else {
                //if not
                //notify user with firebase cloud messaging
                cloudMessage.unreadMessage(foundedRoom, user.fcm_key);
            }
        })
    } catch (e) {
        console.log(e)
    }
};

//get message list
exports.messageList = async function (req, res) {
    try {
        //get query
        let room_id = req.query.room_id;
        let pageNo = parseInt(req.query.pageNo || 1);
        if (pageNo !== 0) {
            pageNo--; // decrement page no by 1
        }
        //get limitation for document's count
        let limit = parseInt(req.query.limit || MAX_PAGE_SIZE);

        //get count of the document
        let documentCount = await Message.countDocuments({ room: room_id });

        //get all message from current room id
        let messageFounded = await Message.find({ room: room_id })
            .skip(pageNo * limit) // skip
            .limit(limit) //limitation
            .sort({
                date: -1 //sort
            })
            .populate('from', '_id name email blocked avatar');

        //check count
        if (messageFounded.length <= 0) {
            return res.status(response.STATUS_OK).json(
                response.createResponse(response.FAILED, 'Không tìm thấy dữ liệu'));
        }
        return res.status(response.STATUS_OK).json(
            response.createResponse(response.SUCCESS, 'Thành công', messageFounded, documentCount, pageNo, limit));
    } catch (e) {
        return res.status(response.STATUS_BAD_REQUEST).json(
            response.createResponse(response.ERROR, 'Đã xảy ra lỗi ' + e));
    }
};