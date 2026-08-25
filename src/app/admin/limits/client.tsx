"use client";

import {useEffect, useMemo, useState} from "react";
import MainStringInput from "@/components/MainStringInput";
import HoverDiv, {SaveButton} from "@/components/HoverDiv";
import {FaBan, FaClock, FaGaugeHigh, FaRotateLeft, FaUserGear} from "react-icons/fa6";
import {getApiUrl} from "@/lib/core";
import {errorToast, okToast} from "@/lib/client";
import {useUser} from "@/hooks/useUser";
import type {UserObj} from "@/types/user";
import type {FilePackLimits, LimitPolicy, LimitRule, ResourceLimitType, RoleLimitPolicy, UserLimitPolicy} from "@/types/resourceLimits";

type RuleForm = {dailyCount: string; weeklyCount: string; dailyBytes: string; weeklyBytes: string};
type PolicyForm = Record<ResourceLimitType, RuleForm>;
type FilePackForm = {maxFiles: string; maxSizeMb: string};

const resources: {type: ResourceLimitType; label: string; hint: string; counts: boolean; bytes: boolean}[] = [
    {type: "TOTAL", label: "Total uploads", hint: "Images, files, and paste content combined", counts: false, bytes: true},
    {type: "IMAGE", label: "Images", hint: "Image uploads", counts: true, bytes: true},
    {type: "FILE", label: "Files", hint: "Files inside upload packs", counts: true, bytes: true},
    {type: "PASTE", label: "Pastes", hint: "Created pastes and UTF-8 content size", counts: true, bytes: true},
    {type: "URL", label: "Short URLs", hint: "Created shortened links", counts: true, bytes: false},
    {type: "TEMP_MAIL", label: "Temp mails", hint: "Created temporary addresses", counts: true, bytes: false},
];

const emptyRule = (): RuleForm => ({dailyCount: "", weeklyCount: "", dailyBytes: "", weeklyBytes: ""});
const emptyForm = (): PolicyForm => Object.fromEntries(resources.map(resource => [resource.type, emptyRule()])) as PolicyForm;
const emptyFilePackForm = (): FilePackForm => ({maxFiles: "", maxSizeMb: ""});

function numberText(value: number | null | undefined) {
    return value === null || value === undefined ? "" : String(value);
}

function bytesToMb(value: number | null | undefined) {
    return value === null || value === undefined ? "" : String(Number((value / 1024 / 1024).toFixed(4)));
}

function policyToForm(policy?: LimitPolicy): PolicyForm {
    const form = emptyForm();
    for (const resource of resources) {
        const rule = policy?.[resource.type];
        if (!rule) continue;
        form[resource.type] = {
            dailyCount: numberText(rule.dailyCount),
            weeklyCount: numberText(rule.weeklyCount),
            dailyBytes: bytesToMb(rule.dailyBytes),
            weeklyBytes: bytesToMb(rule.weeklyBytes),
        };
    }
    return form;
}

function parsed(value: string, bytes = false): number | null {
    if (value.trim() === "") return null;
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) throw new Error("Limits must be zero or greater");
    return Math.round(bytes ? amount * 1024 * 1024 : amount);
}

function formToPolicy(form: PolicyForm): LimitPolicy {
    return Object.fromEntries(resources.map(resource => [resource.type, {
        dailyCount: resource.counts ? parsed(form[resource.type].dailyCount) : null,
        weeklyCount: resource.counts ? parsed(form[resource.type].weeklyCount) : null,
        dailyBytes: resource.bytes ? parsed(form[resource.type].dailyBytes, true) : null,
        weeklyBytes: resource.bytes ? parsed(form[resource.type].weeklyBytes, true) : null,
    } satisfies LimitRule])) as LimitPolicy;
}

function filePackToForm(limits?: FilePackLimits): FilePackForm {
    return {maxFiles: numberText(limits?.maxFiles), maxSizeMb: bytesToMb(limits?.maxBytes)};
}

function formToFilePack(form: FilePackForm): FilePackLimits {
    return {maxFiles: parsed(form.maxFiles), maxBytes: parsed(form.maxSizeMb, true)};
}

function formatBytes(bytes: number) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** unit).toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function valueHint(value: number | null | undefined, bytes: boolean, inherit: boolean) {
    if (value === null || value === undefined) return inherit ? "Inherit: unlimited" : "Unlimited";
    return inherit ? `Inherit: ${bytes ? formatBytes(value) : value}` : "";
}

