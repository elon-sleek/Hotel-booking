const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
}
const TOKEN_EXPIRY = '8h';
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour

// Seed the super admin from env vars if not already present (runs once per cold start)
let superAdminSeeded = false;
async function ensureSuperAdmin() {
  if (superAdminSeeded) return;
  const username = process.env.SUPER_ADMIN_USERNAME;
  const pin = process.env.SUPER_ADMIN_PIN;
  if (!username || !pin) {
    console.warn('SUPER_ADMIN_USERNAME and SUPER_ADMIN_PIN are not set. Super admin not seeded.');
    superAdminSeeded = true;
    return;
  }

  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .eq('role', 'super_admin')
    .limit(1);

  if (!existing || existing.length === 0) {
    const pinHash = bcrypt.hashSync(String(pin), 10);
    await supabase.from('admins').insert({
      username,
      pin_hash: pinHash,
      role: 'super_admin',
      active: true,
    });
    console.log('Super admin seeded.');
  }
  superAdminSeeded = true;
}

// Middleware: verify admin JWT
function requireAdmin(req, res, next) {
  if (!JWT_SECRET || !supabase) {
    return res.status(503).json({ error: 'Server misconfigured. Check environment variables.' });
  }
  const auth = req.headers.authorization;
  const queryToken = req.query.token;
  const rawToken = auth && auth.startsWith('Bearer ') ? auth.slice(7) : queryToken;
  if (!rawToken) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  try {
    const payload = jwt.verify(rawToken, JWT_SECRET);
    req.admin = payload; // { id, username, role }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Middleware: require super admin role
function requireSuperAdmin(req, res, next) {
  requireAdmin(req, res, () => {
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden. Super admin access required.' });
    }
    next();
  });
}

// POST /api/admin/login
router.post('/login', async (req, res) => {
  if (!JWT_SECRET || !supabase) {
    return res.status(503).json({ error: 'Server misconfigured. Check environment variables.' });
  }
  await ensureSuperAdmin();

  const { username, pin } = req.body;
  if (!username || !pin) {
    return res.status(400).json({ error: 'Username and PIN are required.' });
  }

  const { data: admins, error } = await supabase
    .from('admins')
    .select('id, username, pin_hash, role, active')
    .eq('username', username)
    .limit(1);

  if (error) {
    console.error('Login DB error:', error);
    return res.status(500).json({ error: 'Server error.' });
  }

  const admin = admins && admins[0];
  if (!admin) {
    return res.status(401).json({ error: 'Incorrect username or PIN.' });
  }

  if (!admin.active) {
    return res.status(403).json({ error: 'This account has been deactivated.' });
  }

  const valid = bcrypt.compareSync(String(pin), admin.pin_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect username or PIN.' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: admin.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
  res.json({ token });
});

// PUT /api/admin/pin — change own PIN (any authenticated admin)
router.put('/pin', requireAdmin, async (req, res) => {
  const { current_pin, new_pin } = req.body;

  if (!current_pin || !new_pin) {
    return res.status(400).json({ error: 'current_pin and new_pin are required.' });
  }

  if (String(new_pin).length < 6) {
    return res.status(400).json({ error: 'New PIN must be at least 6 characters.' });
  }

  const { data: admins, error } = await supabase
    .from('admins')
    .select('pin_hash')
    .eq('id', req.admin.id)
    .limit(1);

  if (error || !admins || admins.length === 0) {
    return res.status(500).json({ error: 'Server error.' });
  }

  const valid = bcrypt.compareSync(String(current_pin), admins[0].pin_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Current PIN is incorrect.' });
  }

  const newHash = bcrypt.hashSync(String(new_pin), 10);
  const { error: updateError } = await supabase
    .from('admins')
    .update({ pin_hash: newHash })
    .eq('id', req.admin.id);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update PIN.' });
  }

  res.json({ message: 'PIN updated successfully.' });
});

// GET /api/admin/bookings — list all bookings (authenticated)
router.get('/bookings', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, guest_name, check_in, check_out, num_days, created_at')
    .order('check_in', { ascending: true });

  if (error) {
    console.error('Fetch bookings error:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
  res.json(data);
});

// DELETE /api/admin/bookings/:id — cancel a booking (authenticated)
router.delete('/bookings/:id', requireAdmin, async (req, res) => {
  const { data: bookings, error: fetchError } = await supabase
    .from('bookings')
    .select('id, id_image_path')
    .eq('id', req.params.id)
    .limit(1);

  if (fetchError || !bookings || bookings.length === 0) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const booking = bookings[0];

  // Remove ID image from Supabase Storage
  if (booking.id_image_path) {
    await supabase.storage.from('id-images').remove([booking.id_image_path]);
  }

  const { error: deleteError } = await supabase
    .from('bookings')
    .delete()
    .eq('id', req.params.id);

  if (deleteError) {
    return res.status(500).json({ error: 'Failed to cancel booking.' });
  }

  res.json({ message: 'Booking cancelled.' });
});

// GET /api/admin/bookings/:id/id-image — generate signed URL and redirect (admin only)
router.get('/bookings/:id/id-image', requireAdmin, async (req, res) => {
  const { data: bookings, error: fetchError } = await supabase
    .from('bookings')
    .select('id_image_path')
    .eq('id', req.params.id)
    .limit(1);

  if (fetchError || !bookings || bookings.length === 0) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const { id_image_path } = bookings[0];
  if (!id_image_path) {
    return res.status(404).json({ error: 'ID image not found.' });
  }

  const { data: signedData, error: signError } = await supabase.storage
    .from('id-images')
    .createSignedUrl(id_image_path, SIGNED_URL_EXPIRY_SECONDS);

  if (signError || !signedData) {
    return res.status(500).json({ error: 'Failed to generate image URL.' });
  }

  res.redirect(signedData.signedUrl);
});

// GET /api/admin/extra — get extra admin info (super admin only)
router.get('/extra', requireSuperAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('admins')
    .select('username, active, created_at')
    .eq('role', 'extra_admin')
    .limit(1);

  if (error) {
    return res.status(500).json({ error: 'Server error.' });
  }

  res.json(data && data.length > 0 ? data[0] : null);
});

// POST /api/admin/extra — create or reset extra admin (super admin only)
router.post('/extra', requireSuperAdmin, async (req, res) => {
  const { username, pin } = req.body;

  if (!username || !pin) {
    return res.status(400).json({ error: 'Username and PIN are required.' });
  }
  if (String(pin).length < 6) {
    return res.status(400).json({ error: 'PIN must be at least 6 characters.' });
  }

  const pinHash = bcrypt.hashSync(String(pin), 10);

  // Check if an extra admin already exists
  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .eq('role', 'extra_admin')
    .limit(1);

  if (existing && existing.length > 0) {
    // Update existing extra admin
    const { error: updateError } = await supabase
      .from('admins')
      .update({ username, pin_hash: pinHash, active: true })
      .eq('role', 'extra_admin');

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update extra admin.' });
    }
    return res.json({ message: 'Extra admin updated and activated.' });
  }

  // Create new extra admin
  const { error: insertError } = await supabase.from('admins').insert({
    username,
    pin_hash: pinHash,
    role: 'extra_admin',
    active: true,
  });

  if (insertError) {
    if (insertError.code === '23505') {
      return res.status(409).json({ error: 'Username already taken.' });
    }
    return res.status(500).json({ error: 'Failed to create extra admin.' });
  }

  res.status(201).json({ message: 'Extra admin created.' });
});

// DELETE /api/admin/extra — terminate extra admin access (super admin only)
router.delete('/extra', requireSuperAdmin, async (req, res) => {
  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .eq('role', 'extra_admin')
    .limit(1);

  if (!existing || existing.length === 0) {
    return res.status(404).json({ error: 'No extra admin found.' });
  }

  const { error } = await supabase
    .from('admins')
    .update({ active: false })
    .eq('role', 'extra_admin');

  if (error) {
    return res.status(500).json({ error: 'Failed to terminate extra admin.' });
  }

  res.json({ message: 'Extra admin access terminated.' });
});

module.exports = { router, requireAdmin };
