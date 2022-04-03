const { Room } = require('../models/room')
const { Message, MessageType, EventType, ReadStatus } = require('../models/message')
const response = require('../config/response')

//create new room
exports.createRoom = async function (req, res) {

    const user_id = req.userData.sub;
    //get users
    const user = req.body.user;
    // console.log('user createRoom', user)
    //check if there is room with this info
    let foundedRoom = await Room.findOne({
        $or: [{ 'admin': user_id, 'user': user._id }, { 'admin': user._id, 'user': user_id }]
    }).populate("user", '_id name email avatar last_seen', {
        _id: {
            $ne: user_id //except the current user
        }
    }).populate("last_msg_id").populate({
        path: 'last_msg_id',
        populate: { path: 'from' }
    }).populate("admin", '_id name email avatar last_seen');

    //check : if there is no room
    if (!foundedRoom) {
        let room = new Room({ user: user, admin: user_id });
        // console.log('room: room._id', room._id)
        //create default message for first creation of room
        let createdMessage = new Message({ room: room._id, content: "Phòng chat đã được tạo", event_type: EventType.SERVER, created_at: new Date().getTime() });
        createdMessage.save();


        // console.log('createdMessage._id', createdMessage._id)
        //set the message id to last message of the room
        room.last_msg_id = createdMessage._id;
        await room.save(async function (err, newRoom) {
            if (err) {
                //if there is error during create room we throw error
                return res.status(response.STATUS_BAD_REQUEST).json(
                    response.createResponse(response.FAILED, "Đã xảy ra lỗi: " + err)
                );
            } else {
                //if create room was successful we get it from database and populate users,last_msg_id and admin
                await Room.findOne(room._id).populate("user", '_id name email avatar last_seen', {
                    _id: {
                        $ne: user_id //except current user
                    }
                })
                    .populate("last_msg_id").populate("admin", '_id name email avatar last_seen')
                    .exec(
                        function (err, roomCreated) {
                            if (err) { // and if there is error to get data we return it with error
                                return res.status(response.STATUS_OK).json(
                                    response.createResponse(response.SUCCESS, "Đã xảy ra lỗi: " + err)
                                );
                            }
                            //if we get data we return to user
                            if (roomCreated) {
                                return res.status(response.STATUS_OK).json(
                                    response.createResponse(response.SUCCESS, "Thành công", { room: roomCreated })
                                );
                            }
                        });

            }
        })
    } else {
        //check : in there is a room return the exiting room
        return res.status(response.STATUS_OK).json(
            response.createResponse(response.SUCCESS, "2 bạn đã được kết nối", { room: foundedRoom })
        );
    }
    //create room model

};

//get all users room
exports.getRooms = async function (req, res) {
    const id = req.userData.sub;
    try {
        //get room from database
        let foundedRoom = await Room.find({ $or: [{ 'user': id }, { 'admin': id }] })
            .populate("user", '_id name email avatar last_seen').populate("last_msg_id")
            .populate({
                //we need to know that who is the sender of the last message and we need to populate it
                path: 'last_msg_id',
                populate: { path: 'from' }
            }).populate("admin", '_id name email avatar last_seen');
        return res.status(response.STATUS_OK).json(
            response.createResponse(response.SUCCESS, "Thành công", { rooms: foundedRoom }, foundedRoom.length)
        );
    } catch (e) {
        return res.status(response.SERVER_ERROR).json(
            response.createResponse(response.ERROR, "Sự cố " + e)
        );
    }
};

//get single room
exports.getRoom = async function (req, res) {
    try {
        //get id from parameters
        const user_id = req.userData.sub;
        let id = req.params.room;

        /*we call this function when user open a room ,so that mean user seen the message and we need to update all of the
        message in this room and set to seen*/
        await Message.updateMany({ room: id, read_status: ReadStatus.SENT }, { read_status: ReadStatus.READ, updated_at: new Date().getTime() }, { multi: true });

        //get room and populate
        let foundedRoom = await Room.findById(id)
            .populate("user", '_id name email avatar last_seen')
            .populate("last_msg_id").populate({
                path: 'last_msg_id',
                populate: { path: 'from' }
            })
            .populate("admin", '_id name email avatar last_seen');

        //get all message from this room
        let roomMessages = await Message.find({ room: foundedRoom.id })
            .populate('from', '_id name email avatar last_seen')

        return res.status(response.STATUS_OK).json(
            response.createResponse(response.SUCCESS, "Thành công", {
                room: foundedRoom,
                messages: roomMessages
            }, foundedRoom.length)
        );

    } catch (e) {
        return res.status(response.SERVER_ERROR).json(
            response.createResponse(response.ERROR, e)
        );
    }
};
