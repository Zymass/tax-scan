import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

// Only initialize Google OAuth strategy if credentials are provided
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const isGoogleOAuthEnabled = !!(googleClientId && googleClientSecret);

if (isGoogleOAuthEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/google/callback`
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const result = await authService.findOrCreateGoogleUser({
            id: profile.id,
            emails: profile.emails || [],
            displayName: profile.displayName || '',
            photos: profile.photos || []
          });
          return done(null, result);
        } catch (error: any) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.log('⚠️  Google OAuth credentials not provided. Google sign-in will be disabled.');
}

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
