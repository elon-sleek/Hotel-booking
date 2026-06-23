import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { eachDayOfInterval, parseISO, format } from 'date-fns';
import axios from 'axios';

export default function BookingCalendar({ refreshKey }) {
  const [bookedDates, setBookedDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/bookings/dates')
      .then(res => {
        const dates = [];
        res.data.forEach(({ check_in, check_out }) => {
          const days = eachDayOfInterval({
            start: parseISO(check_in),
            end: new Date(new Date(check_out).getTime() - 86400000), // exclude checkout day
          });
          days.forEach(d => dates.push(format(d, 'yyyy-MM-dd')));
        });
        setBookedDates(dates);
      })
      .catch(err => console.error('Failed to load dates', err))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function tileClassName({ date, view }) {
    if (view === 'month') {
      const key = format(date, 'yyyy-MM-dd');
      if (bookedDates.includes(key)) return 'booked';
    }
    return null;
  }

  function tileDisabled({ date, view }) {
    if (view === 'month') {
      const key = format(date, 'yyyy-MM-dd');
      return bookedDates.includes(key);
    }
    return false;
  }

  return (
    <div className="calendar-wrapper">
      <div className="section-header">
        <h2 className="section-title">📅 Availability Calendar</h2>
        {loading && <span className="badge badge-blue">Loading…</span>}
      </div>
      <Calendar
        className="availability-calendar"
        tileClassName={tileClassName}
        tileDisabled={tileDisabled}
        minDate={new Date()}
        showNeighboringMonth={false}
      />
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot booked" />
          <span>Booked / Unavailable</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot today" />
          <span>Today</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot available" />
          <span>Available</span>
        </div>
      </div>
    </div>
  );
}
