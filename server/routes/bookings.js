const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// Multer storage config for ID images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WEBP) and PDF are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// GET /api/bookings/dates — public, returns booked date ranges
router.get('/dates', (req, res) => {
  const rows = db.prepare('SELECT check_in, check_out FROM bookings').all();
  res.json(rows);
});

// POST /api/bookings — create a new booking
router.post('/', upload.single('id_image'), (req, res) => {
  try {
    const { guest_name, check_in, check_out } = req.body;

    if (!guest_name || !check_in || !check_out || !req.file) {
      return res.status(400).json({ error: 'All fields are required (name, check-in, check-out, ID image).' });
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (isNaN(checkInDate) || isNaN(checkOutDate)) {
      return res.status(400).json({ error: 'Invalid dates provided.' });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ error: 'Check-out must be after check-in.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      return res.status(400).json({ error: 'Check-in date cannot be in the past.' });
    }

    // Check for overlapping bookings
    const overlap = db.prepare(`
      SELECT id FROM bookings
      WHERE NOT (check_out <= ? OR check_in >= ?)
    `).get(check_in, check_out);

    if (overlap) {
      return res.status(409).json({ error: 'Selected dates overlap with an existing booking. Please choose different dates.' });
    }

    const numDays = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const id = uuidv4();

    db.prepare(`
      INSERT INTO bookings (id, guest_name, id_image_path, check_in, check_out, num_days)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, guest_name.trim(), req.file.filename, check_in, check_out, numDays);

    res.status(201).json({ message: 'Booking confirmed!', booking_id: id });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;