function LimitInput({label, value, placeholder, suffix, onChange}: {label: string; value: string; placeholder: string; suffix?: string; onChange: (value: string) => void}) {
    return <label className="min-w-0">
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.12em] text-gray-500">{label}</span>
        <MainStringInput type="number" numericOnly min="0" step="1" value={value} placeholder={placeholder} onChange={onChange} suffix={suffix}
               className="min-w-0 w-full rounded-lg border-white/10 bg-black/20" inputClassName="px-2.5 py-2 text-sm placeholder:text-gray-600"/>
    </label>;
}

function RuleEditor({form, setForm, inherited}: {form: PolicyForm; setForm: (form: PolicyForm) => void; inherited?: LimitPolicy}) {
    const change = (type: ResourceLimitType, key: keyof RuleForm, value: string) => setForm({...form, [type]: {...form[type], [key]: value}});
    return <div className="overflow-hidden rounded-xl border border-white/10">
        {resources.map((resource, index) => {
            const inheritedRule = inherited?.[resource.type];
            return <div key={resource.type} className={`grid gap-3 p-3 md:grid-cols-[minmax(150px,.8fr)_minmax(0,2fr)] md:items-center md:p-4 ${index ? "border-t border-white/10" : ""}`}>
                <div><p className="text-sm font-semibold text-gray-100">{resource.label}</p><p className="mt-0.5 text-[11px] text-gray-500">{resource.hint}</p></div>
                <div className={`grid gap-2 ${resource.counts && resource.bytes ? "grid-cols-2 xl:grid-cols-4" : "grid-cols-2"}`}>
                    {resource.counts ? <>
                        <LimitInput label="Daily max" value={form[resource.type].dailyCount} placeholder={valueHint(inheritedRule?.dailyCount, false, !!inherited)} onChange={value => change(resource.type, "dailyCount", value)}/>
                        <LimitInput label="Weekly max" value={form[resource.type].weeklyCount} placeholder={valueHint(inheritedRule?.weeklyCount, false, !!inherited)} onChange={value => change(resource.type, "weeklyCount", value)}/>
                    </> : null}
                    {resource.bytes ? <>
                        <LimitInput label="Daily size" suffix="MB" value={form[resource.type].dailyBytes} placeholder={valueHint(inheritedRule?.dailyBytes, true, !!inherited)} onChange={value => change(resource.type, "dailyBytes", value)}/>
                        <LimitInput label="Weekly size" suffix="MB" value={form[resource.type].weeklyBytes} placeholder={valueHint(inheritedRule?.weeklyBytes, true, !!inherited)} onChange={value => change(resource.type, "weeklyBytes", value)}/>
                    </> : null}
                </div>
            </div>;
        })}
    </div>;
}

function FilePackEditor({form, setForm, inherited, roleDefaults = false}: {form: FilePackForm; setForm: (form: FilePackForm) => void; inherited?: FilePackLimits; roleDefaults?: boolean}) {
    const maxFilesHint = inherited?.maxFiles == null ? (roleDefaults ? "Default: 10" : "Inherit: 10") : `Inherit: ${inherited.maxFiles}`;
    const maxSizeHint = inherited?.maxBytes == null ? (roleDefaults ? "Default: 15360 MB" : "Inherit: 15360 MB") : `Inherit: ${formatBytes(inherited.maxBytes)}`;
    return <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-3 md:p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(150px,.8fr)_minmax(0,2fr)] md:items-center">
            <div><p className="text-sm font-semibold text-gray-100">File pack limits</p><p className="mt-0.5 text-[11px] text-gray-500">Limits applied to each individual pack before files are uploaded</p></div>
            <div className="grid grid-cols-2 gap-2">
                <LimitInput label="Max files per pack" value={form.maxFiles} placeholder={maxFilesHint} onChange={value => setForm({...form, maxFiles: value})}/>
                <LimitInput label="Max pack size" suffix="MB" value={form.maxSizeMb} placeholder={maxSizeHint} onChange={value => setForm({...form, maxSizeMb: value})}/>
            </div>
        </div>
    </div>;
}

