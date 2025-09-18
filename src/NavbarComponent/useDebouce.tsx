import { useRef, useEffect } from "react";

type DebounceFunction = (...args: any[]) => void;

const useDebounce = (func: DebounceFunction, delay: number) => {
  // Specify that timeoutRef holds a number or null
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (...args: any[]) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export default useDebounce;
