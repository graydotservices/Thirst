// Bound a network request while preserving caller cancellation. AbortSignal.any
// is newer than some browsers supported by Next.js, so keep a small fallback.
export function requestSignal(signal?: AbortSignal | null, milliseconds = 15_000): AbortSignal {
  const deadline = AbortSignal.timeout(milliseconds);
  if (!signal) return deadline;
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([signal, deadline]);
  const controller = new AbortController();
  const abortFromCaller = () => abort(signal);
  const abortFromDeadline = () => abort(deadline);
  const abort = (source: AbortSignal) => {
    signal.removeEventListener('abort', abortFromCaller);
    deadline.removeEventListener('abort', abortFromDeadline);
    controller.abort(source.reason);
  };
  if (signal.aborted) abort(signal);
  else {
    signal.addEventListener('abort', abortFromCaller, { once: true });
    deadline.addEventListener('abort', abortFromDeadline, { once: true });
  }
  return controller.signal;
}
