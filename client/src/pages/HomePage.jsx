import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Network,
  Braces,
  Database,
  Cpu,
  Sparkles,
  Bookmark,
  CalendarDays,
  MoveUpRight,
} from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { useLibrary } from '../context/LibraryContext';
import SearchBar from '../components/SearchBar';
import BookCollection from '../components/BookCollection';
import { Skeleton, ErrorState } from '../components/UI';
const popular = [
  ['Data Structures', Braces],
  ['Operating Systems', Cpu],
  ['Computer Networks', Network],
  ['Database Management Systems', Database],
  ['Artificial Intelligence Techniques', Sparkles],
];
export default function HomePage() {
  const stats = useResource('/stats');
  const books = useResource('/books?sort=popular');
  const { config } = useLibrary();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-line" /> YOUR CAMPUS. YOUR LIBRARY.
          </span>
          <h1>
            Find the right book
            <br />
            for your <em>next subject.</em>
          </h1>
          <p>
            Big ideas start with a good book. Discover your college collection,
            <br className="desktop" /> reserve a copy, and make room for what’s next.
          </p>
          <SearchBar />
          <div className="quick-search">
            <span>QUICK PICKS</span>
            {['Data Structures', 'Operating Systems', 'DBMS', 'Java', 'Mathematics'].map((q) => (
              <Link key={q} to={`/books?q=${encodeURIComponent(q)}`}>
                {q}
                <ArrowUpRight size={12} />
              </Link>
            ))}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="art-star">✦</span>
          <div className="art-note">
            <BookOpen size={19} />
            <span>
              A little curiosity.
              <br />
              <strong>Endless possibilities.</strong>
            </span>
          </div>
          <div className="hero-book back-book">
            <span>EXPLORE. LEARN. BUILD.</span>
            <strong>
              THE
              <br />
              ART OF
              <br />
              THINKING
            </strong>
            <div className="arch-shape" />
          </div>
          <div className="hero-book front-book">
            <span>THE STUDENT’S COMPANION</span>
            <strong>
              A world of
              <br />
              knowledge.
              <br />
              <em>Within reach.</em>
            </strong>
            <div className="book-symbol">
              <i />
              <i />
              <i />
            </div>
            <small>
              CAMPUS LIBRARY <BookOpen size={17} />
            </small>
          </div>
          <div className="floating-label">
            <span className="green-dot" /> Your next chapter starts here
          </div>
        </div>
      </section>
      <section className="stats-strip">
        {[
          [stats.data?.titles, 'Curated titles'],
          [stats.data?.available, 'Copies available'],
          [stats.data?.subjects, 'B.Tech subjects'],
          [stats.data?.departments, 'Departments'],
        ].map(([n, label]) => (
          <div key={label}>
            <strong>{n ?? '—'}</strong>
            <span>{label}</span>
          </div>
        ))}
        <div className="stats-note">
          <BookOpen size={26} />
          <span>
            Built for curious minds.
            <br />
            <strong>Made for GVPW.</strong>
          </span>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">START WITH WHAT YOU’RE STUDYING</span>
            <h2>Popular subjects</h2>
          </div>
          <Link className="text-link" to="/categories">
            View all subjects <ArrowRight size={16} />
          </Link>
        </div>
        <div className="subject-grid">
          {popular.map(([name, Icon], i) => (
            <Link
              className="subject-card"
              key={name}
              to={`/books?subject=${encodeURIComponent(name)}`}
            >
              <span className={`subject-icon tone-${i}`}>
                <Icon size={23} />
              </span>
              <h3>{name === 'Database Management Systems' ? 'Database Systems' : name}</h3>
              <span>
                {stats.data?.subjectCounts[name] ?? '—'} titles in collection{' '}
                <ArrowUpRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="section picks-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">GOOD BOOKS. GREAT BEGINNINGS.</span>
            <h2>
              On the reading radar <span className="little-tag">Student picks</span>
            </h2>
          </div>
          <Link className="text-link" to="/books">
            Browse the collection <ArrowRight size={16} />
          </Link>
        </div>
        {books.loading ? (
          <Skeleton />
        ) : books.error ? (
          <ErrorState message={books.error} retry={books.reload} />
        ) : (
          <BookCollection books={books.data.books.slice(0, 4)} reload={books.reload} />
        )}
      </section>
      <section className="semester-banner">
        <div>
          <span className="eyebrow">ONE SEMESTER AT A TIME</span>
          <h2>
            Your syllabus.
            <br />
            Your starting point.
          </h2>
          <p>Find a little direction for your next big idea.</p>
          <Link className="text-link" to="/categories">
            Explore by semester <ArrowRight size={16} />
          </Link>
        </div>
        <div className="semester-grid">
          {(config?.semesters || []).slice(0, 4).map((s) => (
            <Link key={s.number} to={`/books?semester=${s.number}`}>
              <span>
                0{s.number}
                <MoveUpRight size={18} />
              </span>
              <h3>Semester {s.number}</h3>
              <p>{s.subjects.slice(0, 3).join(' · ')}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="how-it-works">
        <div>
          <Bookmark />
          <h3>Find it. Hold it.</h3>
          <p>
            Reserve a copy for 3 calendar days.
            <br />
            Pick it up when you’re on campus.
          </p>
        </div>
        <div>
          <BookOpen />
          <h3>A little time to get lost.</h3>
          <p>
            Borrow for 15 days, with your return
            <br />
            date always within reach.
          </p>
        </div>
        <div>
          <CalendarDays />
          <h3>Dates that work for you.</h3>
          <p>
            Holiday-aware reminders help you
            <br />
            plan your next library visit.
          </p>
        </div>
      </section>
    </>
  );
}
