import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { readStored, store } from '../context/LibraryContext';
import { api } from '../services/api';
export default function SearchBar({ initial = '', compact = false }) {
  const [value, setValue] = useState(initial);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const navigate = useNavigate();
  useEffect(() => {
    setSuggestions([]);
    setActive(-1);
    if (value.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/books/suggestions', {
          params: { q: value.trim() },
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setSuggestions(data.suggestions);
      } catch {
        /* Search submission remains available when suggestions cannot load. */
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);
  const options =
    value.trim().length >= 2
      ? suggestions
      : readStored('campus-searches', [])
          .slice(0, 6)
          .map((text) => ({ text, type: 'Recent search' }));
  const expanded = open && options.length > 0;
  function search(text) {
    const q = text.trim();
    if (q)
      store(
        'campus-searches',
        [q, ...readStored('campus-searches', []).filter((s) => s !== q)].slice(0, 6),
      );
    setValue(q);
    setOpen(false);
    navigate(`/books${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        search(expanded && active >= 0 ? options[active].text : value);
      }}
      className={`search-bar ${compact ? 'compact' : ''}`}
      role="search"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <Search size={22} />
      <input
        aria-label="Search library"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined}
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        maxLength={120}
        placeholder="Search by book, author, subject, topic or ISBN..."
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            setActive(-1);
          }
          if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && options.length) {
            e.preventDefault();
            setOpen(true);
            setActive((index) =>
              e.key === 'ArrowDown'
                ? (index + 1) % options.length
                : index <= 0
                  ? options.length - 1
                  : index - 1,
            );
          }
        }}
      />
      <button className="btn" type="submit">
        Search <ArrowRight size={17} />
      </button>
      {expanded && (
        <div
          className="search-suggestions"
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
        >
          {options.map((option, index) => (
            <div
              key={option.text}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={active === index}
              className={active === index ? 'selected' : ''}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => search(option.text)}
            >
              <Search size={17} />
              <span>
                {option.text}
                <small>{option.type}</small>
              </span>
              <ArrowRight size={15} />
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
