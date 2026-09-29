import { createContext, useContext, useState } from 'react';
import { useResource } from '../hooks/useResource';
const Context = createContext();
export function readStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function store(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Browsing still works when storage is disabled. */
  }
}
export function LibraryProvider({ children }) {
  const config = useResource('/config');
  const [bookmarks, setBookmarks] = useState(() => readStored('campus-bookmarks', []));
  const [registration, setRegistration] = useState(() => readStored('campus-registration', ''));
  const activity = useResource(
    registration ? `/activity/${encodeURIComponent(registration)}` : null,
  );
  const toggleBookmark = (id) =>
    setBookmarks((old) => {
      const next = old.includes(id) ? old.filter((x) => x !== id) : [...old, id];
      store('campus-bookmarks', next);
      return next;
    });
  const remember = (value) => {
    setRegistration(value.toUpperCase());
    store('campus-registration', value.toUpperCase());
  };
  return (
    <Context.Provider
      value={{
        config: config.data,
        configError: config.error,
        reloadConfig: config.reload,
        bookmarks,
        toggleBookmark,
        registration,
        remember,
        activity,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useLibrary = () => useContext(Context);
