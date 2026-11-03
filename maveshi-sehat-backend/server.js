require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

// Database Configuration & Migrations
const pool = require('./config/db');

// Express App & HTTP Server
const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Persistent Uploads Handler: Serve from local disk if available, fallback to Neon DB
app.get('/uploads/:filename', async (req, res, next) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, 'uploads', filename);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  try {
    const fileRes = await pool.query('SELECT mime_type, data FROM uploaded_files WHERE filename = $1', [filename]);
    if (fileRes.rows.length > 0) {
      const { mime_type, data } = fileRes.rows[0];
      if (mime_type) res.setHeader('Content-Type', mime_type);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      try {
        if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
          fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
        }
        fs.writeFileSync(filePath, data);
      } catch (_) {}
      return res.send(data);
    }
  } catch (err) {
    console.error('Error fetching file from PostgreSQL:', err.message);
  }

  next();
});

// Static Uploads Directory Fallback
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
const chatRoutes = require('./routes/chat.routes')(pool, io);
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
