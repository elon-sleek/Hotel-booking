require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const bookingRoutes = require('./routes/bookings');
const { router: adminRoutes } = require('./routes/admin');

app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Serve React build in production
const clientBuild = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuild));
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`The Rock Apartment 2 server running on port ${PORT}`);
});
