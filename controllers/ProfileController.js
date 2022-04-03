var User = require('../models/user')
var Photo = require('../models/photo')
var Match = require('../models/match')
const uploadFile = require("../middlewares/upload");
const fs = require('fs')
const response = require('../config/response');
const _ = require('lodash')

const { validationResult } = require("express-validator");

exports.profile = function (req, res) {
  try {
    const user_id = req.userData.sub;
    // let body = _.pick(req.body, ['email', 'password', 'name', 'sex', 'preferSex', 'interests', 'birth']);
    // return res.status(200).json(user_id);
    let user = req.body

    // if (user.latitude != undefined && user.longitude != undefined)
    //   user = {
    //     latitude: user.latitude,
    //     longitude: user.longitude
    //   };

    User.findByIdAndUpdate(user_id, user,
      {
        new: true
      },
      function (err, updatedUser) {
        if (err) {
          return res.status(response.STATUS_NOT_FOUND).json(
            response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
          );
        }
        console.log('exports.profile  updatedUser', updatedUser);
        // Successful - redirect to genre detail page.
        return res.status(response.STATUS_OK).json(
          response.createResponse(response.SUCCESS, 'Cập nhật dữ liệu cá nhân thành công', {
            user: updatedUser
          })
        );
      });

  } catch (err) {
    return res.status(response.STATUS_NOT_FOUND).json(
      response.createResponse(response.FAILED, 'Đã xảy ra lỗi: ' + err)
    );
  }
}


exports.location = function (req, res) {
  try {
    const user_id = req.userData.sub;
    // let body = _.pick(req.body, ['email', 'password', 'name', 'sex', 'preferSex', 'interests', 'birth']);
    // return res.status(200).json(user_id);
    let user = req.body

    // if (user.latitude != undefined && user.longitude != undefined)
      user = {
        latitude: user.latitude,
        longitude: user.longitude
      };

    User.findByIdAndUpdate(user_id, user,
      {
        new: true
      },
      function (err, updatedUser) {
        if (err) {
          return res.status(response.STATUS_NOT_FOUND).json(
            response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
          );
        }
        console.log('exports.profile  updatedUser', updatedUser);
        // Successful - redirect to genre detail page.
        return res.status(response.STATUS_OK).json(
          response.createResponse(response.SUCCESS, 'Thành công vị trí', {
            user: updatedUser
          })
        );
      });

  } catch (err) {
    return res.status(response.STATUS_NOT_FOUND).json(
      response.createResponse(response.FAILED, 'Đã xảy ra lỗi: ' + err)
    );
  }
}

exports.get_profile = async function (req, res) {
  try {
    const user_id = req.userData.sub;

    await User.findOne({ _id: user_id })
      .exec()
      .then(async (user) => {
        await Photo.find({ user: user_id })
          .exec()
          .then(photos => {
            // console.log('user', user);
            // console.log('photos', photos);

            return res.status(response.STATUS_OK).json(
              response.createResponse(response.SUCCESS, 'Thành công', {
                photos: photos,
                user: user
              })
            );
          })
          .catch(err => {
            console.log(err);
            return res.status(response.SERVER_ERROR).json(
              response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
            );
          });
      })
      .catch(err => {
        console.log(err);
        return res.status(response.STATUS_NOT_FOUND).json(
          response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
        );
      });



  } catch (err) {
    return res.status(response.STATUS_NOT_FOUND).json(
      response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
    );
  }
}




exports.user_account = (req, res) => {
  const id = req.userData.sub;
  User.findById(id)
    .select("name avatar")
    .exec()
    .then(doc => {
      console.log("From database", doc);
      if (doc) {
        return res.status(response.STATUS_OK).json(
          response.createResponse(response.SUCCESS, 'Thành công', { user: doc })
        );
      } else {
        return res.status(response.STATUS_NOT_FOUND).json(
          response.createResponse(response.ERROR, 'Không tìm thấy người dùng')
        );
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(response.SERVER_ERROR).json(
        response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
      );
    });
};

//find user name
exports.findUserName = async function (req, res) {
  try {
    //get query
    let name = req.params.name.trim().toLowerCase();
    console.log('findUserName', name)

    const id = req.userData.sub;


    await Match.find({ match: 1, $or: [{ 'owner': id }, { 'other': id }] })
      .exec(
        async function (err, matches) {
          if (err) {
            return res.status(response.STATUS_NOT_FOUND).json(
              response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
            );
          }

          console.log('matches', matches)
          const ids = matches.map(m => ((m.other + '') == id ? m.owner : m.other) + '')
          console.log('ids', ids)
          await User.find({
            // 'name': {
            //   $regex: new RegExp(name, "i")
            // },
            'id': { "$ne": id },
            // '_id': { "$in": ids },
          })
            .select("_id name avatar last_seen")
            .exec()
            .then(async (foundUsers) => {
              // console.log('foundUsers', foundUsers)

              const users = await foundUsers.filter(u => (
                u.name.toLowerCase().includes(name)
                && ids.includes(u.id)
              ))

              console.log('foundUsers', users)
              return res.status(response.STATUS_OK).json(
                response.createResponse(response.SUCCESS, 'Thành công', { users: users })
              );
            })
            .catch(err => {
              console.log(err);
              return res.status(response.SERVER_ERROR).json(
                response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
              );
            })
        });


  } catch (e) {
    console.log(e)
    return res.status(response.STATUS_BAD_REQUEST).json(
      response.createResponse(response.ERROR, 'Đã xảy ra lỗi :' + e)
    );
  }
}

//update fcm key
// exports.updateFcmKey = async function (req, res) {
//   try {

//     //get fcm key
//     let fcm_key = req.params.fcm_key;

//     //update it
//     let user = await User.findByIdAndUpdate(req.user._id, { fcm_key: fcm_key });

//     return res.status(response.STATUS_OK).json(
//       response.createResponse(response.SUCCESS, `Success`, { user: user })
//     );

//   } catch (e) {
//     console.log(e)
//     return res.status(response.STATUS_BAD_REQUEST).json(
//       response.createResponse(response.ERROR, 'Something went wrong :' + e)
//     );
//   }
// }

exports.account_delete = (req, res) => {
  const id = req.userData.sub;
  User.remove({ _id: id })
    .exec()
    .then(result => {
      return res.status(response.STATUS_OK).json(
        response.createResponse(response.SUCCESS, `Xóa tài khoản thành công`)
      );
    })
    .catch(err => {
      console.log(err);
      return res.status(response.SERVER_ERROR).json(
        response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
      );
    });
};