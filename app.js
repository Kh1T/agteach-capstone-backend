/* eslint-disable */

const morgan = require('morgan');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const association = require('./config/association');

const globalErrorHandler = require('./controllers/errorController');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://alphabeez.anbschool.org',
  'https://instructor.alphabeez.anbschool.org',
  'https://admin.alphabeez.anbschool.org',
  //CyberNexus
  'http://localhost:5173',
  'https://cybernexus.anbschool.org',
  'https://harvesthub.site',
];

const corsOptions = {
  origin: allowedOrigins,
  method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // Allow credentials
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes

const userRouter = require('./routes/userRoutes');
const instructorRouter = require('./routes/instructorRoutes');
const adminRouter = require('./routes/adminRoutes');
const customerRouter = require('./routes/customerRoutes');
const productRouter = require('./routes/productRoutes');
const courseRouter = require('./routes/courseRoutes');
const viewRouter = require('./routes/viewRoutes');
const enrollmentRouter = require('./routes/enrollmentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const purchasedRouter = require('./routes/purchasedRoutes');
const cartRouter = require('./routes/cartRoutes');
const paymentRouter = require('./routes/paymentRoutes');

app.use('/webhook', webhookRoutes);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/users', userRouter);
app.use('/api/customer', customerRouter);
app.use('/api/instructor', instructorRouter);
app.use('/api/admin', adminRouter);
app.use('/api/view', viewRouter);
app.use('/api/product', productRouter);
app.use('/api/course', courseRouter);
app.use('/api/enrollment', enrollmentRouter);
app.use('/api/purchased', purchasedRouter);
app.use('/api/cart', cartRouter);
app.use('/api/payment', paymentRouter);

app.use(globalErrorHandler);

module.exports = app;
