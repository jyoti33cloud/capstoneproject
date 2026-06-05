require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      process.env.CLIENT_ORIGIN
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Admin Routes (NEW)
app.use('/api/admin', require('./routes/admin'));

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
  console.log(`✔ Asha API running on http://localhost:${PORT}`);
  console.log(`✔ CORS enabled for: ${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}`);
  console.log(`✔ Environment: ${process.env.NODE_ENV || 'development'}`);
});
