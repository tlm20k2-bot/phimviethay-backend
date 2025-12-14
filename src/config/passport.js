const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Log để debug xem Google trả về gì (xóa sau khi chạy ổn)
      // console.log("Google Profile:", profile);

      // 1. Tìm xem user có google_id này chưa
      let user = await User.findByGoogleId(profile.id);

      if (user) {
        // Đã có -> Cho qua
        return done(null, user);
      }

      // 2. Nếu chưa có google_id, tìm xem có email trùng không
      // (Trường hợp user đã đăng ký bằng email này trước đó rồi)
      if (profile.emails && profile.emails.length > 0) {
          user = await User.findByEmail(profile.emails[0].value);
      }

      if (user) {
        // Tìm thấy email -> Cập nhật google_id vào user cũ để lần sau đăng nhập nhanh
        await User.update(user.id, { 
            google_id: profile.id,
            // Có thể update thêm avatar nếu muốn: avatar: profile.photos[0]?.value 
        });
        // Lấy lại thông tin mới nhất
        user = await User.findById(user.id);
        return done(null, user);
      }

      // 3. Chưa có gì cả -> Tạo user mới hoàn toàn
      const newUserId = await User.createSocialUser({
        username: profile.displayName, 
        email: profile.emails[0].value,
        googleId: profile.id,
        fullname: profile.displayName,
        avatar: profile.photos[0]?.value
      });

      const newUser = await User.findById(newUserId);
      return done(null, newUser);

    } catch (error) {
      console.error("Passport Error:", error);
      return done(error, false);
    }
  }
));

module.exports = passport;