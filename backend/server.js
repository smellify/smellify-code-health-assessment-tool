require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.set('trust proxy', true);

app.use(cors());
app.use(express.json());
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use("/api/billing", require("./routes/billing"));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/aisuggestions'));

app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 10 * 60 * 1000 // 10 minutes in milliseconds
  }
}));

app.use('/api/github', require('./routes/githubAuth'));
app.use('/api/2fa', require('./routes/twoFA'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/referral', require('./routes/referral'));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
