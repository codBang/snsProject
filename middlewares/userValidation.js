const { body, validationResult } = require('express-validator');

exports.validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('사용자 이름은 3자 이상이어야 합니다.'),
  body('email').isEmail().withMessage('유효한 이메일 주소를 입력하세요.'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('비밀번호는 6자 이상이어야 합니다.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
