const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Create HTTP server wrapping Express
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

// Store io on app so controllers can access it via req.app.get('io')
app.set('io', io);

// WebSocket connection lifecycle & room management
io.on('connection', (socket) => {
  console.log(`🔌 New WebSocket client connected: ${socket.id}`);

  // Authority clients join the 'authorities' dispatch room
  socket.on('join_authorities', () => {
    socket.join('authorities');
    console.log(`👮 Client ${socket.id} joined 'authorities' room`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded photos statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/incidents', require('./routes/incidentRoutes'));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Smart Traffic Incident Reporting API + WebSockets running!',
    timestamps: new Date()
  });
});

const PORT = process.env.PORT || 5000;

// Listen on the HTTP server (handles both Express routes & WebSockets)
server.listen(PORT, () => {
  console.log(`🚀 Server + WebSockets running on port ${PORT}`);
});