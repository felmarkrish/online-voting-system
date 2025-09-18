let timer;
let listenersAdded = false;

export function startSessionTimeout(logoutCallback, timeoutMinutes = 5) {
  if (typeof window === "undefined") return; // ✅ avoid SSR issues

  const resetTimer = () => {
    clearTimeout(timer);
    console.debug(`[Session] Resetting inactivity timer for ${timeoutMinutes} minute(s).`);

    timer = setTimeout(() => {
      console.debug("[Session] Inactivity timeout reached. Logging out...");
      logoutCallback();
    }, timeoutMinutes * 60 * 1000); // ⏱ 1 min by default
  };

  if (!listenersAdded) {
    ["click", "mousemove", "keydown", "scroll", "touchstart"].forEach((evt) =>
      window.addEventListener(evt, resetTimer)
    );
    listenersAdded = true;
    console.debug("[Session] Activity listeners added.");
  }

  resetTimer(); // ✅ start first timer
}
