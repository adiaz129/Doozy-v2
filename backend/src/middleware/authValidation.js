import { body, validationResult } from 'express-validator';

export const validateRegister = [
    body('name').notEmpty().withMessage("Name is required."),
    body('username').notEmpty().withMessage("Username is required."),
    body('email').notEmpty().withMessage("Email is required.").bail().isEmail().withMessage("Email must be in the format: user@example.com.").trim(),
    body('password').notEmpty().withMessage("Password is required.").bail().isLength({ min: 8 }).withMessage("Password must be at least 6 characters."),
    body('confirmPassword').custom((confirmPassword, { req }) => {
      if (confirmPassword !== req.body.password) {
        throw new Error('Passwords don\'t match.');
      }
      return true;
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const validateLogin = [
    body('email').notEmpty().withMessage("Invalid email and/or password.").bail().isEmail().withMessage("Invalid email and/or password.").trim(),
    body('password').notEmpty().withMessage("Invalid email and/or password.").bail().isLength({ min: 8 }).withMessage("Invalid email and/or password."),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
]