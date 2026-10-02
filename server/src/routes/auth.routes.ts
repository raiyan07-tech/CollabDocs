import { Router } from 'express';
import {
  signup,
  login,
  refreshTokenHandler,
  logout,
  getCurrentUser,
  signupSchema,
  loginSchema,
  refreshSchema,
} from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticateJwt } from '../middleware/auth.middleware';
import { authLimiter } from '../config/limiter';

const router = Router();

router.post('/signup', authLimiter, validateRequest(signupSchema), signup);
router.post('/login', authLimiter, validateRequest(loginSchema), login);
router.post('/refresh', validateRequest(refreshSchema), refreshTokenHandler);
router.post('/logout', logout);
router.get('/me', authenticateJwt, getCurrentUser);

export default router;
