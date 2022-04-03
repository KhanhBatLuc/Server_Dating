var express = require('express');
var router = express.Router();
const auth = require('../middlewares/auth');
const upload = require("../middlewares/upload");
// const multer = require('multer');
// const upload = multer();
const registerValidator = require("../middlewares/validators/registerValidator");
const loginValidator = require("../middlewares/validators/loginValidator");
const roomApi = require('../controllers/RoomController');

// Require our controllers.
var auth_controller = require('../controllers/AuthController');
var profile_controller = require('../controllers/ProfileController');
var photo_controller = require('../controllers/PhotoController');
var recomment_controller = require('../controllers/RecommentController');
var notify_controller = require('../controllers/NotifyController');


// adding new user (sign-up route)
router.post('/api/user/register', [registerValidator], auth_controller.register);

// login user
router.post('/api/user/login', [loginValidator], auth_controller.login);

// //logout user
router.post('/api/user/logout', auth.verifyToken, auth_controller.logout);

router.post('/api/user/delete', auth.verifyToken, profile_controller.account_delete);

router.post('/api/user/profile', auth.verifyToken, profile_controller.profile);

router.get('/api/user/account', auth.verifyToken, profile_controller.user_account);

router.post('/api/user/avatar', auth.verifyToken, photo_controller.upload_avatar);

router.post('/api/user/photo', auth.verifyToken, photo_controller.upload_photo);

router.get('/api/user/profile', auth.verifyToken, profile_controller.get_profile);

router.get('/api/user/list', auth.verifyToken, recomment_controller.get_user_list);

router.post('/api/user/detail', auth.verifyToken, recomment_controller.get_user_detail);

router.post('/api/user/match', auth.verifyToken, recomment_controller.post_match_unmatch);

router.get('/api/user/notify', auth.verifyToken, notify_controller.get_user_list_notify);

router.post('/api/user/update_match', auth.verifyToken, notify_controller.post_update_match);

router.get('/api/user/matched', auth.verifyToken, notify_controller.get_list_matched);

router.post('/api/user/location', auth.verifyToken, profile_controller.location);

router.get('/api/user/:name', auth.verifyToken, profile_controller.findUserName);
// router.get('/api/user/:fcm_key', auth.verifyToken, profile_controller.findUserName);
router.post('/api/user/create/room', auth.verifyToken, roomApi.createRoom);
router.get('/api/user/list/room', auth.verifyToken, roomApi.getRooms);
router.get('/api/user/room/:room', auth.verifyToken, roomApi.getRoom);

// router.post("/api/upload", profile_controller.upload);

router.get('/api', auth.verifyToken, function (req, res) {
  res.status(200).send(`Welcome to login , sign-up api`);
});

module.exports = router;
