import { Router } from 'express';
import authController from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import validate from '../../common/validators/validate.middleware.js';
import { loginSchema, changePasswordSchema } from '../../common/validators/auth.validator.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
