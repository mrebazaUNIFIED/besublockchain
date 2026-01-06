const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/loans', require('./routes/loan.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/usfci', require('./routes/usfci.routes'));
app.use('/api/share', require('./routes/share.routes'));
app.use('/api/portfolio', require('./routes/portfolio.routes'));
// ... agregar más rutas

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` API running on port ${PORT}`);
  console.log(` Besu RPC: ${process.env.BESU_RPC_URL}`);
  console.log(` Chain ID: ${process.env.CHAIN_ID}`);
});