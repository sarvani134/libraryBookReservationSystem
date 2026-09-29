import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useResource } from '../hooks/useResource';
import { useLibrary, readStored, store } from '../context/LibraryContext';
import SearchBar from '../components/SearchBar';
import BookCollection from '../components/BookCollection';
import { Skeleton, ErrorState } from '../components/UI';
export default function BrowseBooksPage() {
  const [params, setParams] = useSearchParams();
  const { config } = useLibrary();
  const resource = useResource(`/books?${params}`);
  const [filters, setFilters] = useState(false);
  const [recent, setRecent] = useState(() => readStored('campus-searches', []));
  const query = params.get('q');
  const semester = params.get('semester');
  const semesterSubjects = (config?.subjects || []).filter(
    (subject) => !semester || subject.semester === Number(semester),
  );
  useEffect(() => {
    const subject = params.get('subject');
    if (
      config &&
      semester &&
      subject &&
      !config.subjects.some((item) => item.semester === Number(semester) && item.name === subject)
    ) {
      const next = new URLSearchParams(params);
      next.delete('subject');
      setParams(next, { replace: true });
    }
  }, [config, semester, params, setParams]);
  useEffect(() => {
    if (query) {
      const next = [query, ...readStored('campus-searches', []).filter((s) => s !== query)].slice(
        0,
        6,
      );
      store('campus-searches', next);
      setRecent(next);
    }
  }, [query]);
  const change = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (
      key === 'semester' &&
      value &&
      !config?.subjects.some(
        (subject) => subject.semester === Number(value) && subject.name === next.get('subject'),
      )
    )
      next.delete('subject');
    setParams(next);
  };
  const filter = (label, key, options) => (
    <label key={key}>
      {label}
      <select
        aria-label={label}
        value={params.get(key) || ''}
        onChange={(e) => change(key, e.target.value)}
      >
        <option value="">
          {label === 'Availability' ? 'Any availability' : `All ${label.toLowerCase()}s`}
        </option>
        {options.map((o) => (
          <option
            key={typeof o === 'string' ? o : o.value}
            value={typeof o === 'string' ? o : o.value}
          >
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="page">
      <div className="page-heading">
        <span className="eyebrow">THE COLLECTION</span>
        <h1>Find your next great read.</h1>
        <p>Browse titles and authors, check copies left, and reserve your next book.</p>
        <Link className="text-link" to="/reservations">
          View or withdraw my reservations
        </Link>
      </div>
      <SearchBar key={params.get('q') || ''} initial={params.get('q') || ''} compact />
      {recent.length > 0 && (
        <div className="recent-search">
          <span>Recent searches</span>
          {recent.map((q) => (
            <button key={q} onClick={() => change('q', q)}>
              {q}
            </button>
          ))}
          <button
            onClick={() => {
              store('campus-searches', []);
              setRecent([]);
            }}
          >
            Clear history
          </button>
        </div>
      )}
      <div className="browse-layout">
        <aside className={`filter-sidebar ${filters ? 'visible' : ''}`}>
          <div className="row">
            <h3>
              <SlidersHorizontal size={17} /> Refine your search
            </h3>
            <button className="text-btn" onClick={() => setParams({})}>
              Reset
            </button>
          </div>
          {filter('Department', 'department', config?.departments || [])}
          {filter(
            'Semester',
            'semester',
            Array.from({ length: 8 }, (_, i) => ({ value: i + 1, label: `Semester ${i + 1}` })),
          )}
          {filter(
            'Subject',
            'subject',
            semesterSubjects.map((s) => s.name),
          )}
          {filter('Availability', 'availability', [
            { value: 'available', label: 'Available now' },
            { value: 'reserved', label: 'Has reserved copies' },
            { value: 'unavailable', label: 'Unavailable' },
          ])}
          {filter('Author', 'author', resource.data?.facets.authors || [])}
          <label>
            Publication year
            <input
              type="number"
              min="1800"
              max="2100"
              placeholder="Any year"
              value={params.get('year') || ''}
              onChange={(e) => change('year', e.target.value)}
            />
          </label>
          <p className="small muted">
            Seed editions are unverified; publication years are left blank. Add verified editions in
            Demo Management.
          </p>
          <div className="sidebar-note">
            <BookNote />
          </div>
        </aside>
        <div className="browse-results">
          <div className="results-bar">
            <span>
              <strong>{resource.data?.total ?? '…'}</strong> books{' '}
              {params.get('q') && <>for “{params.get('q')}”</>}
            </span>
            <button className="mobile-filter text-btn" onClick={() => setFilters(!filters)}>
              Filters
            </button>
            <label className="sort-label">
              Sort by
              <select
                aria-label="Sort books"
                value={params.get('sort') || 'relevance'}
                onChange={(e) => change('sort', e.target.value)}
              >
                {[
                  ['relevance', 'Most relevant'],
                  ['title', 'Title A–Z'],
                  ['availability', 'Availability'],
                  ['newest', 'Newest'],
                  ['popular', 'Most popular'],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="active-filters">
            {[...params]
              .filter(([k]) => k !== 'sort')
              .map(([k, v]) => (
                <button key={k} onClick={() => change(k, '')}>
                  {v}
                  <X size={13} />
                </button>
              ))}
          </div>
          {resource.loading ? (
            <Skeleton count={8} />
          ) : resource.error ? (
            <ErrorState message={resource.error} retry={resource.reload} />
          ) : (
            <BookCollection books={resource.data.books} reload={resource.reload} />
          )}
        </div>
      </div>
    </div>
  );
}
function BookNote() {
  return (
    <>
      <Search size={22} />
      <h3>Start with a topic.</h3>
      <p>Try “deadlocks”, “graphs”, or “TCP”. Discover books beyond their titles.</p>
    </>
  );
}
