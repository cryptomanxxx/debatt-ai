// Poll only visible pages; share a slow request instead of overlapping it.
// An initial fetch and a fetch on return to the tab keep the widget current.
export function startVisiblePolling({
  document, run, intervalMs = 30000,
  setIntervalFn = setInterval, clearIntervalFn = clearInterval,
}) {
  let stopped = false;
  let pending = false;
  const tick = () => {
    if (stopped || pending || document.visibilityState !== "visible") return;
    pending = true;
    Promise.resolve().then(() => { if (!stopped) return run(); }).catch(() => {}).finally(() => { pending = false; });
  };
  const timer = setIntervalFn(tick, intervalMs);
  document.addEventListener("visibilitychange", tick);
  tick();
  return () => {
    stopped = true;
    clearIntervalFn(timer);
    document.removeEventListener("visibilitychange", tick);
  };
}
