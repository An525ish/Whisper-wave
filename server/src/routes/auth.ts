import { Router } from 'express';
import {
  checkUsernameAvailability,
  completeSignUp,
  forgotPassword,
  googleSignIn,
  refreshToken,
  resendSignUpOtp,
  resetPassword,
  signIn,
  signOut,
  startSignUp,
  updateSignupUsername,
  verifySignUpOtp,
} from '../controllers/auth.js';
import {
  authLimiter,
  avatarUpload,
  emailLimiter,
  signupUsernameLimiter,
  usernameCheckLimiter,
  validate,
} from '../middlewares/index.js';
import {
  forgotPasswordSchema,
  googleSignInSchema,
  resetPasswordSchema,
  signInSchema,
  signUpCompleteSchema,
  signUpResendSchema,
  signUpStartSchema,
  signUpUpdateUsernameSchema,
  signUpVerifySchema,
  usernameCheckQuerySchema,
} from '../validators/auth.js';

export const authRouter = Router();

authRouter.use(authLimiter);

authRouter.get(
  '/username/check', 
  usernameCheckLimiter, 
  validate(usernameCheckQuerySchema, 'query'), 
  checkUsernameAvailability
);
authRouter.post('/signup/start', 
  emailLimiter, 
  validate(signUpStartSchema), 
  startSignUp
);
authRouter.post('/signup/resend', 
  emailLimiter, 
  validate(signUpResendSchema), 
  resendSignUpOtp
);
authRouter.post('/signup/verify', validate(signUpVerifySchema), verifySignUpOtp);
authRouter.patch('/signup/username', 
  signupUsernameLimiter, 
  validate(signUpUpdateUsernameSchema), 
  updateSignupUsername
);
authRouter.post(
  '/signup/complete',
  avatarUpload,
  validate(signUpCompleteSchema),
  completeSignUp
);

authRouter.post('/signin', validate(signInSchema), signIn);
authRouter.post('/google', validate(googleSignInSchema), googleSignIn);
authRouter.post('/refresh', refreshToken);
authRouter.post('/signout', signOut);
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
