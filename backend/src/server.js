// Load env vars FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Now import everything else
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
// import rateLimit from 'express-rate-limit'; // ❌ REMOVED - No rate limiting
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Verify critical environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'STRIPE_SECRET_KEY', 'ENCRYPTION_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease check your .env file and ensure all required variables are set.\n');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('✅ Stripe key found:', process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...');

// Connect to database
connectDB();

// Route files
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import userRoutes from './routes/users.js';
import orderRoutes from './routes/orders.js';
import webhookRoutes from './routes/webhooks.js';
import digitalProductRoutes from './routes/digitalProducts.js';
import digitalOrderRoutes from './routes/digitalOrders.js';
import twoFactorRoutes from './routes/twoFactor.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Stripe webhook (MUST be before body parser)
app.use('/api/webhooks', webhookRoutes);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Enable CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Security headers
app.use(helmet());

// Prevent MongoDB injection
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// ❌ RATE LIMITING REMOVED
// No rate limiting - unlimited requests allowed
// const limiter = rateLimit({
//   windowMs: 10 * 60 * 1000,
//   max: 100,
//   message: 'Too many requests from this IP, please try again later.',
// });
// app.use('/api/', limiter);
console.log('⚠️ WARNING: Rate limiting is DISABLED');

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
          message: '🚀 DigitalCommerce API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/digital-products', digitalProductRoutes);
app.use('/api/digital-orders', digitalOrderRoutes);
app.use('/api/auth/2fa', twoFactorRoutes);
app.use('/api/admin', adminRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`${'='.repeat(50)}\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});