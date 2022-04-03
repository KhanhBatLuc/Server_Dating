var User = require('../models/user')
var Match = require('../models/match')
const response = require('../config/response')
const distance = require('../utils/utils').distance


exports.get_user_list_notify = async function (req, res) {
  try {
    const user_id = req.userData.sub;
    await Match
      .find({ other: user_id, match: 2 })
      .lean()
      .select("owner -_id")
      .exec()
      .then(async (matchs) => {
        let mapOwner = matchs.map(m => m.owner + "")

        // console.log('mapOther ', mapOwner);

        await User.find()
          .select("name avatar bio birth latitude longitude")
          .exec()
          .then(async (users) => {
            const result = await users.filter(u => mapOwner.includes(u.id))

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
          response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
        );
      })



  } catch (err) {
    return res.status(response.STATUS_NOT_FOUND).json(
      response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
    );
  }
}


exports.post_update_match = async function (req, res) {
  try {
    const user_id = req.userData.sub;
    Match.findOneAndUpdate({ other: user_id, owner: req.body.other }, { match: req.body.match },
      {
        new: true
      },
      function (err, updatedMatch) {
        if (err) {
          return res.status(response.STATUS_NOT_FOUND).json(
            response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
          );
        }
        // console.log('exports.profile  updatedUser', updatedUser);
        // Successful - redirect to genre detail page.
        return res.status(response.STATUS_OK).json(
          response.createResponse(response.SUCCESS, 'thành công', {
            match: updatedMatch
          })
        );
      });

  } catch (err) {
    return res.status(response.STATUS_NOT_FOUND).json(
      response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
    );
  }
}


exports.get_list_matched = async function (req, res) {
  try {
    const id = req.userData.sub;
    // console.log('id', id)
    Match.find({ match: 1, $or: [{ 'owner': id }, { 'other': id }] })
      .populate("owner", 'name avatar last_seen', {
        _id: {
          $ne: id //except the current user
        }

      })
      .populate("other", 'name avatar last_seen', {
        _id: {
          $ne: id //except the current user
        }
      })
      .exec(
        function (err, matches) {
          if (err) {
            return res.status(response.STATUS_NOT_FOUND).json(
              response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
            );
          }

          const result = matches.map(m => (m.other == null ? m.owner : m.other))
          // console.log('result', result)
          // const filter = result.filter(f => (f.last_seen == 0))

          // console.log("get_list_matched", result)
          return res.status(response.STATUS_OK).json(
            response.createResponse(response.SUCCESS, 'thành công', {
              users: result
            })
          );
        });

  } catch (err) {
    return res.status(response.STATUS_NOT_FOUND).json(
      response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
    );
  }
}
