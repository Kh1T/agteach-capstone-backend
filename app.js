const morgan = require('morgan');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

const allowedOrigins = ['https://example.com', 'https://another-example.com']; // List of allowed origins

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error('Not allowed by CORS')); // Reject the request
    }
  },
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
