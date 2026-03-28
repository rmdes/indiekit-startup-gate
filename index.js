/**
 * Startup gate — defers plugin background tasks until the host signals readiness.
 * Polls for a signal file created by the deployment's start script after the
 * initial site build completes (e.g., Eleventy atomic swap on Cloudron).
 * @module @rmdes/indiekit-startup-gate
 */

import { existsSync } from "node:fs";

const SIGNAL_PATH = "/app/data/.indiekit-ready";
const POLL_INTERVAL = 5000;

/**
 * Wait for the readiness signal, then invoke the callback.
 * If the signal file already exists (hot restart, dev mode), fires immediately.
 * @param {Function} callback - Function to call when ready
 * @param {object} [options]
 * @param {string} [options.label] - Plugin name for log messages
 * @returns {Function} stop - Call to cancel polling (for plugin destroy lifecycle)
 */
export function waitForReady(callback, options = {}) {
  const label = options.label || "plugin";

  if (existsSync(SIGNAL_PATH)) {
    console.info(`[startup-gate] ${label}: ready (signal file exists)`);
    callback();
    return () => {};
  }

  console.info(`[startup-gate] ${label}: waiting for readiness signal...`);

  const timer = setInterval(() => {
    if (existsSync(SIGNAL_PATH)) {
      clearInterval(timer);
      console.info(`[startup-gate] ${label}: ready — starting deferred tasks`);
      callback();
    }
  }, POLL_INTERVAL);

  timer.unref();

  return () => {
    clearInterval(timer);
  };
}
