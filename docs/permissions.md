# Permissions

OWNER manages role defaults and individual overrides at `/admin/permissions`.
The Users page also links directly to an account's permission overrides.

Each user permission has three states: inherit the role default, allow, or deny.
User overrides take priority over role defaults. OWNER always has every permission;
BANNED and DELETED accounts never receive grants.

The admin master switch and a section's permission must both be enabled to use
that section. Resource deletion and password bypass are independent permissions
and do not require admin access. Existing owners retain access to their own content.
Pack viewer IP and user-agent permissions are independent and apply to My Files;
admin pack history remains available with the File Packs section permission.

`URL_VIEW_IP` and `URL_VIEW_UA` independently reveal network details in My URLs.
URL history is owner-only; the separate admin history requires `ADMIN_URLS` and
the admin master switch. Visitors are identified from the authenticated session
when one is present, otherwise shown as anonymous. Old history records have no
visitor identity and therefore appear anonymous. Counts come from stored visit
records, including those created before the counter fix. Redirects are temporary
and no-store so browser redirect caching does not suppress subsequent visits.

Permission booleans use checkboxes. Toggling a user checkbox creates an override;
checking Inherit removes it. OWNER is not offered in the role or user picker.

## IP mapper

Manage global masking rules in Admin Settings. IPv4 and IPv6 literals are supported
and normalized; hostnames, ports and CIDR ranges are not accepted. Matching IPs
are replaced by `****` at the JSON response boundary, including nested session,
history and audit data, regardless of the viewer's permissions (including OWNER).
IPv6 aliases and IPv4-mapped IPv6 addresses are recognized. Database records and
redirect Location headers are not rewritten. The authorized rule-management
endpoint is the exception, so administrators can edit/remove the actual rules.
Rules are independent of settings presets. Already-open pages need a refresh.

Deployment also creates `ip_mask_rules`, adds nullable `url_logs.viewer_id`,
and indexes URL history. New visits update their counter and history in one
transaction; no historical log records are deleted or rewritten.

## System metrics

The compact System view includes per-pool, per-state and per-statistic series
plus JVM/OS runtime details. Counters and timers use their native measurements,
memory summaries sum pools, and unsupported/invalid samples are omitted.
Environment variables, startup arguments, filesystem paths and credentials
are excluded. Refresh is manual by default, with optional 15-second refresh.

Defaults preserve existing access: ADMIN has admin sections, resource deletion,
and file-pack password bypass; MODERATOR can delete images and pastes. Other
roles start without additional privileges. OWNER can change these role defaults.

The API enforces permissions for both sessions and API keys. Admin server requests
forward the caller's session instead of using the frontend's service API key.
The separate public, Turnstile-validated Minecraft registration flow is unchanged.
Permission changes are audit logged, and newly authorized requests read the
current policies without a cross-request permissions cache.

Deploy the backend before the frontend. Its JPA schema update creates
`permission_policies` and `permission_policy_values`; environments with automatic
schema updates disabled must provision those tables from the entity mappings.
Until the updated API returns permissions, the frontend denies non-OWNER admin
access. Existing browser views may need a refresh after changing permissions;
the backend checks the new policy immediately.
