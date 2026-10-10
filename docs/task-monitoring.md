# Event monitoring

`/admin/monitoring` uses the backend `/v1/admin/monitoring` API.
Deploy both repositories; the backend creates `task_attempts` and `task_events`
through its existing Hibernate schema-update configuration.

## Current coverage

- H.264 video conversions: queued, running, completed, failed and cancelled.
- MP4 codec inspections: probing, ready, failed and cancelled.
- Server-side admission failures for optional upload conversions.
- Lease expiry / interrupted video workers.

Existing video jobs are imported with their latest known state on backend startup.
Older overwritten attempts and console output cannot be reconstructed retroactively.
New attempts and structured stage/progress events are persistent.

Automatic AVIF/image conversion and unrelated background executors are not connected.
Modifying image publication/cancellation was blocked by the safety review and needs
separate approval; this implementation does not change that storage path.

## Access and operations

`ADMIN_MONITORING` and `ADMIN_ACCESS` are required server-side. OWNER retains all
permissions. The new permission follows the existing role/user permission editor.

Cancellation locks the resource owner's job, checks the exact attempt ID and fences
publication before killing the associated FFmpeg process. Other backend instances
detect cancellation on their process watchdog. Source reads / FFprobe finish at
their next check or timeout; cancellation does not promise instantaneous cleanup.

Retry creates a new attempt and preserves the failed record. Each retry points to
the original and previous attempt. The server rejects retries of superseded
attempts, changed sources and non-failed tasks. Codec-inspection retries remain
inspections, rather than silently opting the user into conversion.

Admin cancel and retry actions are also recorded in the main audit log. Detailed
task events include processing stages and throttled progress milestones, not raw
FFmpeg output, storage credentials, or signed S3 URLs.

The UI polls every five seconds while visible, supports disabling refresh and
uses the shared compact list, controls and pagination components.
