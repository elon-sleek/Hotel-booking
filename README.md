# The Rock Apartment 2 — Hotel Booking App

A sleek hotel booking web application for **The Rock Apartment 2**, a 5-bedroom duplex en-suite in Ota, Ogun State, Nigeria.

## Features

### Guest Side
- **Home page** with apartment info and amenity highlights
- **Get Directions** button — automatically opens Google Maps or Apple Maps based on device (coordinates: 6.6817566, 3.2112908)
- **Live Availability Calendar** — shows booked/locked-out dates in real time
- **Booking form** — guests enter their name, select dates, and upload a government-issued ID
- **ID data protection** — all ID images are stored securely, access is restricted to admins only, in compliance with the Nigerian Data Protection Regulation (NDPR)

### Admin Side
- **PIN-based login** — secure JWT-authenticated session (default PIN: `1234`, change on first login)
- **Dashboard** — see all bookings with guest names, check-in/check-out dates, duration (nights), and booking status (Upcoming / Ongoing / Past)
- **View guest ID** — admin can securely view uploaded ID images
- **Cancel bookings** — removes booking and deletes the associated ID image
- **Change PIN** — admin can update their login PIN at any time

## Tech Stack

| Layer    | Technology                                |
|----------|-------------------------------------------|
| Frontend | React 18, Vite, react-router-dom, react-calendar, date-fns |
| Backend  | Node.js, Express                          |
| Database | SQLite (via better-sqlite3)               |
| Auth     | JWT (jsonwebtoken) + bcryptjs             |
| Uploads  | Multer                                    |

## Project Structure

```
Hotel-booking/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── components/   Header, BookingCalendar, BookingForm, DirectionButton
│       ├── pages/        Home, BookPage, AdminLogin, AdminDashboard, AdminSettings
│       └── styles/       global.css
├── server/          # Express backend
│   ├── routes/
│   │   ├── bookings.js   # Public booking API
│   │   └── admin.js      # Admin-only API (PIN login, bookings mgmt)
│   ├── db.js             # SQLite setup
│   └── index.js          # Entry point
└── package.json
```

## Getting Started

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment
```bash
cp server/.env.example server/.env
# Edit server/.env — set JWT_SECRET and DEFAULT_ADMIN_PIN
```

### 3. Run in development
```bash
# Terminal 1 — backend
cd server && node index.js

# Terminal 2 — frontend (with hot reload)
cd client && npm run dev
```

### 4. Build for production
```bash
cd client && npm run build
cd ../server && node index.js   # serves built client + API on port 5000
```

## Admin Access

Navigate to `/admin/login` and enter the PIN (default: `1234`).  
**Change the PIN immediately after first login** via the Settings page.

## Data Protection

Guest ID images are:
- Stored with randomised filenames (UUIDs) on the server
- Never exposed publicly — only accessible via an authenticated admin endpoint
- Deleted when a booking is cancelled
- Protected under the Nigerian Data Protection Regulation (NDPR)
