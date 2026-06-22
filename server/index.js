require('dotenv').config();
const path = require('path');
const { app, generalLimiter } = require('./app');

const PORT = process.env.PORT || 5000;

// Serve React build in production (local dev / traditional hosting)
const clientBuild = path.join(__dirname, '../client/dist');
const express = require('express');
app.use(generalLimiter, express.static(clientBuild));
// Catch-all for React client routing (Express 5 requires /{*splat} syntax)
app.get('/{*splat}', generalLimiter, (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`The Rock Apartment 2 server running on port ${PORT}`);
});
