const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const routes = require("./routes/index");

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 3000;

// Cấu hình CORS
app.use(
  cors({
    origin: "*", // hoặc cụ thể nếu bạn muốn giới hạn (vd: http://localhost:5173)
    credentials: true,
  })
);

app.use(express.json());

// Phiên làm việc (Passport cần)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretkey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* 🟢 Cấu hình Google OAuth */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? "https://tieuquyhantuluc.onrender.com/api/auth/google/callback"
          : "http://localhost:3000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0]?.value,
            photo: profile.photos[0]?.value,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

/* 🧩 ROUTES */

// Gọi để bắt đầu đăng nhập Google
app.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback từ Google → trả JWT về cho extension
app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user._id,
        name: req.user.displayName,
        email: req.user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // URL đặc biệt cho Chrome extension nhận callback
    const redirectUrl = `https://${
      process.env.EXTENSION_ID || "your-extension-id"
    }.chromiumapp.org/?token=${token}`;

    res.redirect(redirectUrl);
  }
);

// API test user login (frontend hoặc extension có thể gọi)
app.get("/api/current_user", async (req, res) => {
  console.log("===> /api/current_user được gọi");
  console.log("Headers:", req.headers);

  if (!req.headers.authorization) {
    console.log("❌ Không có header Authorization");
    return res.status(401).json({ error: "No token provided" });
  }

  const token = req.headers.authorization.split(" ")[1];
  console.log("Token nhận được:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token hợp lệ, decoded:", decoded);

    const user = await User.findById(decoded.id).select("-__v");
    console.log("✅ User lấy ra:", user);
    res.json(user);
  } catch (err) {
    console.error("❌ Lỗi xác thực token:", err.message);
    res.status(403).json({ error: "Invalid or expired token" });
  }
});

// Gắn route khác (lesson, unit, v.v.)
app.use("/api", routes);

// Khởi động server
app.listen(port, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${port}`);
});