function UsageBar({label, used, limit, bytes}: {label: string; used: number; limit: number | null | undefined; bytes?: boolean}) {
    const percent = limit === null || limit === undefined || limit <= 0 ? (limit === 0 && used > 0 ? 100 : 0) : Math.min(100, used / limit * 100);
    return <div>
        <div className="mb-1 flex justify-between gap-2 text-[11px]"><span className="text-gray-400">{label}</span><span className="text-gray-500">{bytes ? formatBytes(used) : used} / {limit === null || limit === undefined ? "∞" : bytes ? formatBytes(limit) : limit}</span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className={`h-full rounded-full ${percent >= 100 ? "bg-red-500" : percent >= 80 ? "bg-amber-500" : "bg-emerald-400"}`} style={{width: `${percent}%`}}/></div>
    </div>;
}

export default function ResourceLimitsClient({initialUsers, initialError = ""}: {initialUsers: UserObj[]; initialError?: string}) {
    const {user} = useUser();
    const [tab, setTab] = useState<"roles" | "users">("roles");
    const [roles, setRoles] = useState<RoleLimitPolicy[]>([]);
    const [selectedRole, setSelectedRole] = useState("USER");
    const [roleForm, setRoleForm] = useState<PolicyForm>(emptyForm);
    const [roleFilePackForm, setRoleFilePackForm] = useState<FilePackForm>(emptyFilePackForm);
    const [selectedUid, setSelectedUid] = useState<number | null>(initialUsers[0]?.uid ?? null);
    const [userPolicy, setUserPolicy] = useState<UserLimitPolicy | null>(null);
    const [userForm, setUserForm] = useState<PolicyForm>(emptyForm);
    const [userFilePackForm, setUserFilePackForm] = useState<FilePackForm>(emptyFilePackForm);
    const [search, setSearch] = useState("");
    const [pausePreset, setPausePreset] = useState("1440");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(initialError);

    const request = async <T,>(path: string, method = "GET", body?: unknown): Promise<T> => {
        if (!user?.apiKey) throw new Error("Missing administrator API key");
        const response = await fetch(getApiUrl() + path, {
            method,
            headers: {"X-API-Key": user.apiKey, "Content-Type": "application/json", Accept: "application/json"},
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.error) throw new Error(String(payload?.message ?? `Request failed (${response.status})`));
        return payload.message as T;
    };

    useEffect(() => {
        if (!user?.apiKey) return;
        setLoading(true);
        request<RoleLimitPolicy[]>("/v1/admin/limits/roles")
            .then(data => {setRoles(data); setError("");})
            .catch(exception => setError(exception instanceof Error ? exception.message : "Failed to load role limits"))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.apiKey]);

    useEffect(() => {
        const policy = roles.find(item => item.role === selectedRole);
        setRoleForm(policyToForm(policy?.limits));
        setRoleFilePackForm(filePackToForm(policy?.filePackLimits));
    }, [roles, selectedRole]);

    useEffect(() => {
        if (!user?.apiKey || selectedUid === null) return;
        setLoading(true);
        request<UserLimitPolicy>(`/v1/admin/limits/users/${selectedUid}`)
            .then(data => {setUserPolicy(data); setUserForm(policyToForm(data.overrides)); setUserFilePackForm(filePackToForm(data.filePackOverrides)); setError("");})
            .catch(exception => {setUserPolicy(null); setError(exception instanceof Error ? exception.message : "Failed to load user limits");})
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.apiKey, selectedUid]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        return initialUsers.filter(entry => !query || entry.username.toLowerCase().includes(query) || String(entry.uid).includes(query) || entry.role.toLowerCase().includes(query));
    }, [initialUsers, search]);
    const selectedUserRoleLimits = roles.find(item => item.role === userPolicy?.role)?.limits;
    const selectedUserRoleFilePackLimits = roles.find(item => item.role === userPolicy?.role)?.filePackLimits;

    const saveRole = async () => {
        try {
            setLoading(true);
            const updated = await request<RoleLimitPolicy>(`/v1/admin/limits/roles/${selectedRole}`, "PUT", {limits: formToPolicy(roleForm), filePackLimits: formToFilePack(roleFilePackForm)});
            setRoles(current => [...current.filter(item => item.role !== updated.role), updated]);
            okToast(`${selectedRole} limits saved`, 1800);
        } catch (exception) {errorToast(exception instanceof Error ? exception.message : "Failed to save limits", 3500);} finally {setLoading(false);}
    };

    const refreshUser = (updated: UserLimitPolicy) => {setUserPolicy(updated); setUserForm(policyToForm(updated.overrides)); setUserFilePackForm(filePackToForm(updated.filePackOverrides));};
    const saveUser = async () => {
        if (selectedUid === null) return;
        try {setLoading(true); refreshUser(await request<UserLimitPolicy>(`/v1/admin/limits/users/${selectedUid}`, "PUT", {limits: formToPolicy(userForm), filePackLimits: formToFilePack(userFilePackForm)})); okToast("User overrides saved", 1800);}
        catch (exception) {errorToast(exception instanceof Error ? exception.message : "Failed to save overrides", 3500);} finally {setLoading(false);}
    };
    const clearOverrides = async () => {
        if (selectedUid === null) return;
        try {setLoading(true); refreshUser(await request<UserLimitPolicy>(`/v1/admin/limits/users/${selectedUid}/overrides`, "DELETE")); okToast("User now inherits role defaults", 1800);}
        catch (exception) {errorToast(exception instanceof Error ? exception.message : "Failed to clear overrides", 3500);} finally {setLoading(false);}
    };
    const pauseUser = async () => {
        if (selectedUid === null) return;
        try {
            setLoading(true);
            const body = pausePreset === "indefinite" ? {indefinite: true} : {durationMinutes: Number(pausePreset), indefinite: false};
            refreshUser(await request<UserLimitPolicy>(`/v1/admin/limits/users/${selectedUid}/pause`, "POST", body));
            okToast("User resource access paused", 1800);
        } catch (exception) {errorToast(exception instanceof Error ? exception.message : "Failed to pause user", 3500);} finally {setLoading(false);}
    };
    const unpauseUser = async () => {
        if (selectedUid === null) return;
        try {setLoading(true); refreshUser(await request<UserLimitPolicy>(`/v1/admin/limits/users/${selectedUid}/pause`, "DELETE")); okToast("User unpaused", 1800);}
        catch (exception) {errorToast(exception instanceof Error ? exception.message : "Failed to unpause user", 3500);} finally {setLoading(false);}
    };

    return <section className="mx-auto w-full max-w-[100rem] space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/[.08] text-emerald-300"><FaGaugeHigh/></span><div><h1 className="text-xl font-semibold md:text-2xl">Resource limits</h1><p className="text-xs text-gray-500 sm:text-sm">Role defaults, user overrides, usage windows, and account pauses</p></div></div>
            <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
                <HoverDiv type="INFO" onClick={() => setTab("roles")} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${tab === "roles" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-200"}`}>Role defaults</HoverDiv>
                <HoverDiv type="INFO" onClick={() => setTab("users")} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${tab === "users" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-200"}`}>User overrides</HoverDiv>
            </div>
        </header>
        {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/[.07] px-4 py-3 text-sm text-red-300">{error}</div> : null}

        {tab === "roles" ? <>
            <div className="box-primary p-3 md:p-4">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Role policy</h2><p className="text-xs text-gray-500">Blank values are unlimited. ADMIN and OWNER always bypass policies.</p></div><div className="flex max-w-full gap-1.5 overflow-x-auto">{roles.map(item => <HoverDiv type="INFO" key={item.role} onClick={() => setSelectedRole(item.role)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${selectedRole === item.role ? "bg-emerald-400/10 text-emerald-300" : "text-gray-400"}`}>{item.role}</HoverDiv>)}</div></div>
                <RuleEditor form={roleForm} setForm={setRoleForm}/>
                <FilePackEditor form={roleFilePackForm} setForm={setRoleFilePackForm} roleDefaults/>
                <div className="mt-4 flex justify-end"><SaveButton disabled={loading} onClick={saveRole} className="px-4 py-2.5 text-sm font-semibold">Save {selectedRole}</SaveButton></div>
            </div>
        </> : <>
            <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="box-primary p-3 md:p-4">
                    <div className="mb-3 flex items-center gap-2"><FaUserGear className="text-emerald-300"/><h2 className="font-semibold">Choose user</h2></div>
                    <MainStringInput type="search" value={search} onChange={setSearch} placeholder="Search username, UID, role…" className="mb-2 w-full rounded-lg border-white/10 bg-black/20" inputClassName="px-3 py-2.5 text-sm"/>
                    <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">{filteredUsers.map(entry => <HoverDiv type="INFO" key={entry.uid} onClick={() => setSelectedUid(entry.uid)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${selectedUid === entry.uid ? "bg-emerald-400/[.08]" : "hover:bg-white/[.03]"}`}><span><span className="block text-sm font-medium">{entry.username}</span><span className="text-[10px] text-gray-500">UID {entry.uid}</span></span><span className="rounded-md bg-white/[.05] px-2 py-1 text-[10px] text-gray-400">{entry.role}</span></HoverDiv>)}</div>
                </aside>
                <div className="space-y-4">
                    {userPolicy ? <>
                        <div className={`box-primary border p-4 ${userPolicy.paused ? "border-red-500/25" : "border-white/10"}`}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><h2 className="font-semibold">{userPolicy.username}</h2><span className="rounded-md bg-white/[.06] px-2 py-1 text-[10px] text-gray-400">{userPolicy.role}</span>{userPolicy.paused ? <span className="rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-300">PAUSED</span> : null}</div><p className="mt-1 text-xs text-gray-500">{userPolicy.paused ? userPolicy.pausedIndefinitely ? "Paused indefinitely" : `Paused until ${new Date(userPolicy.pausedUntil ?? "").toLocaleString()}` : "Resource creation, editing, and deletion are currently allowed"}</p></div><div className="flex flex-wrap gap-2">{userPolicy.paused ? <HoverDiv type="SAVE" disabled={loading} onClick={unpauseUser} icon={<FaRotateLeft/>} className="rounded-lg px-3 py-2 text-xs font-semibold">Unpause</HoverDiv> : <><select value={pausePreset} onChange={event => setPausePreset(event.target.value)} className="rounded-lg border border-white/10 bg-[#111116] px-3 py-2 text-xs text-gray-200"><option value="60">1 hour</option><option value="720">12 hours</option><option value="1440">1 day</option><option value="10080">1 week</option><option value="indefinite">Indefinite</option></select><HoverDiv type="DANGER" disabled={loading} onClick={pauseUser} icon={<FaBan/>} className="rounded-lg px-3 py-2 text-xs font-semibold">Pause user</HoverDiv></>}</div></div>
                        </div>
                        <div className="box-primary p-3 md:p-4"><div className="mb-4"><h2 className="font-semibold">Usage now</h2><p className="text-xs text-gray-500">Daily resets at midnight; weekly resets Monday. Bars use effective limits.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{resources.map(resource => {const usage = userPolicy.usage?.[resource.type]; const limit = userPolicy.effective?.[resource.type]; return <div key={resource.type} className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="mb-3 text-sm font-semibold">{resource.label}</p><div className="space-y-2.5">{resource.counts ? <><UsageBar label="Today · count" used={usage?.dailyCount ?? 0} limit={limit?.dailyCount}/><UsageBar label="This week · count" used={usage?.weeklyCount ?? 0} limit={limit?.weeklyCount}/></> : null}{resource.bytes ? <><UsageBar label="Today · size" bytes used={usage?.dailyBytes ?? 0} limit={limit?.dailyBytes}/><UsageBar label="This week · size" bytes used={usage?.weeklyBytes ?? 0} limit={limit?.weeklyBytes}/></> : null}</div></div>;})}</div></div>
                        <div className="box-primary p-3 md:p-4"><div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-semibold">Individual overrides</h2><p className="text-xs text-gray-500">Blank fields inherit the current {userPolicy.role} policy.</p></div><HoverDiv type="INFO" disabled={loading} onClick={clearOverrides} icon={<FaRotateLeft/>} className="px-3 py-2 text-xs font-semibold">Clear overrides</HoverDiv></div><RuleEditor form={userForm} setForm={setUserForm} inherited={selectedUserRoleLimits}/><FilePackEditor form={userFilePackForm} setForm={setUserFilePackForm} inherited={selectedUserRoleFilePackLimits}/><div className="mt-4 flex justify-end"><SaveButton disabled={loading} onClick={saveUser} className="px-4 py-2.5 text-sm font-semibold">Save overrides</SaveButton></div></div>
                    </> : <div className="box-primary grid min-h-64 place-items-center p-8 text-center text-sm text-gray-500"><div><FaClock className="mx-auto mb-3 text-2xl"/><p>{loading ? "Loading user policy…" : "Select an eligible user"}</p></div></div>}
                </div>
            </div>
        </>}
    </section>;
}
