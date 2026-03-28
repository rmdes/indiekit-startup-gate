# @rmdes/indiekit-startup-gate

Defers Indiekit plugin background tasks until the host signals readiness.

## Problem

On deployment, Indiekit plugins start background work (feed polling, federation queues, sync jobs) immediately — competing for resources with the Eleventy site build. This package gates heavy tasks behind a file-based readiness signal.

## Usage

```javascript
import { waitForReady } from "@rmdes/indiekit-startup-gate";

// In your plugin's init():
this._stopGate = waitForReady(
  () => {
    startPolling(indiekit, options);
  },
  { label: "MyPlugin" },
);

// In your plugin's destroy():
this._stopGate?.();
```

## How It Works

1. The deployment script (`start.sh`) removes `/app/data/.indiekit-ready` before the Eleventy build
2. Plugins call `waitForReady(callback)` — if the file doesn't exist, they poll every 5 seconds
3. After the build completes and the atomic symlink swap happens, `start.sh` creates the file
4. Plugins detect the file and start their background tasks
5. If the file already exists (hot restart, dev mode), the callback fires immediately

## API

### `waitForReady(callback, options?)`

- **callback** `Function` — Called when the readiness signal is detected
- **options.label** `string` — Plugin name for log messages (default: `"plugin"`)
- **Returns** `Function` — Call to cancel polling (for plugin `destroy()` lifecycle)

## Log Output

```
[startup-gate] MyPlugin: waiting for readiness signal...
[startup-gate] MyPlugin: ready — starting deferred tasks
```

## Signal File

Default path: `/app/data/.indiekit-ready`

Currently hardcoded for Cloudron deployments. Will be made configurable for other deployment methods.
