import { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, ArrowUpRight } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import BrowseBooksPage from './pages/BrowseBooksPage';
import CategoriesPage from './pages/CategoriesPage';
import BookDetailsPage from './pages/BookDetailsPage';
import ActivityPage from './pages/ActivityPage';
import CalendarPage from './pages/CalendarPage';
import ReadingListPage from './pages/ReadingListPage';
import ManagementPage from './pages/ManagementPage';
import { Empty } from './components/UI';
export default function App() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<BrowseBooksPage />} />
          <Route path="/books/:bookId" element={<BookDetailsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/reservations" element={<ActivityPage reservationsOnly />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/reading-list" element={<ReadingListPage />} />
          <Route path="/manage" element={<ManagementPage />} />
          <Route
            path="*"
            element={
              <Empty title="This chapter doesn’t exist" message="Let’s find you a book instead." />
            }
          />
        </Routes>
      </main>
      <footer>
        <div>
          <Link className="footer-brand" to="/">
            <BookOpen size={23} /> Campus Library
          </Link>
          <p>A space to discover. A place to grow.</p>
          <span>
            Gayatri Vidya Parishad College of Engineering for Women
            <br />
            Visakhapatnam, Andhra Pradesh, India
          </span>
        </div>
        <div className="footer-links">
          <Link to="/books">
            Explore the collection <ArrowUpRight size={13} />
          </Link>
          <Link to="/calendar">Library calendar</Link>
          <Link to="/reading-list">My reading list</Link>
          <Link to="/manage">Demo management</Link>
        </div>
        <div className="footer-bottom">
          <span>Made for learning, one chapter at a time.</span>
          <span>Campus Library · An independent student project</span>
        </div>
      </footer>
      <Toaster
        position="bottom-right"
        toastOptions={{ style: { background: '#183e37', color: '#fff', borderRadius: 12 } }}
      />
    </>
  );
}
