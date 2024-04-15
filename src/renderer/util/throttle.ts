export default function throttle<T extends any[]>(
  callback: (...args: T) => void,
  limit: number,
) {
  let waiting = false;
  return (...args: T) => {
    if (!waiting) {
      callback(...args);
      waiting = true;
      setTimeout(() => {
        waiting = false;
      }, limit);
    }
  };
}
