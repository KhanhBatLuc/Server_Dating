const { check } = require('express-validator');

module.exports = [
  // Validate and sanitize fields.
  check('email').trim().isLength({ min: 1 }).escape().withMessage('Địa chỉ Email bị bỏ trống.')
    .isEmail().withMessage('Địa chỉ Email không hợp lệ.'),
  check('password').trim().isLength({ min: 6 }).escape().withMessage('Mật khẩu phải có ít nhất 6 kí tự.'),
];