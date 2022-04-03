var User = require('../models/user')
var Match = require('../models/match')
const response = require('../config/response')
const distance = require('../utils/utils').distance
var Photo = require('../models/photo')


exports.get_user_list = async function (req, res) {
  try {
    const user_id = req.userData.sub;
    await Match
      .find({ $or: [{ 'owner': user_id }, { 'other': user_id }] })
      .lean()
      .select("-_id")
      .exec()
      .then(async (matchs) => {
        let mapOther = matchs.map(m => m.other + "")
        let mapOwner = matchs.map(m => m.owner + "")

        // console.log('mapOther ', mapOther);
        await User.findById(user_id)
          .exec()
          .then(async (user) => {
            await User.find({ sex: user.preferSex })
              .select("name avatar bio birth latitude longitude")
              .exec()
              .then(async (users) => {
                const result = await users.filter(u => (
                  u.id != user.id
                  && !mapOther.includes(u.id)
                  && !mapOwner.includes(u.id)
                  && distance(user.latitude, user.longitude, u.latitude, u.longitude) <= user.interestDistance
                  && u.age <= user.interestAgeMax
                  && u.age >= user.interestAgeMin
                ))

                // console.log('users list', result)
                // console.log('user', user)

                return res.status(response.STATUS_OK).json(
                  response.createResponse(response.SUCCESS, 'Thành công', { users: result })
                );
              })
              .catch(err => {
                console.log(err);
                return res.status(response.SERVER_ERROR).json(
                  response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
                );
              })

          })
          .catch(err => {
            console.log(err);
            return res.status(response.SERVER_ERROR).json(
              response.createResponse(response.ERROR, 'Không tìm thấy người dùng')
            );
          });
      })
      .catch(err => {
        console.log(err);
        return res.status(response.SERVER_ERROR).json(
          response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
        );
      })



  } catch (err) {
    return res.status(response.STATUS_NOT_FOUND).json(
      response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
    );
  }
}


exports.get_user_detail = async function (req, res) {
  try {
    const user_id_1 = req.userData.sub;
    const user_id_2 = req.body._id;

    User.findById(user_id_1)
      .select("latitude longitude")
      .exec()
      .then(user1 => {
        User.findById(user_id_2)
          .select("-password")
          .exec()
          .then(user2 => {

            Photo.find({ user: user_id_2 })
              .exec()
              .then(photos => {
                // console.log('user', user);
                // console.log('photos', photos);

                return res.status(response.STATUS_OK).json(
                  response.createResponse(response.SUCCESS, 'Thành công', {
                    photos: photos,
                    user: user2,
                    distance: Math.round(distance(user1.latitude, user1.longitude, user2.latitude, user2.longitude))
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
            return res.status(response.SERVER_ERROR).json(
              response.createResponse(response.ERROR, 'Không tìm thấy người dùng')
            );
          })

      })
      .catch(err => {
        console.log(err);
        return res.status(response.SERVER_ERROR).json(
          response.createResponse(response.ERROR, 'Không tìm thấy người dùng')
        );
      });

  } catch (err) {
    return res.status(response.STATUS_NOT_FOUND).json(
      response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
    );
  }
}


exports.post_match_unmatch = async function (req, res) {
  try {

    const match = {
      owner: req.userData.sub,
      match: req.body.match,
      other: req.body.other,
    };

    var newmatch = new Match(match);
    // Save author.
    newmatch.save(function (err, doc) {
      if (err) {
        console.log(err);
        return res.status(response.STATUS_NOT_FOUND).json(
          response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
        );
      }
      return res.status(response.STATUS_CREATED).json(
        response.createResponse(response.SUCCESS, 'Thành công', { match: doc })
      );

    });

  } catch (err) {
    return res.status(response.STATUS_NOT_FOUND).json(
      response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
    );
  }
}
