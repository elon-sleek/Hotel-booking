const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'rockApartment2_secret_2024';
const TOKEN_EXPIRY = '8h';

// Middleware: verify admin JWT (supports Authorization header or ?token= query param)
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  const queryToken = req.query.token;
  const rawToken = auth && auth.startsWith('Bearer ') ? auth.slice(7) : queryToken;
  if (!rawToken) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  try {
    const payload = jwt.verify(rawToken, JWT_SECRET);
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'PIN is required.' });
  }

  const admin = db.prepare('SELECT pin_hash FROM admin WHERE id = 1').get();
  if (!admin) {
    return res.status(500).json({ error: 'Admin not configured.' });
  }

  const valid = bcrypt.compareSync(String(pin), admin.pin_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect PIN.' });
  }

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.json({ token });
});

// PUT /api/admin/pin — change admin PIN (authenticated)
router.put('/pin', requireAdmin, (req, res) => {
  const { current_pin, new_pin } = req.body;

  if (!current_pin || !new_pin) {
    return res.status(400).json({ error: 'current_pin and new_pin are required.' });
  }

  if (String(new_pin).length < 4) {
    return res.status(400).json({ error: 'New PIN must be at least 4 characters.' });
  }

  const admin = db.prepare('SELECT pin_hash FROM admin WHERE id = 1').get();
  const valid = bcrypt.compareSync(String(current_pin), admin.pin_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Current PIN is incorrect.' });
  }

  const newHash = bcrypt.hashSync(String(new_pin), 10);
  db.prepare('UPDATE admin SET pin_hash = ? WHERE id = 1').run(newHash);
  res.json({ message: 'PIN updated successfully.' });
});

// GET /api/admin/bookings — list all bookings (authenticated)
router.get('/bookings', requireAdmin, (req, res) => {
  const bookings = db.prepare(`
    SELECT id, guest_name, check_in, check_out, num_days, created_at
    FROM bookings
    ORDER BY check_in ASC
  `).all();
  res.json(bookings);
});

// DELETE /api/admin/bookings/:id — cancel a booking (authenticated)
router.delete('/bookings/:id', requireAdmin, (req, res) => {
  const booking = db.prepare('SELECT id, id_image_path FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  // Remove ID image file
  const imgPath = path.join(__dirname, '../uploads', booking.id_image_path);
  if (fs.existsSync(imgPath)) {
    fs.unlinkSync(imgPath);
  }

  db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  res.json({ message: 'Booking cancelled.' });
});

// GET /api/admin/bookings/:id/id-image — serve ID image (admin only)
router.get('/bookings/:id/id-image', requireAdmin, (req, res) => {
  const booking = db.prepare('SELECT id_image_path FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const imgPath = path.join(__dirname, '../uploads', booking.id_image_path);
  if (!fs.existsSync(imgPath)) {
    return res.status(404).json({ error: 'ID image not found.' });
  }

  res.sendFile(imgPath);
});

module.exports = { router, requireAdmin };
