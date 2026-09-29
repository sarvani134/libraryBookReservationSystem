import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BookOpen, Bookmark, Bell, Menu, X, ArrowUpRight } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
export default function Navbar() {
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  const { activity, registration } = useLibrary();
  const notifications = activity.data?.notifications || [];
  return (
    <>
      <div className="institution">
        <span>GAYATRI VIDYA PARISHAD COLLEGE OF ENGINEERING FOR WOMEN</span>
        <span>
          Visakhapatnam, Andhra Pradesh <span className="institution-dot">•</span>{' '}
          <Link to="/calendar">
            Library calendar <ArrowUpRight size={12} />
          </Link>
        </span>
      </div>
      <header className="header">
        <Link className="brand" to="/">
          <span className="brand-icon">
            <BookOpen size={25} />
          </span>
          <span>
            Campus<span className="brand-light">Library</span>
            <small>A SPACE FOR YOUR NEXT CHAPTER</small>
          </span>
        </Link>
        <nav className={menu ? 'nav open' : 'nav'} aria-label="Main navigation">
          {[
            ['/', 'Home'],
            ['/books', 'Browse Books'],
            ['/categories', 'Categories'],
            ['/activity', 'My Activity'],
            ['/reservations', 'Reservations'],
          ].map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenu(false)}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-tools">
          <Link to="/reading-list" className="icon-btn" aria-label="My reading list">
            <Bookmark size={20} />
          </Link>
          <div className="notification-wrap">
            <button
              className="icon-btn"
              aria-label="Notifications"
              aria-expanded={bell}
              onClick={() => {
                setBell(!bell);
                activity.reload();
              }}
            >
              <Bell size={20} />
              {notifications.length > 0 && <i className="notification-dot" />}
            </button>
            {bell && (
              <section className="notification-panel">
                <div className="row">
                  <h3>Your notifications</h3>
                  <button
                    className="icon-btn"
                    aria-label="Close notifications"
                    onClick={() => setBell(false)}
                  >
                    <X size={16} />
                  </button>
                </div>
                {activity.error ? (
                  <p role="alert">{activity.error}</p>
                ) : notifications.length ? (
                  notifications.map((n, i) => (
                    <div className="notification" key={i}>
                      <strong>{n.title}</strong>
                      <p>{n.message}</p>
                    </div>
                  ))
                ) : (
                  <p>
                    {registration
                      ? 'You’re all caught up.'
                      : 'Look up your registration number in My Activity to see your reminders.'}
                  </p>
                )}
                <Link to="/activity" onClick={() => setBell(false)}>
                  View my activity →
                </Link>
              </section>
            )}
          </div>
          <button
            className="icon-btn mobile-menu"
            aria-label="Toggle navigation"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
