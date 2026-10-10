"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {useSearchParams} from "next/navigation";
import {FaRotateLeft, FaShieldHalved, FaUser, FaUsers} from "react-icons/fa6";
import MainStringInput from "@/components/MainStringInput";
import HoverDiv, {SaveButton} from "@/components/HoverDiv";
import {getApiUrl} from "@/lib/core";
import {errorToast, okToast} from "@/lib/client";
import {PERMISSIONS, type Permission, type PermissionOverrides} from "@/lib/permissions";
import type {RoleType} from "@/types/user";

type RolePolicy = {
    role: RoleType;
    overrides: PermissionOverrides;
    effective: Permission[];
};

type UserOption = {
    uid: number;
    username: string;
    role: RoleType;
    avatar?: string;
};

type UserPolicy = UserOption & {
    overrides: PermissionOverrides;
    inherited: Permission[];
    effective: Permission[];
};

async function request<T>(path = "", options?: RequestInit): Promise<T> {
    const response = await fetch(getApiUrl() + "/v1/admin/permissions" + path, {
        ...options,
        credentials: "include",
        cache: "no-store",
        headers: {
            Accept: "application/json",
            ...(options?.body ? {"Content-Type": "application/json"} : {}),
        },
    });
    const body = await response.json();
    if (!response.ok || body.error) {
        throw new Error(body.message || "Permissions request failed");
    }
    return body.message as T;
}

