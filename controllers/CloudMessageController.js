const FCM = require('fcm-node');
const serverKey = 'AAAAuzG7AYk:APA91bETlffDbU_FYTYOlZMhg-oXw-jcPiTZFH1lZCbsfSO5xbK80rbZImMgDwpdGAkbYTP2K0UMfineHg1fsqifWqskPdM3q7SPbdQI8-9fkUJTdAxH4oiJmrvpNRL-Q6sueyx2ZEhO'; //put your server key here
const fcm = new FCM(serverKey);

//notify user from unread message with firebase
exports.unreadMessage = function (foundedRoom, FCM_KEY) {
    // console.log('foundedRoom', foundedRoom)
    let message = foundedRoom.last_msg_id
    let payloadOK = {
        to: FCM_KEY,
        data: { //some data object (optional)
            room: foundedRoom,
            title: message.from.name, 
            body: message.content,
        },
        priority: 'high',
        content_available: true,
        notification: { //notification object
            title: message.from.name, body: message.content, sound: "default", badge: "1"
        }
    };

    return fcm.send(payloadOK, function (err, response) {
        if (err) {
            console.log("Something has gone wrong!" + err);
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
};
