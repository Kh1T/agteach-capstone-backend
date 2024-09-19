const morgan = require('morgan');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authController = require('./controllers/authController');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

const corsOptions = { credentials: true, origin: 'http://localhost:3000' };

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes

const userRouter = require('./routes/userRoutes');

app.use(authController.isLoginedIn);
app.use(express.json());
app.use(cookieParser());

app.use(cors(corsOptions));

// Routes
app.use('/api/users', userRouter);

app.use(globalErrorHandler);

module.exports = app;
