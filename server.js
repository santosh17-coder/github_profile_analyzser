const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection, initializeDatabase } = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middleware

app.use(cors());                    // allow cross-origin requests
app.use(express.json());            // parse JSON request bodies
app.use(morgan('dev'));             // log every request to the console

// Routes 

// Health-check — handy for uptime monitors and load balancers
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'GitHub Profile Analyzer API is running ',
    timestamp: new Date().toISOString(),
  });
});

// All user / analysis routes live under /api/users
app.use('/api/users', userRoutes);

// Catch-all for undefined routes
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found. Check the API docs in the README.',
  });
});

// Error Handling (must be registered last) 

app.use(errorHandler);

// Start the Server 

async function startServer() {
  // Make sure MySQL is reachable before accepting traffic
  await testConnection();

  // Auto-create the table if it doesn't exist yet
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`\nServer is running on http://localhost:${PORT}`);
    console.log(`Health check:  http://localhost:${PORT}/api/health\n`);
  });
}

startServer();