export default function PermissionsClient() {
    const params = useSearchParams();
    const initialUid = params.get("user") ?? "";
    const [mode, setMode] = useState<"role" | "user">(initialUid ? "user" : "role");
    const [roles, setRoles] = useState<RolePolicy[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [role, setRole] = useState<RoleType>("ADMIN");
    const [uid, setUid] = useState(initialUid);
    const [search, setSearch] = useState("");
    const [userPolicy, setUserPolicy] = useState<UserPolicy | null>(null);
    const [values, setValues] = useState<PermissionOverrides>({});
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const selectionVersion = useRef(0);

    useEffect(() => {
        let active = true;
        Promise.all([request<RolePolicy[]>(), request<UserOption[]>("/user-options")])
            .then(([rolePolicies, options]) => {
                if (active) {
                    setRoles(rolePolicies.filter(policy => policy.role !== "OWNER"));
                    setUsers(options.filter(user => user.role !== "OWNER"));
                }
            })
            .catch(error => {
                if (active) {
                    setError(error.message);
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const version = ++selectionVersion.current;
        setError("");
        setUserPolicy(null);
        setBusy(false);
        setValues({});
        if (mode === "role") {
            const selected = roles.find(item => item.role === role);
            if (selected) {
                setValues(Object.fromEntries(PERMISSIONS.map(permission => [
                    permission.key,
                    selected.effective.includes(permission.key),
                ])));
            }
            return;
        }
        if (!uid) {
            return;
        }
        setBusy(true);
        request<UserPolicy>(`/users/${encodeURIComponent(uid)}`)
            .then(policy => {
                if (version === selectionVersion.current) {
                    if (policy.role === "OWNER") {
                        setUid("");
                        setError("OWNER always has all permissions and cannot be edited.");
                        return;
                    }
                    setUserPolicy(policy);
                    setValues(policy.overrides);
                }
            })
            .catch(error => {
                if (version === selectionVersion.current) {
                    setError(error.message);
                }
            })
            .finally(() => {
                if (version === selectionVersion.current) {
                    setBusy(false);
                }
            });
        return () => {
            selectionVersion.current += 1;
        };
    }, [mode, uid, role, roles]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        return users.filter(user => user.username.toLowerCase().includes(query)
            || String(user.uid).includes(query))
            .sort((a, b) => Number(b.username.toLowerCase().startsWith(query))
                - Number(a.username.toLowerCase().startsWith(query))
                || a.username.localeCompare(b.username))
            .slice(0, 20);
    }, [users, search]);

    const selectedRole = mode === "role" ? role : userPolicy?.role;
    const fixed = selectedRole === "OWNER" || selectedRole === "BANNED" || selectedRole === "DELETED";
    const ready = mode === "role" ? roles.length > 0 : !!userPolicy;

    const save = async () => {
        setBusy(true);
        try {
            const path = mode === "role" ? `/roles/${role}` : `/users/${uid}`;
            await request(path, {method: "PUT", body: JSON.stringify({permissions: values})});
            if (mode === "role") {
                setRoles((await request<RolePolicy[]>()).filter(policy => policy.role !== "OWNER"));
            } else {
                const policy = await request<UserPolicy>(`/users/${uid}`);
                setUserPolicy(policy);
                setValues(policy.overrides);
            }
            okToast("Permissions saved. New requests use the updated permissions immediately.");
        } catch (error) {
            errorToast(error instanceof Error ? error.message : "Failed to save permissions");
        } finally {
            setBusy(false);
        }
    };

    const change = (permission: Permission, value: string) => {
        setValues(previous => {
            const next = {...previous};
            if (value === "inherit") {
                delete next[permission];
            } else {
                next[permission] = value === "allow";
            }
            return next;
        });
    };

    return (
        <section className="mx-auto max-w-4xl space-y-4">
            <header>
                <h1 className="flex items-center gap-2 text-xl font-semibold">
                    <FaShieldHalved className="text-zinc-400" /> Permissions
                </h1>
                <p className="mt-1 text-xs text-zinc-500">
                    Role defaults apply to the whole group. User overrides take priority. Only OWNER can edit permissions.
                </p>
            </header>
            <div className="box-primary space-y-3 p-4">
                <div className="flex gap-2">
                    <HoverDiv
                        type="INFO"
                        icon={<FaUsers />}
                        disabled={busy}
                        onClick={() => setMode("role")}
                        className={`px-3 py-1.5 text-xs ${mode === "role" ? "text-sky-300" : "text-zinc-500"}`}
                    >
                        Roles
                    </HoverDiv>
                    <HoverDiv
                        type="INFO"
                        icon={<FaUser />}
                        disabled={busy}
                        onClick={() => setMode("user")}
                        className={`px-3 py-1.5 text-xs ${mode === "user" ? "text-sky-300" : "text-zinc-500"}`}
                    >
                        User overrides
                    </HoverDiv>
                </div>
                {mode === "role" ? (
                    <select
                        aria-label="Role"
                        value={role}
                        disabled={busy || loading}
                        onChange={event => setRole(event.target.value as RoleType)}
                        className="w-full rounded border border-zinc-800 bg-primary1 p-2 text-xs"
                    >
                        {roles.map(item => (
                            <option key={item.role} value={item.role}>{item.role}</option>
                        ))}
                    </select>
                ) : (
                    <div className="space-y-2">
                        <MainStringInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Search username or user ID"
                            aria-label="Search users"
                        />
                        {userPolicy && (
                            <p className="text-xs text-sky-300">
                                Editing {userPolicy.username} · #{userPolicy.uid} · {userPolicy.role}
                            </p>
                        )}
                        <div aria-label="Select a user" className="grid max-h-56 gap-1 overflow-y-auto sm:grid-cols-2">
                            {filteredUsers.map(user => (
                                <HoverDiv
                                    key={user.uid}
                                    type="INFO"
                                    disabled={busy || loading}
                                    aria-pressed={String(user.uid) === uid}
                                    onClick={() => setUid(String(user.uid))}
                                    className={`justify-start gap-2 px-2 py-1.5 text-left ${String(user.uid) === uid ? "border-sky-800 bg-sky-950/20" : ""}`}
                                >
                                    {user.avatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={user.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                                    ) : (
                                        <span className="grid h-6 w-6 place-items-center rounded-full bg-white/5 text-[10px]">
                                            {user.username.slice(0, 1).toUpperCase()}
                                        </span>
                                    )}
                                    <span className="min-w-0 flex-1 truncate text-xs text-zinc-300">{user.username}</span>
                                    <span className="text-[10px] text-zinc-600">#{user.uid} · {user.role}</span>
                                </HoverDiv>
                            ))}
                        </div>
                        <p className="text-[10px] text-zinc-600">
                            {filteredUsers.length ? "Up to 20 matches. Type a name or ID to narrow the list." : "No matching users."}
                        </p>
                    </div>
                )}
            </div>
            {error && (
                <p role="alert" className="text-sm text-red-400">{error}</p>
            )}
            {fixed && (
                <p className="text-xs text-amber-400">
                    {selectedRole === "OWNER"
                        ? "OWNER always has every permission and cannot be restricted."
                        : "BANNED and DELETED accounts cannot receive permissions."}
                </p>
            )}
            {loading || busy && !ready ? (
                <div className="box-primary animate-pulse divide-y divide-white/5 p-4">
                    {Array.from({length: PERMISSIONS.length}).map((_, index) => (
                        <div key={index} className="flex items-center justify-between py-3">
                            <div className="h-3 w-48 rounded bg-white/5" />
                            <div className="h-7 w-32 rounded bg-white/5" />
                        </div>
                    ))}
                </div>
            ) : ready && (
                <div className="box-primary divide-y divide-white/5 px-4">
                    {PERMISSIONS.map(permission => {
                        const inherited = userPolicy?.inherited.includes(permission.key) ?? false;
                        const master = values.ADMIN_ACCESS ?? userPolicy?.inherited.includes("ADMIN_ACCESS") ?? false;
                        const isAdminSection = permission.key.startsWith("ADMIN_") && permission.key !== "ADMIN_ACCESS";
                        const effective = (values[permission.key] ?? inherited) && (!isAdminSection || master);
                        return (
                            <div key={permission.key} className={`flex flex-wrap items-center justify-between gap-2 py-2.5 ${permission.key === "ADMIN_ACCESS" ? "border-t border-zinc-700" : ""}`}>
                                <label htmlFor={`permission-${permission.key}`} className="text-xs text-zinc-300">
                                    {permission.label}
                                    {mode === "user" && <span className={`ml-2 text-[10px] ${effective ? "text-emerald-500" : "text-zinc-600"}`}>{effective ? "Allowed" : "Denied"}</span>}
                                </label>
                                <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                                    {mode === "user" && (
                                        <label className="flex cursor-pointer items-center gap-1.5">
                                            <input
                                                type="checkbox"
                                                checked={values[permission.key] === undefined}
                                                disabled={busy || fixed}
                                                onChange={event => change(permission.key, event.target.checked ? "inherit" : inherited ? "allow" : "deny")}
                                                className="h-3.5 w-3.5 accent-sky-500"
                                            />
                                            Inherit
                                        </label>
                                    )}
                                    <input
                                        id={`permission-${permission.key}`}
                                        type="checkbox"
                                        aria-label={permission.label}
                                        checked={fixed ? selectedRole === "OWNER" : values[permission.key] ?? inherited}
                                        disabled={busy || fixed}
                                        onChange={event => change(permission.key, event.target.checked ? "allow" : "deny")}
                                        className="h-4 w-4 accent-emerald-500 disabled:opacity-40"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {ready && !fixed && (
                <div className="flex flex-wrap items-center gap-2">
                    <SaveButton disabled={busy || loading} onClick={save} className="px-3 py-1.5 text-xs">
                        Save permissions
                    </SaveButton>
                    {mode === "user" && (
                        <HoverDiv
                            type="WARN"
                            icon={<FaRotateLeft />}
                            disabled={busy}
                            onClick={() => setValues({})}
                            className="px-3 py-1.5 text-xs"
                        >
                            Reset all to inherited
                        </HoverDiv>
                    )}
                    <span className="text-[10px] text-zinc-500">Admin pages require both the master switch and the page permission.</span>
                </div>
            )}
        </section>
    );
}
