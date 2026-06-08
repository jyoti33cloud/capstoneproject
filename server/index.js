require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Enhanced CORS configuration - Production Ready
const getAllowedOrigins = () => {
  const clientOrigin = process.env.CLIENT_ORIGIN;

  const allowed = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];

  // Add production URLs
  if (clientOrigin) {
    allowed.push(clientOrigin);
  }

  // Add render production URLs (wildcard support)
  if (process.env.NODE_ENV === 'production') {
    // Allow any onrender.com domain for now (can be restricted later)
    allowed.push(/\.onrender\.com$/);
  }

  console.log('✔ CORS allowed origins:', allowed);
  return allowed;
};

app.use(cors({
  origin: function (origin, callback) {
    const allowed = getAllowedOrigins();

    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check if origin is in allowed list
    const isAllowed = allowed.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Security headers for Google OAuth
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy-Report-Only', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy-Report-Only', 'require-corp');
  next();
});

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'Asha (आशा)',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/specialists', require('./routes/specialists'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/community', require('./routes/community'));
app.use('/api/routine', require('./routes/routine'));
app.use('/api/disability-checklist', require('./routes/disability-checklist'));

// Admin Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin', require('./routes/admin_advanced'));

// Organizations Routes
app.use('/api/organizations', require('./routes/organizations'));

// Therapist Routes
app.use('/api/therapists', require('./routes/therapists'));

// Verification Routes
app.use('/api/verification', require('./routes/verification'));

// Messaging Routes
app.use('/api/messages', require('./routes/messaging'));

// Advanced Appointments Routes
app.use('/api/appointments', require('./routes/appointments_advanced'));

// 404
app.use((req, res) => {
  console.warn(`404: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Express error:', err.message);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✔ Asha API running on port ${PORT}`);
  console.log(`✔ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✔ CLIENT_ORIGIN: ${process.env.CLIENT_ORIGIN || 'not set (using default localhost)'}`);
  console.log(`✔ Database: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}`);
});
