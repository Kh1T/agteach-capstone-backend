/* eslint-disable */

const morgan = require('morgan');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');
const association = require('./config/association');

const globalErrorHandler = require('./controllers/errorController');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://agteach.site',
  'https://teach.agteach.site',
  'https://admin.agteach.site',
];

const corsOptions = {
  origin: allowedOrigins,
  method: '',
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
const cartRouter = require('./routes/cartRoutes')

// app.use(authController.isLoginedIn);
app.use('/webhook', webhookRoutes);
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded( { extended: true, limit: '200mb' }));

app.get('/', async (req, res) => {
  const all = await SectionLecture.findAll();

  res.status(200).json({ all });
});

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
app.use('/api/cart', cartRouter)

app.use(globalErrorHandler);

module.exports = app;
