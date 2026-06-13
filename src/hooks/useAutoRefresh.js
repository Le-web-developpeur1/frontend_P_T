import { useEffect, useRef } from 'react';

const useAutoRefresh = (fetchFn, interval = 30000) => {
  const savedFetch = useRef(fetchFn);

  useEffect(() => {
    savedFetch.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    const tick = () => savedFetch.current();
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval]);
};

export default useAutoRefresh;