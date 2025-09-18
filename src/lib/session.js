let timer;
let listenersAdded = false;

/**
 * Start a session inactivity timer.
 * @param {Function} logoutCallback - Function to call when session expires.
 * @param {number} timeoutMinutes - Timeout duration in minutes (default: 5).
 */
export function startSessionTimeout(logoutCallback, timeoutMinutes = 5) {
  if (typeof window === "undefined") return; // Avoid SSR issues

  const resetTimer = () => {
    clearTimeout(timer);
    console.debug(`[Session] Resetting inactivity timer for ${timeoutMinutes} minute(s).`);

    timer = setTimeout(() => {
      console.debug("[Session] Inactivity timeout reached. Logging out...");
      logoutCallback();
    }, timeoutMinutes * 60 * 1000);
  };

  if (!listenersAdded) {
    const events = ["click", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));
    listenersAdded = true;
    console.debug("[Session] Activity listeners added.");
  }

  resetTimer();
}

/**
 * Optional: Call this to remove listeners manually (useful on component unmount)
 */
export function stopSessionTimeout() {
  if (typeof window === "undefined") return;

  clearTimeout(timer);
  const events = ["click", "mousemove", "keydown", "scroll", "touchstart"];
  events.forEach((evt) => window.removeEventListener(evt, resetTimer));
  listenersAdded = false;
  console.debug("[Session] Activity listeners removed.");
}
