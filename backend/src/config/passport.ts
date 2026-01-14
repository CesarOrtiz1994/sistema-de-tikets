import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import prisma from './database';
import logger from './logger';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const googleId = profile.id;
        const profilePicture = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              googleId,
              name,
              profilePicture,
              roleType: 'REQUESTER',
              isActive: true,
            },
          });

          logger.info(`New user created via Google OAuth: ${email}`);
        } else if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId,
              profilePicture: profilePicture || user.profilePicture,
            },
          });

          logger.info(`User linked with Google account: ${email}`);
        } else {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              profilePicture: profilePicture || user.profilePicture,
            },
          });
        }

        if (!user.isActive) {
          return done(new Error('User account is inactive'), undefined);
        }

        return done(null, user);
      } catch (error) {
        logger.error('Error in Google OAuth strategy:', error);
        return done(error as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
