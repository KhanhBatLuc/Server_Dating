const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const db = require('./config/config').get();
const datingRouter = require('./routes/dating');
const app = express();


global.__basedir = __dirname;

// database connection
mongoose.Promise = global.Promise;
mongoose.connect(db.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true }, function (err) {
  if (err) console.log(err);
  console.log("database is connected");
});



app.set('port', 3000);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api/user/image', express.static('public/images'));


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

app.use('/', datingRouter);

// catch 404 and forward to error handler
app.use(function (req, res) {
  return res.status(400).json({
    message: "Đường dẫn không tồn tại"
  });
});



const server = http.createServer(app);
let io = require('socket.io')(server);
const hashMap = require('hashmap');
const messageApi = require('./controllers/MessageController');
let User = require('./models/user')

const clients = new hashMap(); // for store online users
io.use(async (socket, next) => {

  // console.log('io.use', "io.use")
  try {
    // Bearer tokenstring
    const id = socket.handshake.query.id;
    // console.log('socket.handshake.query.id', id)

    // console.log('socket.handshake.query.id', id)
    let user = await User.findOne({ _id: id });
    if (user) {//exist : store user to hashmap and next()
      clients.set(socket.id, (user._id).toString())
      // console.log('clients', clients)
      await User.findByIdAndUpdate(user._id, { last_seen: 0 });
      return next();
    }
  } catch (error) {
    console.log('error', "Đã xảy ra lỗi: " + error)
  }

})

io.on('connection', function (socket) {

  console.log("[socket] connected :" + socket.id);

  //event join room
  socket.on('join', async function (room) {
    // console.log("join :", room);
    //android device pass parameter "room id " to the event and join
    socket.join(room);
  })

  socket.on('message_detection', async function (data) {
    //detect the message and send it to user
    console.log("message_detection :", "message_detection");
    await messageApi.sendMessage(data, io, socket)

    //notify user that have new message
    await messageApi.notifyDataSetChanged(data, io, clients)
  })

  socket.on('set_last_seen', async function () {
    console.log('set_last_seen');
    await User.findByIdAndUpdate(clients.get(socket.id), { last_seen: new Date().getTime() });
  })

  socket.on('disconnect', async function () {
    console.log("[socket] disconnected :" + socket.id);
    //in this event we get user from database and set last seen to now
    await User.findByIdAndUpdate(clients.get(socket.id), { last_seen: new Date().getTime() });
    //search in hashmap and find the related socket and delete it
    await clients.delete(socket.id);
  })

});


server.listen(app.get('port'), function () {
  console.log('[server] server listening on port ' + app.get('port'));
});

// module.exports = app;
