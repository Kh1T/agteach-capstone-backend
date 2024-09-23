const morgan = require('morgan');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://agteach.site',
  'https://teach.agteach.site',
  'https://admin.agteach.site',
]; // List of allowed origins

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true, // Allow credentials
};

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes

const userRouter = require('./routes/userRoutes');
const instructorRouter = require('./routes/instructorRoutes');
const adminRouter = require('./routes/adminRoutes');
const customerRouter = require('./routes/customerRoutes');

// app.use(authController.isLoginedIn);
app.use(express.json());
app.use(cookieParser());

app.use(cors(corsOptions));

// Routes
app.use('/api/users', userRouter);
app.use('/api/customer', customerRouter);
app.use('/api/instructor', instructorRouter);
app.use('/api/admin', adminRouter);

app.use(globalErrorHandler);

module.exports = app;
