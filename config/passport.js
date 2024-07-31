const passport = require('passport');
const NaverStrategy = require('passport-naver-v2').Strategy;
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

passport.use(
  new NaverStrategy(
    {
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: process.env.NAVER_REDIRECT_URI,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const { id, email, nickname } = profile._json;
        let user = await User.findOne({ email });

        if (!user) {
          const randomPassword = '' + Math.floor(Math.random() * 1000000);
          const salt = await bcrypt.genSalt(10);
          const newPassword = await bcrypt.hash(randomPassword, salt);

          user = new User({
            name: nickname,
            email,
            password: newPassword,
            naverId: id,
          });
          await user.save();
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
