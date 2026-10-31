require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Database Configuration & Migrations
const pool = require('./config/db');

// Express App & HTTP Server
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Static Uploads Directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/', (req, res) => {
  res.send('Maveshi Sehat AI API is running!');
});

// Socket.io Realtime Handler
require('./services/socketHandler')(io, pool);

// Modular Routes
const authRoutes = require('./routes/auth.routes')(pool);
const farmerRoutes = require('./routes/farmer.routes')(pool, io);
const vetRoutes = require('./routes/vet.routes')(pool, io);
const adminRoutes = require('./routes/admin.routes')(pool, io);
const pharmacyRoutes = require('./routes/pharmacy.routes')(pool);
const chatRoutes = require('./routes/chat.routes')(pool);
const forumRoutes = require('./routes/forum.routes')(pool);
const translateRoutes = require('./routes/translate.routes')();
const chatbotRoutes = require('./routes/chatbot')(pool);
const notificationRoutes = require('./routes/notification.routes')(pool, io);
const weatherRoutes = require('./routes/weather.routes')(pool, io);
const { initHeatStressCron } = require('./services/heatStressService');

// Mount All Routers
app.use('/', authRoutes);
app.use('/', farmerRoutes);
app.use('/', vetRoutes);
app.use('/', adminRoutes);
app.use('/', pharmacyRoutes);
app.use('/', chatRoutes);
app.use('/', forumRoutes);
app.use('/', translateRoutes);
app.use('/', notificationRoutes);
app.use('/', weatherRoutes);
app.use('/api/chat', chatbotRoutes);

// Initialize Automated Heat Stress Monitoring Daemon
initHeatStressCron(pool, io);

// Server Listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Maveshi Sehat AI Server running on port ${PORT}`);
});
