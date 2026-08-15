import { Router } from 'express';
import {
  completeSignUp,
  forgotPassword,
  resendSignUpOtp,
  resetPassword,
  signIn,
  signOut,
  startSignUp,
  verifySignUpOtp,
} from '../controllers/auth.js';
import {
  auth,
  authLimiter,
  avatarUpload,
  emailLimiter,
  validate,
} from '../middlewares/index.js';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpCompleteSchema,
  signUpResendSchema,
  signUpStartSchema,
  signUpVerifySchema,
} from '../validators/auth.js';

export const authRouter = Router();

authRouter.use(authLimiter);

authRouter.post('/signup/start', emailLimiter, validate(signUpStartSchema), startSignUp);
authRouter.post('/signup/resend', emailLimiter, validate(signUpResendSchema), resendSignUpOtp);
authRouter.post('/signup/verify', validate(signUpVerifySchema), verifySignUpOtp);
authRouter.post(
  '/signup/complete',
  avatarUpload,
  validate(signUpCompleteSchema),
  completeSignUp
);

authRouter.post('/signin', validate(signInSchema), signIn);
authRouter.post('/signout', auth, signOut);
authRouter.post(
  '/forgot-password',
  emailLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);
authRouter.post(
  '/reset-password',
  validate(resetPasswordSchema),
  resetPassword
);
