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
