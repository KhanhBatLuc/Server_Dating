var User = require('../models/user')
var Photo = require('../models/photo')
const uploadFile = require("../middlewares/upload");
const response = require('../config/response');
const { Message } = require('../models/message');
const _ = require('lodash')


exports.upload_photo = async function (req, res) {
  try {
    const user_id = req.userData.sub;
    console.log('user_id ' + "===" + user_id)

    await uploadFile(req, res);
    if (req.file == undefined) {
      return res.status(response.STATUS_NO_CONTENT).send(
        response.createResponse(response.ERROR, "Xin hãy chọn ảnh!")
      );
    }
    const fileName = req.file.originalname;

    console.log('typeof(req.body.sort) ' + "===" + req.body.sort)
    Photo.find({ user: user_id, sort: { $eq: req.body.sort } }).exec(function (err, photo) {
      // console.log('typeof(req.body.sort - newPhoto) '  + "===" + req.body.sort)
      console.log('photo.length ' + photo.length)
      if (photo.length == 0) {

        try {

          var newPhoto = new Photo({
            name: fileName,
            user: user_id,
            sort: req.body.sort
          });
          // console.log('typeof(req.body.sort - newPhoto) ' + (newPhoto.sort) + "===" + req.body.sort)
          // Save author.
          newPhoto.save(function (err, doc) {
            if (err) {
              console.log(err);
              return res.status(response.STATUS_NOT_FOUND).json(
                response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
              );
            }
            return res.status(response.STATUS_CREATED).json(
              response.createResponse(response.SUCCESS, `Thêm ảnh ${doc.sort} thành công`, { photo: doc })
              // {
              //   id: doc._id,
              //   url: doc.url,
              //   sort: doc.sort,
              // }
            );
          });
        } catch (err) {
          console.log(err);

          if (err.code == "LIMIT_FILE_SIZE") {

            return res.status(response.STATUS_CONFLICT).send(
              response.createResponse(response.ERROR, "Kích cỡ file không thể lớn hơn 2MB!")
            );
          }

          res.status(response.STATUS_BAD_REQUEST).send(
            response.createResponse(response.FAILED, `Không thể mở file: ${req.file.originalname}. ${err}`)
          );
        }
      }

      else {
        try {

          const update = {
            name: fileName,
          };

          Photo.findOneAndUpdate({ 'user': user_id, 'sort': req.body.sort }, update,
            {
              new: true,
            },
            function (err, updatedPhoto) {
              if (err) {
                return res.status(response.STATUS_NOT_FOUND).json(
                  response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
                );
              }
              return res.status(response.STATUS_OK).json(
                response.createResponse(response.SUCCESS, `Thay thế ảnh ${updatedPhoto.sort} thành công`, { photo: updatedPhoto }));
            });
        } catch (err) {
          console.error(err)
          if (err.code == "LIMIT_FILE_SIZE") {

            return res.status(response.STATUS_CONFLICT).send(
              response.createResponse(response.ERROR, "Kích cỡ file không thể lớn hơn 2MB!")
            );
          }

          res.status(response.STATUS_BAD_REQUEST).send(
            response.createResponse(response.FAILED, `Không thể mở file: ${req.file.originalname}. ${err}`)
          );
        }

      }
    });

  } catch (err) {
    return res.status(response.STATUS_NOT_FOUND).json(
      response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
    );
  }
}





exports.upload_avatar = async function (req, res) {
  try {
    const user_id = req.userData.sub;
    console.log('user_id ' + "===" + user_id)

    await uploadFile(req, res);
    if (req.file == undefined) {
      return res.status(response.STATUS_NO_CONTENT).send(
        response.createResponse(response.ERROR, "Xin hãy chọn ảnh!")
      );
    }

    const user = {
      avatar: req.file.originalname
    }
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
        // Successful - redirect to genre detail page.
        return res.status(response.STATUS_OK).json(
          response.createResponse(response.SUCCESS, 'Chỉnh sửa ảnh đại diện thành công', {
            user: updatedUser
          })
        );
      });

  } catch (err) {
    return res.status(response.STATUS_NOT_FOUND).json(
      response.createResponse(response.ERROR, 'Đã xảy ra lỗi: ' + err)
    );
  }
}



// exports.upload = async (req, res) => {
//   try {
//     await uploadFile(req, res);

//     if (req.file == undefined) {
//       return res.status(400).send({ message: "Please upload a file!" });
//     }

//     res.status(200).send({
//       message: "Uploaded the file successfully: " + req.file.originalname,
//     });
//   } catch (err) {
//     console.log(err);

//     if (err.code == "LIMIT_FILE_SIZE") {
//       return res.status(500).send({
//         message: "File size cannot be larger than 2MB!",
//       });
//     }

//     res.status(500).send({
//       message: `Could not upload the file: ${req.file.originalname}. ${err}`,
//     });
//   }
// };
