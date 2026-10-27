import { useState } from 'react';

// UI choices belong to the history entry, not a global setting for all pages.
export function usePageState(key, initial) {
  const [value, setValue] = useState(() => window.history.state?.pageState?.[key] ?? initial);
  const update = next => {
    const result = typeof next === 'function' ? next(value) : next;
    window.history.replaceState({ ...window.history.state,
      pageState: { ...window.history.state?.pageState, [key]: result },
    }, '');
    setValue(result);
  };
  return [value, update];
}
