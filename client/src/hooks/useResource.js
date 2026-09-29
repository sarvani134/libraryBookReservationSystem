import { useEffect, useState, useCallback } from 'react';
import { api, errorMessage } from '../services/api';
export function useResource(url) {
  const [state, setState] = useState({ url: null, data: null, loading: true, error: '' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!url) {
      setState({ url, data: null, loading: false, error: '' });
      return;
    }
    const controller = new AbortController();
    setState((s) => ({ url, data: s.url === url ? s.data : null, loading: true, error: '' }));
    api
      .get(url, { signal: controller.signal })
      .then(({ data }) => setState({ url, data, loading: false, error: '' }))
      .catch((e) => {
        if (!controller.signal.aborted)
          setState({ url, data: null, loading: false, error: errorMessage(e) });
      });
    return () => controller.abort();
  }, [url, revision]);
  // Never expose the previous endpoint's shape while a new URL is rendering.
  const reload = useCallback(() => setRevision((n) => n + 1), []);
  return {
    ...(state.url === url ? state : { url, data: null, loading: !!url, error: '' }),
    reload,
  };
}
