# CLAUDE.md — @rmdes/indiekit-startup-gate

## What This Is

A tiny shared package (single file, zero dependencies) that gates Indiekit plugin background tasks behind a file-based readiness signal. Used by all `@rmdes/*` plugins that have deferrable startup work.

## Architecture

- Exports one function: `waitForReady(callback, options)`
- Polls `fs.existsSync("/app/data/.indiekit-ready")` every 5 seconds
- If file exists at call time, fires callback immediately (hot restart / dev mode)
- Returns a `stop()` function for cleanup in plugin `destroy()` lifecycle
- `timer.unref()` prevents the poll timer from keeping the Node.js process alive

## Signal File Lifecycle

Managed by the deployment's start script (e.g., `indiekit-cloudron/start.sh`):

1. **Before Eleventy build:** `rm -f /app/data/.indiekit-ready`
2. **After atomic swap + nginx reload:** `touch /app/data/.indiekit-ready`

## Integration Pattern

Every `@rmdes/*` plugin with background tasks wraps them:

```javascript
import { waitForReady } from "@rmdes/indiekit-startup-gate";

// In init() — routes and indexes stay immediate, only heavy work is deferred
this._stopGate = waitForReady(
  () => startSync(Indiekit, this.options),
  { label: "PluginName" },
);

// In destroy()
this._stopGate?.();
```

## Plugins Using This Package

See `documentation-central/audits/2026-03-28-plugin-startup-audit.md` for the full list of 11 plugins with deferrable startup tasks.

## Design Docs

- Design: `documentation-central/plans/2026-03-28-startup-gate-design.md`
- Plan: `documentation-central/plans/2026-03-28-startup-gate-plan.md`
- Audit: `documentation-central/audits/2026-03-28-plugin-startup-audit.md`

## Code Style

ESM module (`"type": "module"`). No build step. No dependencies.
