const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const supabase = require('../lib/supabase');

let uuidv4Fn;
let uuidV4Loader;
async function generateUuid() {
  if (!uuidv4Fn) {
    if (!uuidV4Loader) {
      uuidV4Loader = import('uuid').then(({ v4 }) => {
        uuidv4Fn = v4;
        return v4;
      });
    }
    await uuidV4Loader;
  }
  return uuidv4Fn();
}

// Use memory storage — no local disk (required for Vercel serverless)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WEBP images and PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// GET /api/bookings/dates — public, returns booked date ranges
router.get('/dates', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Server misconfigured. Check environment variables.' });
  }
  const { data, error } = await supabase
    .from('bookings')
    .select('check_in, check_out');

  if (error) {
    console.error('Fetch dates error:', error);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
  res.json(data);
});

// POST /api/bookings — create a new booking
router.post('/', upload.single('id_image'), async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Server misconfigured. Check environment variables.' });
  }
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
    const { data: overlap, error: overlapError } = await supabase
      .from('bookings')
      .select('id')
      .lt('check_in', check_out)
      .gt('check_out', check_in)
      .limit(1);

    if (overlapError) {
      console.error('Overlap check error:', overlapError);
      return res.status(500).json({ error: 'Server error. Please try again.' });
    }

    if (overlap && overlap.length > 0) {
      return res.status(409).json({ error: 'Selected dates overlap with an existing booking. Please choose different dates.' });
    }

    // Upload ID image to Supabase Storage
    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `${await generateUuid()}${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('id-images')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload ID image. Please try again.' });
    }

    const numDays = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const id = await generateUuid();

    const { error: insertError } = await supabase
      .from('bookings')
      .insert({
        id,
        guest_name: guest_name.trim(),
        id_image_path: filename,
        check_in,
        check_out,
        num_days: numDays,
      });

    if (insertError) {
      console.error('Insert booking error:', insertError);
      // Clean up uploaded image if DB insert fails
      await supabase.storage.from('id-images').remove([filename]);
      return res.status(500).json({ error: 'Server error. Please try again.' });
    }

    res.status(201).json({ message: 'Booking confirmed!', booking_id: id });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;
