import { Router } from 'express';
import { validate } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../utils/validators';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

router.post('/register', validate(registerSchema), (req, res) => authController.register(req, res));
router.post('/login', validate(loginSchema), (req, res) => authController.login(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.post('/password-reset', (req, res) => authController.passwordReset(req, res));

export default router;
