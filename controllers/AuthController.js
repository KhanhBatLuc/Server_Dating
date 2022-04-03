var User = require('../models/user')
const db = require('../config/config').get();
const redis_client = require('../config/redis_connect');
const jwt = require('jsonwebtoken');
const _ = require('lodash')
const response = require('../config/response')

const { validationResult } = require("express-validator");

function getInfo(body, res) {
  User.findOne({ 'email': body.email }, function (err, user) {
    if (!user) return res.status(response.STATUS_UNAUTHORIZED).json(response.createResponse(response.FAILED, 'Địa chỉ Email không tồn tại'));

    user.comparepassword(body.password, (err, isMatch) => {
      if (!isMatch) return res.status(response.STATUS_UNAUTHORIZED).json(
        response.createResponse(response.FAILED, 'Mật khẩu không chính xác')
      );

      // console.log('body location', body)
      const location = {
        latitude: body.latitude,
        longitude: body.longitude,
        fcm_key: body.fcm_key,
        device_model: body.device_model,
        last_seen: 0
      };

      User.findByIdAndUpdate(user._id, location,
        {
          new: true
        },
        function (err, updatedUser) {
          if (err) {
            return res.status(response.STATUS_NOT_FOUND).json(
              response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
            );
          }

          const access_token = jwt.sign({ sub: user._id }, db.JWT_ACCESS_SECRET, { expiresIn: db.JWT_ACCESS_TIME });
          // console.log('access_token', access_token);
          // console.log('updatedUser', updatedUser);
          return res.status(response.STATUS_OK).json(
            response.createResponse(response.SUCCESS, `Thành công`, { user: updatedUser, token: access_token })
          );
        });

    });
  });
}

// Handle Author create on POST.
exports.register = function (req, res) {
  try {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(response.STATUS_UNPROCESSABLE_ENTITY).json(
        response.createResponse(response.FAILED, errors.array()[0].msg)
      );
    }
    else {
      // let body = _.pick(req.body, ['email', 'password', 'name', 'passwordConfirm']);
      let body = req.body;
      User.findOne({ email: body.email }, function (err, user) {
        if (user) return res.status(response.STATUS_CONFLICT).json(
          response.createResponse(response.FAILED, 'Địa chỉ Email đã tồn tại')
        );

        // Data from form is valid.
        // Create Author object with escaped and trimmed data
        if (body.last_seen == 0 || body.last_seen == '0')
          body.last_seen = new Date().getTime();
        console.log('body', body)
        var newuser = new User(body);
        // Save author.
        newuser.save(function (err, doc) {
          if (err) {
            console.log(err);
            return res.status(response.STATUS_NOT_FOUND).json(
              response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
            );
          }

          return getInfo(body, res);
        });
      });

    }
  } catch (error) {
    return res.status(response.STATUS_NOT_FOUND).json(
      response.createResponse(response.FAILED, 'Đã xảy ra lỗi: ' + error)
    );
  }
}


exports.login = function (req, res) {
  try {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(response.STATUS_UNPROCESSABLE_ENTITY).json(
        response.createResponse(response.FAILED, errors.array()[0].msg)
      );
    }
    else {
      // let body = _.pick(req.body, ['email', 'password']);
      getInfo(req.body, res);
    }
  } catch (err) {
    return res.status(response.STATUS_NOT_FOUND).json(
      response.createResponse(response.FAILED, 'Đã xảy ra lỗi: ' + err)
    );
  }
}


exports.logout = function (req, res) {
  try {
    const user_id = req.userData.sub;
    const token = req.token;

    User.findByIdAndUpdate(user_id, { last_seen: new Date().getTime() },
      {
        new: true
      },
      function (err, updatedUser) {
        if (err) {
          return res.status(response.STATUS_NOT_FOUND).json(
            response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
          );
        }


        // remove the refresh token
        redis_client.del(user_id.toString());

        // blacklist current access token
        redis_client.set('BL_' + user_id.toString(), token);

        return res.status(response.STATUS_OK).json(
          response.createResponse(response.SUCCESS, "Đăng xuất thành công.")
        );
      });

  } catch (error) {
    return res.status(response.STATUS_NOT_FOUND).json(
      response.createResponse(response.FAILED, 'Đã xảy ra lỗi: ' + err)
    );
  }
}

exports.getAccessToken = function (req, res) {
  const user_id = req.userData.sub;
  const access_token = jwt.sign({ sub: user_id }, db.JWT_ACCESS_SECRET, { expiresIn: db.JWT_ACCESS_TIME });
  return res.status(response.STATUS_OK).json(
    response.createResponse(response.SUCCESS, `Thành công`, { token: access_token })
  );
}

function GenerateRefreshToken(user_id) {
  const refresh_token = jwt.sign({ sub: user_id }, db.JWT_REFRESH_SECRET, { expiresIn: db.JWT_REFRESH_TIME });

  redis_client.get(user_id.toString(), (err, data) => {
    if (err)
      return res.status(response.STATUS_NOT_FOUND).json({
        error: {
          message: error
        }
      });

    redis_client.set(user_id.toString(), JSON.stringify({ token: refresh_token }));
  })

  return refresh_token;
}


