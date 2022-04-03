const { check } = require('express-validator');

module.exports = [
  // Validate and sanitize fields.
  check('email').trim().isLength({ min: 1 }).escape().withMessage('Địa chỉ Email bị bỏ trống.')
    .isEmail().withMessage('Địa chỉ Email không hợp lệ.'),
  check('name').trim().isLength({ min: 1 }).escape().withMessage('Tên người dùng bị bỏ trống.'),
    // .isAlphanumeric().withMessage('Tên người dùng chứa kí tự không hợp lệ.'),
  check('password').trim().isLength({ min: 6 }).escape().withMessage('Mật khẩu phải có ít nhất 6 kí tự.'),
  check('passwordConfirm').trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        // trow error if passwords do not match
        throw new Error("Xác nhận mật khẩu không đúng.");
      } else {
        return value;
      }
    })
];
