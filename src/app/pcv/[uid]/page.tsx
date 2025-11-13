'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/core";
import { errorToast, infoToast, copyToClipboard, okToast, secondsToHuman, isValidDurationExpr } from "@/lib/client";
import { LoadingDot } from "@/components/GlobalComponents";
import { ActiveVIP, ApiPayload, Code, VIPPackage } from "@/types/playcore";
import { Callback, usePCVRealtime } from "@/hooks/usePCVRealtime";
import { Panel } from "@/components/pcv/Panel";
import { SectionSkeleton } from "@/components/pcv/SectionSkeleton";
import { McText } from "@/components/pcv/McText";
import { IoMdClipboard } from "react-icons/io";
import { FaTrashCan, FaPen } from "react-icons/fa6";
import { IoEllipsisHorizontal, IoMail } from "react-icons/io5";
import { SlideOver } from "@/components/pcv/SlideOver";
import { SearchInput } from "@/components/pcv/SearchInput";
import { SegmentedFilter } from "@/components/pcv/SegmentedFilter";
import { toast, Id } from "react-toastify";
import {tryParseDurationToSeconds} from "@/lib/pcv";

const AVATAR_URL = (name: string, size: number = 48) => `https://mineskin.eu/helm/${name}/${size}`;

function clsx(...arr: Array<string | false | null | undefined>) {
    return arr.filter(Boolean).join(" ");
}

type CodeTypeFilter = "BOTH" | "VIP" | "KIT";

// Local validator that also accepts days (d) in addition to h/m/s, order: d h m s
function isValidDurationExprWithDays(expr: string): boolean {
    if (!expr) return false;
    const s = expr.trim();
    const re = /^[+-]?\s*(?:(\d+)\s*d)?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?\s*$/i;
    const m = s.match(re);
    if (!m) return false;
    const hasAny = (m[1] && m[1] !== "0") || (m[2] && m[2] !== "0") || (m[3] && m[3] !== "0") || (m[4] && m[4] !== "0");
    return !!hasAny;
}

type NewModalType = "VIP" | "ACTIVE" | "CODE" | null;

export default function Page() {
    const { uid } = useParams<{ uid: string }>();
    const apiBase = getApiUrl();

    const [loadingMain, setLoadingMain] = useState(true);
    const [loadingVip, setLoadingVip] = useState(false);
    const [apiError, setApiError] = useState(false);
    const [loadingCodes, setLoadingCodes] = useState(false);

    const [vipPackages, setVipPackages] = useState<VIPPackage[]>([]);
    const [activeVips, setActiveVips] = useState<ActiveVIP[]>([]);
    const [codes, setCodes] = useState<Code[]>([]);
    const [codesPage, setCodesPage] = useState(1);
    const pageSize = 100;

    // Search states
    const [searchActive, setSearchActive] = useState("");
    const [searchCodes, setSearchCodes] = useState("");
    const [codesTypeFilter, setCodesTypeFilter] = useState<CodeTypeFilter>("BOTH");

    // Editors
    const [editingActive, setEditingActive] = useState<ActiveVIP | null>(null);
    const [activeEditExpr, setActiveEditExpr] = useState<string>("");
    const activeExprValid = activeEditExpr.length === 0 ? true : isValidDurationExpr(activeEditExpr);

    const [editingPackage, setEditingPackage] = useState<VIPPackage | null>(null);
    const [pkgGroup, setPkgGroup] = useState("");
    const [pkgPriority, setPkgPriority] = useState<number | "">("");
    const [pkgDisplayName, setPkgDisplayName] = useState("");
    const [pkgDuration, setPkgDuration] = useState<number | "">("");

    // New modal state (shared)
    const [newModalOpen, setNewModalOpen] = useState(false);
    const [newModalType, setNewModalType] = useState<NewModalType>(null);
    // VIP
    const [newPkgName, setNewPkgName] = useState("");
    const [newPkgDisplayName, setNewPkgDisplayName] = useState("");
    const [newPkgGroup, setNewPkgGroup] = useState("");
    const [newPkgPriority, setNewPkgPriority] = useState<number | "">("");
    const [newPkgDurationExpr, setNewPkgDurationExpr] = useState("");
    // ACTIVE
    const [newActivePlayer, setNewActivePlayer] = useState("");
    const [newActivePackage, setNewActivePackage] = useState("");
    const [newActiveDurationExpr, setNewActiveDurationExpr] = useState("");
    // CODE
    const [newCodeType, setNewCodeType] = useState<"VIP" | "KIT">("VIP");
    const [newCodeVip, setNewCodeVip] = useState("");
    const [newCodeDurationExpr, setNewCodeDurationExpr] = useState("");

    // toast id as ref to avoid race with WS
    const updatingToastRef = useRef<Id | null>(null);
    // reactive flag to disable buttons while an update is in-flight
    const [hasUpdatingToast, setHasUpdatingToast] = useState(false);

    const router = useRouter();

    const groupByPackage = useMemo(() => {
        const m = new Map<string, VIPPackage>();
        vipPackages.forEach((v) => m.set(v.name, v));
        return m;
    }, [vipPackages]);

    const codesVisible = useMemo(() => codes.slice(0, codesPage * pageSize), [codes, codesPage]);

    const filteredActiveVips = useMemo(() => {
        activeVips.forEach(a => console.log(`DURATION OF ${a.playerName} IS ${a.duration}`));
        if (!searchActive.trim()) return activeVips.filter(a => a.duration > 1);
        const q = searchActive.toLowerCase();
        return activeVips.filter((a) => {
            const pkg = groupByPackage.get(a.packageName);
            return (
                a.playerName.toLowerCase().includes(q) ||
                a.playerUniqueId.toLowerCase().includes(q) ||
                a.packageName.toLowerCase().includes(q) ||
                (pkg?.group?.toLowerCase().includes(q) ?? false)
            );
        }).filter(a => a.duration > 1);
    }, [searchActive, activeVips, groupByPackage]);

    const filteredCodes = useMemo(() => {
        const bySearch = (() => {
            if (!searchCodes.trim()) return codesVisible;
            const q = searchCodes.toLowerCase();
            return codesVisible.filter((c) => {
                return (
                    c.code.toLowerCase().includes(q) ||
                    c.identifier.toLowerCase().includes(q) ||
                    String(c.usedBy).toLowerCase().includes(q) ||
                    (c.usedAt || "").toLowerCase().includes(q) ||
                    (c.email || "").toLowerCase().includes(q) ||
                    (c.type || "").toLowerCase().includes(q)
                );
            });
        })();

        if (codesTypeFilter === "BOTH") return bySearch;
        return bySearch.filter((c) => (c.type || "").toUpperCase() === codesTypeFilter);
    }, [searchCodes, codesVisible, codesTypeFilter]);

    const fetchMain = useCallback(async () => {
        if (!uid) return;
        setApiError(false);
        setLoadingMain(true);
        try {
            const res0 = await fetch(`${apiBase}/v1/pcv/status/${uid}`, { cache: "no-store" });
            if (!res0.ok) {
                setApiError(true);
                return;
            }
            const res = await fetch(`${apiBase}/v1/pcv/data/${uid}`, { cache: "no-store" });
            if (!res.ok) throw new Error(`Failed to fetch data (${res.status})`);

            // Be robust to plain-text error bodies or non-JSON
            const text = await res.text();
            let data: ApiPayload;
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error(text || "Invalid JSON from /v1/pcv/data");
            }

            const v = (data as any).message?.vipPackages ?? [];
            const a = (data as any).message?.activePackages ?? [];

            setVipPackages(v);
            setActiveVips(a);
        } catch (e: any) {
            errorToast(e?.message || "Failed to load data");
        } finally {
            if (!apiError) {
                setTimeout(() => setLoadingMain(false), 500);
            }
        }
    }, [uid, apiBase, apiError]);

    const deleteResource = async (type: "CODE" | "VIP" | "ACTIVE_VIP", code: string) => {
        const res = await fetch(
            `${apiBase}/v1/pcv/data/${uid}/${type.toLocaleLowerCase()}/${encodeURIComponent(code)}`,
            { cache: "no-store", method: "DELETE" }
        );
        if (res.ok) okToast(`Deleted ${type.toLowerCase()} ${code}`);
        else errorToast(`Failed to delete ${type.toLowerCase()} ${code}`);
    };

    const fetchCodes = useCallback(async () => {
        if (!uid) return;
        setLoadingCodes(true);
        try {
            const res = await fetch(`${apiBase}/v1/pcv/scrape/${uid}/codes`, {
                cache: "no-store",
                method: "POST",
            });
            if (!res.ok) errorToast(res.status + " Failed to load codes" || "Failed to load codes");
        } catch (e: any) {
            errorToast(e?.message || "Failed to load codes");
        }
    }, [uid, apiBase]);

    const refreshAll = useCallback(async () => {
        await fetchMain();
        if (codes.length > 0) await fetchCodes();
        setTimeout(() => {
            infoToast("Refreshed");
        }, 500);
    }, [fetchMain, fetchCodes, codes.length]);

    // Centralized WS error handler that uses the ref (no race)
    const handleWsError = useCallback((message: string) => {
        const id = updatingToastRef.current;
        if (id != null) {
            toast.update(id, {
                type: "error",
                isLoading: false,
                render: message || "An error occurred",
                closeOnClick: true,
                autoClose: 5000,
            });
            updatingToastRef.current = null;
            setHasUpdatingToast(false);
        } else {
            errorToast(message || "An error occurred");
        }
    }, []);

    const callBacks: Record<string, Callback> = {
        CODES_READY: () => setLoadingCodes(false),
        VIP_READY: () => setLoadingVip(false),
        VIP_UPDATE: () => {
            setLoadingVip(true);
            setVipPackages([]);
            fetch(`${apiBase}/v1/pcv/scrape/${uid}/vips`, { cache: "no-store", method: "POST" });
            const id = updatingToastRef.current;
            if (id != null) {
                toast.update(id, {
                    type: "success",
                    isLoading: false,
                    render: "VIP updated successfully.",
                    closeOnClick: true,
                    autoClose: 3000,
                });
                updatingToastRef.current = null;
                setHasUpdatingToast(false);
            }
        },
        ACTIVE_UPDATE: () => {
            setVipPackages([]);
            fetch(`${apiBase}/v1/pcv/scrape/${uid}/activevips`, { cache: "no-store", method: "POST" });
            const id = updatingToastRef.current;
            if (id != null) {
                toast.update(id, {
                    type: "success",
                    isLoading: false,
                    render: "Active VIP updated.",
                    closeOnClick: true,
                    autoClose: 3000,
                });
                updatingToastRef.current = null;
                setHasUpdatingToast(false);
            }
        },
        CODE_UPDATE: () => {
            setVipPackages([]);
            fetchCodes();
            const id = updatingToastRef.current;
            if (id != null) {
                toast.update(id, {
                    type: "success",
                    isLoading: false,
                    render: "Code updated.",
                    closeOnClick: true,
                    autoClose: 3000,
                });
                updatingToastRef.current = null;
                setHasUpdatingToast(false);
            }
        },
    };

    const { status: wsStatus, isOpen: isWsOpen, lastError: wsLastError, reconnect } = usePCVRealtime({
        apiBaseUrl: apiBase,
        uid: String(uid || ""),
        setCodes,
        setVipPackages,
        setActiveVips,
        callBacks,
        onError: handleWsError, // pass handler that reads the ref
    });

    useEffect(() => {
        fetchMain();
    }, [fetchMain]);

    const openActiveEditor = (a: ActiveVIP) => {
        setEditingActive(a);
        setActiveEditExpr("");
    };

    const saveActiveEditor = () => {
        if (activeEditExpr && !activeExprValid) {
            return errorToast("Invalid duration expression.");
        }
        setEditingActive(null);
        setActiveEditExpr("");
    };

    const openPackageEditor = (v: VIPPackage) => {
        setEditingPackage(v);
        setPkgGroup(v.group || "");
        setPkgPriority(Number.isFinite(v.priority) ? v.priority : 0);
        setPkgDisplayName(v.displayName || v.name);
        setPkgDuration(Number.isFinite(v.duration as any) ? v.duration : 0);
    };

    const savePackageEditor = () => {
        if (pkgGroup.trim().length === 0) return errorToast("Group is required.");
        if (pkgPriority === "" || Number.isNaN(Number(pkgPriority))) return errorToast("Priority must be a number.");
        if (pkgDuration === "" || Number.isNaN(Number(pkgDuration))) return errorToast("Duration must be a number (seconds).");

        const newPckg: VIPPackage = {
            name: editingPackage!.name,
            displayName: pkgDisplayName.trim(),
            group: pkgGroup.trim(),
            priority: Number(pkgPriority),
            duration: Number(pkgDuration),
            createdAt: editingPackage!.createdAt,
        };

        postVipEdit(newPckg);
        setEditingPackage(null);
    };

    const postVipEdit = async (data: VIPPackage, enableToast: boolean = true) => {
        setLoadingVip(true);
        try {
            const res = await axios.post(`${apiBase}/v1/pcv/data/${uid}/vip`, data);
            if (res.status.toString().startsWith("2")) {
                if (enableToast) {
                    const id = toast.loading("Saving changes...");
                    updatingToastRef.current = id;
                    setHasUpdatingToast(true);
                }
            } else {
                errorToast("Failed to edit VIP Package");
            }
        } catch {
            errorToast("Failed to edit VIP Package");
        } finally {
            setLoadingVip(false);
        }
    };

    // New modal helpers
    const resetNewModalFields = () => {
        setNewPkgName("");
        setNewPkgDisplayName("");
        setNewPkgGroup("");
        setNewPkgPriority("");
        setNewPkgDurationExpr("");

        setNewActivePlayer("");
        setNewActivePackage("");
        setNewActiveDurationExpr("");

        setNewCodeType("VIP");
        setNewCodeVip("");
        setNewCodeDurationExpr("");
    };

    const openNewModal = (type: Exclude<NewModalType, null>) => {
        if (hasUpdatingToast) return; // safety guard
        resetNewModalFields();
        setNewModalType(type);
        setNewModalOpen(true);
    };

    const saveNewModal = async () => {
        if (!newModalType) return;
        // Validate fields by type
        if (newModalType === "VIP") {
            if (!newPkgName.trim()) return errorToast("Name is required.");
            if (!newPkgDisplayName.trim()) return errorToast("Display name is required.");
            if (!newPkgGroup.trim()) return errorToast("Group is required.");
            if (newPkgPriority === "" || Number.isNaN(Number(newPkgPriority))) return errorToast("Priority must be a number.");
            if (!newPkgDurationExpr.trim() || !isValidDurationExprWithDays(newPkgDurationExpr)) {
                return errorToast("Invalid duration. Use e.g. 3d2h, 30m, 10s.");
            }
            if (vipPackages.find((p) => p.name === newPkgName.trim())) {
                return errorToast("A package with this name already exists.");
            }
            const id: Id = toast.loading("Creating VIP package...");
            updatingToastRef.current = id;
            setHasUpdatingToast(true);

            const newPckg: VIPPackage = {
                name: newPkgName,
                displayName: newPkgDisplayName,
                group: newPkgGroup,
                priority: Number(newPkgPriority),
                duration: tryParseDurationToSeconds(newPkgDurationExpr) || 0,
                createdAt: 0
            };

            postVipEdit(newPckg, false);
        }

        if (newModalType === "ACTIVE") {
            if (!newActivePlayer.trim()) return errorToast("Player name is required.");
            if (!newActivePackage.trim()) return errorToast("Package is required.");
            if (newActiveDurationExpr && !isValidDurationExprWithDays(newActiveDurationExpr)) {
                return errorToast("Invalid duration. Use e.g. 30d, 20m10s.");
            }
            const id = toast.loading("Creating active VIP...");
            updatingToastRef.current = id;
            setHasUpdatingToast(true);
            // TODO: POST to /v1/pcv/data/{uid}/active_vip with payload
        }

        if (newModalType === "CODE") {
            if (newCodeType === "KIT") {
                return errorToast("KIT creation UI is in construction.");
            }
            if (newCodeType === "VIP") {
                if (!newCodeVip.trim()) return errorToast("Select a VIP package.");
                if (newCodeDurationExpr && !isValidDurationExprWithDays(newCodeDurationExpr)) {
                    return errorToast("Invalid duration. Use e.g. 30d, 20m10s.");
                }

                const data = {
                    type: "VIP",
                    identifier: newCodeVip,
                    code: "NEW",
                    duration: newCodeDurationExpr ? tryParseDurationToSeconds(newCodeDurationExpr) || 0 : 0,
                }

                try {
                    const res = await axios.post(`${apiBase}/v1/pcv/data/${uid}/code`, data);
                    if (res.status.toString().startsWith("2")) {
                        const id = toast.loading("Creating VIP code...");
                        updatingToastRef.current = id;
                        setHasUpdatingToast(true);
                    } else {
                        errorToast("Could not create VIP code.");
                    }
                } catch (e) {
                    errorToast("Could not create VIP code: " + e);
                }
            }
        }

        setNewModalOpen(false);
    };

    const saveDisabledNewModal = useMemo(() => {
        if (!newModalType) return true;
        if (newModalType === "VIP") {
            return (
                !newPkgName.trim() ||
                !newPkgDisplayName.trim() ||
                !newPkgGroup.trim() ||
                newPkgPriority === "" ||
                Number.isNaN(Number(newPkgPriority)) ||
                !newPkgDurationExpr.trim() ||
                !isValidDurationExprWithDays(newPkgDurationExpr)
            );
        }
        if (newModalType === "ACTIVE") {
            return (
                !newActivePlayer.trim() ||
                !newActivePackage.trim() ||
                (newActiveDurationExpr.trim().length > 0 && !isValidDurationExprWithDays(newActiveDurationExpr))
            );
        }
        if (newModalType === "CODE") {
            if (newCodeType === "KIT") return true; // In construction -> disable save
            return !newCodeVip.trim() || (newCodeDurationExpr.trim().length > 0 && !isValidDurationExprWithDays(newCodeDurationExpr));
        }
        return true;
    }, [
        newModalType,
        newPkgName,
        newPkgGroup,
        newPkgPriority,
        newPkgDurationExpr,
        newActivePlayer,
        newActivePackage,
        newActiveDurationExpr,
        newCodeType,
        newCodeVip,
        newCodeDurationExpr,
        newPkgDisplayName,
    ]);

    if ((apiError || !isWsOpen) && !loadingMain) {
        return (
            <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-center">
                    <h2 className="text-lg font-semibold">
                        {!apiError && !isWsOpen ? "WebSocket is not connected" : "No sessions under this uniqueId"}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">UID: {String(uid)}</p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <button
                            onClick={() => {
                                setApiError(false);
                                router.refresh();
                            }}
                            className="rounded border border-blue-600 bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
                        >
                            Retry
                        </button>
                        <button
                            onClick={reconnect}
                            className="rounded border border-amber-600 bg-amber-500 px-3 py-1.5 text-sm text-white hover:bg-amber-600"
                        >
                            Reconnect WS
                        </button>
                    </div>
                    <div className="mt-3 text-xs text-zinc-500">
                        If this persists, ensure the UID is correct and a session is active.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full sm:px-60 px-4 py-5">
            {/* Top bar - compact toolbar */}
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-semibold">Playcore Editor</h1>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">UID: {uid}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={refreshAll}
                        className="rounded border border-blue-600 bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
                    >
                        Refresh
                    </button>
                    {!isWsOpen && (
                        <button
                            onClick={reconnect}
                            className="rounded border border-amber-600 bg-amber-500 px-3 py-1.5 text-sm text-white hover:bg-amber-600"
                        >
                            Reconnect WS
                        </button>
                    )}
                    <div
                        className={clsx(
                            "flex items-center gap-2 rounded px-2 py-1 text-xs",
                            isWsOpen
                                ? "bg-emerald-500/10 text-emerald-300"
                                : wsStatus === "connecting"
                                    ? "bg-blue-500/10 text-blue-300"
                                    : wsStatus === "error"
                                        ? "bg-red-500/10 text-red-300"
                                        : "bg-zinc-700 text-zinc-300"
                        )}
                    >
            <span
                className={clsx(
                    "h-2 w-2 rounded-full",
                    isWsOpen
                        ? "bg-emerald-400"
                        : wsStatus === "connecting"
                            ? "bg-blue-400"
                            : wsStatus === "error"
                                ? "bg-red-400"
                                : "bg-zinc-400"
                )}
            />
                        <span>
              {isWsOpen
                  ? "Connected"
                  : wsStatus === "connecting"
                      ? "Connecting..."
                      : wsStatus === "error"
                          ? "Error"
                          : "Closed"}
            </span>
                    </div>
                </div>
            </div>

            {/* LuckPerms-like layout */}
            <div className="flex flex-col lg:flex-row gap-4 lg:grid-cols-12">
                {/* Left/main column */}
                <div className="lg:col-span-8 space-y-4 lg:min-w-[900px] max-w-[1000px]">
                    {/* Active VIPs */}
                    <Panel
                        title="Active VIPs"
                        subtitle={`${filteredActiveVips.length} active`}
                        actions={
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => openNewModal("ACTIVE")}
                                    disabled={hasUpdatingToast}
                                    className={clsx(
                                        "rounded border border-emerald-600 bg-emerald-500 px-2.5 py-1 text-xs text-white",
                                        hasUpdatingToast ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-600"
                                    )}
                                >
                                    New
                                </button>
                                <SearchInput
                                    value={searchActive}
                                    onChange={setSearchActive}
                                    placeholder="Search players, UUIDs, packages, groups..."
                                    className="w-56"
                                />
                            </div>
                        }
                    >
                        {loadingMain ? (
                            <SectionSkeleton rows={4} />
                        ) : filteredActiveVips.length === 0 ? (
                            <div className="text-sm text-zinc-400">No active VIPs</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {filteredActiveVips.map((a) => {
                                    const pkg = groupByPackage.get(a.packageName);
                                    return (
                                        <div
                                            key={`${a.playerUniqueId}-${a.packageName}`}
                                            className="flex items-start gap-3 rounded border border-zinc-800 bg-zinc-950 p-3"
                                        >
                                            <img
                                                src={AVATAR_URL(a.playerName, 48)}
                                                alt={a.playerName}
                                                className="h-12 w-12 rounded"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src = AVATAR_URL(
                                                        "00000000000000000000000000000000",
                                                        48
                                                    );
                                                }}
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium">{a.playerName}</div>
                                                        <span className="mt-1 inline-block rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                              {a.packageName}
                            </span>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => openActiveEditor(a)}
                                                            className={`rounded p-1 ${hasUpdatingToast ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-800"}`}
                                                            disabled={hasUpdatingToast}
                                                            title="Edit"
                                                        >
                                                            <IoEllipsisHorizontal className="h-5 w-5 text-zinc-300" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteResource("ACTIVE_VIP", `${a.playerUniqueId}`)
                                                            }
                                                            disabled={hasUpdatingToast}
                                                            className={`rounded p-1 ${hasUpdatingToast ? "opacity-50 cursor-not-allowed" : "hover:bg-red-500/10"}`}
                                                            title="Delete"
                                                        >
                                                            <FaTrashCan className="h-4 w-4 text-red-500" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Details: each on its own line, with tiny copy on UUID */}
                                                <div className="mt-2 space-y-1 text-xs text-zinc-400">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-zinc-500">UUID:</span>
                                                        <span className="truncate" title={a.playerUniqueId}>
                              {a.playerUniqueId}
                            </span>
                                                        <button
                                                            type="button"
                                                            aria-label="Copy UUID"
                                                            onClick={() => copyToClipboard(a.playerUniqueId)}
                                                            className="inline-flex items-center rounded p-1 hover:bg-zinc-800"
                                                        >
                                                            <IoMdClipboard className="h-3 w-3 text-zinc-400" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-zinc-500">Duration:</span>
                                                        <span>{secondsToHuman(a.duration)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-zinc-500">Group:</span>
                                                        <span>{pkg?.group || "-"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Panel>

                    {/* VIP Packages */}
                    <Panel
                        title="VIP Packages"
                        subtitle={`${vipPackages.length} packages`}
                        actions={
                            <button
                                onClick={() => openNewModal("VIP")}
                                disabled={hasUpdatingToast}
                                className={clsx(
                                    "rounded border border-emerald-600 bg-emerald-500 px-2.5 py-1 text-xs text-white",
                                    hasUpdatingToast ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-600"
                                )}
                            >
                                New
                            </button>
                        }
                    >
                        {(loadingMain || loadingVip) ? (
                            <SectionSkeleton rows={4} />
                        ) : vipPackages.length === 0 ? (
                            <div className="text-sm text-zinc-400">No VIP packages</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {vipPackages
                                    .slice()
                                    .sort((a, b) => b.priority - a.priority)
                                    .map((v) => (
                                        <div key={v.name} className="rounded border border-zinc-800 bg-zinc-950 p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate font-medium">
                                                        <McText text={v.displayName + " &r&8(" + v.name + ")"} />
                                                    </div>
                                                    <div className="mt-1 text-xs text-zinc-400">
                                                        <span className="mr-2 rounded bg-zinc-800 px-1.5 py-0.5">group: {v.group}</span>
                                                        <span className="mr-2 rounded bg-zinc-800 px-1.5 py-0.5">prio: {v.priority}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="text-right text-xs text-zinc-300">
                                                        <div>{secondsToHuman(v.duration)}</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={hasUpdatingToast}
                                                        onClick={() => openPackageEditor(v)}
                                                        className={`rounded p-1 ${hasUpdatingToast ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-800"}`}
                                                        title="Edit"
                                                    >
                                                        <FaPen className="h-4 w-4 text-zinc-300" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </Panel>
                </div>

                {/* Right/side panel (Codes) */}
                <div className="lg:col-span-4 space-y-4">
                    <Panel
                        title="Codes"
                        subtitle={codes.length ? `${codes.length} total` : "Not loaded initially"}
                        actions={
                            <div className="flex flex-wrap items-center gap-2">
                                {(codes.length > 0 && !loadingCodes) && (
                                    <>
                                        <SegmentedFilter
                                            options={[
                                                { label: "Both", value: "BOTH" as const },
                                                { label: "VIP", value: "VIP" as const },
                                                { label: "KIT", value: "KIT" as const },
                                            ]}
                                            value={codesTypeFilter}
                                            onChange={setCodesTypeFilter}
                                        />
                                        <SearchInput
                                            value={searchCodes}
                                            onChange={setSearchCodes}
                                            placeholder="Search codes..."
                                            className="w-40"
                                        />
                                    </>
                                )}
                                <button
                                    onClick={() => openNewModal("CODE")}
                                    disabled={hasUpdatingToast || codes.length === 0 || loadingCodes}
                                    className={clsx(
                                        "rounded border border-emerald-600 bg-emerald-500 px-2.5 py-1 text-xs text-white",
                                        (hasUpdatingToast || codes.length === 0 || loadingCodes) ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-600"
                                    )}
                                >
                                    New
                                </button>
                                <button
                                    onClick={fetchCodes}
                                    disabled={loadingCodes || hasUpdatingToast}
                                    className={clsx(
                                        "rounded border px-2.5 py-1 text-xs",
                                        (loadingCodes || hasUpdatingToast)
                                            ? "cursor-not-allowed border-zinc-700 bg-zinc-800 text-zinc-400"
                                            : "border-indigo-600 bg-indigo-500 text-white hover:bg-indigo-600"
                                    )}
                                >
                                    {loadingCodes ? (
                                        <span className="flex items-center gap-2">
                      <LoadingDot /> Loading
                    </span>
                                    ) : codes.length ? "Reload" : "Load"}
                                </button>
                            </div>
                        }
                    >
                        {loadingCodes ? (
                            <SectionSkeleton rows={8} rowHeight="h-10" />
                        ) : filteredCodes.length === 0 ? (
                            <div className="text-sm text-zinc-400">
                                {codes.length === 0
                                    ? 'Codes are not part of initial payload. Click "Load" to fetch them.'
                                    : "No codes match your filters."}
                            </div>
                        ) : (
                            <>
                                {/* Desktop/tablet: table with sticky header and scroll */}
                                <div className="hidden max-h-[520px] overflow-auto rounded border border-zinc-800 md:block">
                                    <table className="min-w-full text-left text-xs">
                                        <thead className="sticky top-0 z-10 bg-zinc-900 text-zinc-400">
                                        <tr className="border-b border-zinc-800">
                                            <th className="px-3 py-2">Code</th>
                                            <th className="px-3 py-2">Type</th>
                                            <th className="px-3 py-2">Identifier</th>
                                            <th className="px-3 py-2">Used</th>
                                            <th className="px-3 py-2">Used By</th>
                                            <th className="px-3 py-2">Used At</th>
                                            <th className="px-3 py-2">Email</th>
                                            <th className="px-3 py-2"></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {filteredCodes.map((c) => (
                                            <tr key={c.uniqueId || c.code} className="border-b border-zinc-800">
                                                <td className="whitespace-nowrap px-3 py-2 font-mono">{c.code}</td>
                                                <td className="px-3 py-2">
                            <span
                                className={clsx(
                                    "rounded px-1.5 py-0.5",
                                    c.type === "VIP"
                                        ? "bg-yellow-500/10 text-yellow-300"
                                        : "bg-sky-500/10 text-sky-300"
                                )}
                            >
                              {c.type}
                            </span>
                                                </td>
                                                <td className="max-w-[180px] truncate px-3 py-2">{c.identifier}</td>
                                                <td className="px-3 py-2">
                            <span
                                className={clsx(
                                    "rounded px-1.5 py-0.5",
                                    c.used ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"
                                )}
                            >
                              {c.used ? "Yes" : "No"}
                            </span>
                                                </td>
                                                <td className="max-w-[140px] truncate px-3 py-2">{String(c.usedBy)}</td>
                                                <td className="max-w-[220px] truncate px-3 py-2">{c.usedAt || "N/A"}</td>
                                                <td className="px-3 py-2">
                                                    {c.email && c.email !== "N/A" ? (
                                                        <button
                                                            className="rounded p-1 hover:bg-zinc-800"
                                                            title={`${c.email} (click to copy)`}
                                                            onClick={() => copyToClipboard(c.email!)}
                                                        >
                                                            <IoMail className="h-4 w-4 text-zinc-300" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-zinc-500">—</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        className="rounded p-1 hover:bg-red-500/10"
                                                        onClick={() => deleteResource("CODE", c.code)}
                                                        title="Delete code"
                                                    >
                                                        <FaTrashCan className="text-red-500" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile: cards, no horizontal overflow */}
                                <div className="md:hidden">
                                    <div className="max-h-[520px] space-y-2 overflow-auto">
                                        {filteredCodes.map((c) => (
                                            <div
                                                key={c.uniqueId || c.code}
                                                className="rounded border border-zinc-800 bg-zinc-950 p-3"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="font-mono text-sm">{c.code}</div>
                                                    <span
                                                        className={clsx(
                                                            "rounded px-1.5 py-0.5 text-xs",
                                                            c.type === "VIP"
                                                                ? "bg-yellow-500/10 text-yellow-300"
                                                                : "bg-sky-500/10 text-sky-300"
                                                        )}
                                                    >
                            {c.type}
                          </span>
                                                </div>
                                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-400">
                                                    <div className="truncate">
                                                        <span className="text-zinc-500">Identifier: </span>
                                                        {c.identifier}
                                                    </div>
                                                    <div className="truncate">
                                                        <span className="text-zinc-500">Used: </span>
                                                        <span
                                                            className={clsx(
                                                                "rounded px-1 py-0.5",
                                                                c.used ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"
                                                            )}
                                                        >
                              {c.used ? "Yes" : "No"}
                            </span>
                                                    </div>
                                                    <div className="truncate">
                                                        <span className="text-zinc-500">Used By: </span>
                                                        {String(c.usedBy)}
                                                    </div>
                                                    <div className="truncate">
                                                        <span className="text-zinc-500">Used At: </span>
                                                        {c.usedAt || "N/A"}
                                                    </div>
                                                    <div className="col-span-2 flex items-center gap-2 truncate">
                                                        <span className="text-zinc-500">Email: </span>
                                                        {c.email && c.email !== "N/A" ? (
                                                            <>
                                <span className="truncate" title={c.email}>
                                  {c.email}
                                </span>
                                                                <button
                                                                    className="rounded p-1 hover:bg-zinc-800"
                                                                    title="Copy email"
                                                                    onClick={() => copyToClipboard(c.email!)}
                                                                >
                                                                    <IoMdClipboard className="h-3 w-3 text-zinc-400" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="text-zinc-500">—</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex justify-end">
                                                    <button
                                                        className="rounded p-1 hover:bg-red-500/10"
                                                        onClick={() => deleteResource("CODE", c.code)}
                                                        title="Delete code"
                                                    >
                                                        <FaTrashCan className="text-red-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {filteredCodes.length < codesVisible.length && (
                                    <div className="mt-3 flex justify-center">
                                        <button
                                            onClick={() => setCodesPage((p) => p + 1)}
                                            className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700"
                                        >
                                            Load more
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </Panel>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-zinc-500">
                WebSocket:{" "}
                <span
                    className={clsx(
                        "rounded px-1 py-0.5",
                        isWsOpen
                            ? "bg-emerald-500/10 text-emerald-300"
                            : wsStatus === "connecting"
                                ? "bg-blue-500/10 text-blue-300"
                                : wsStatus === "error"
                                    ? "bg-red-500/10 text-red-300"
                                    : "bg-zinc-700 text-zinc-300"
                    )}
                >
          {isWsOpen
              ? "Connected"
              : wsStatus === "connecting"
                  ? "Connecting"
                  : wsStatus === "error"
                      ? "Error"
                      : "Closed"}
        </span>
                {wsStatus === "closed" && (
                    <span className="ml-2 text-zinc-400">WS may close due to inactivity — use Reconnect.</span>
                )}
                {wsLastError ? <span className="ml-2 text-red-400">({wsLastError})</span> : null}
            </div>

            {/* SlideOver: New (shared) */}
            <SlideOver
                title={
                    newModalType === "VIP"
                        ? "New VIP Package"
                        : newModalType === "ACTIVE"
                            ? "New Active VIP"
                            : newModalType === "CODE"
                                ? "New Code"
                                : "New"
                }
                open={newModalOpen}
                onClose={() => setNewModalOpen(false)}
                onSave={saveNewModal}
                saveDisabled={saveDisabledNewModal}
                saveLabel="Save"
            >
                {/* VIP form */}
                {newModalType === "VIP" && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="mb-1 block text-xs text-zinc-400">Name</label>
                                <input
                                    value={newPkgName}
                                    onChange={(e) => setNewPkgName(e.target.value)}
                                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-zinc-400">Display Name</label>
                                <input
                                    value={newPkgDisplayName}
                                    onChange={(e) => setNewPkgDisplayName(e.target.value)}
                                    placeholder="Supports MC color codes (&a, &6, ...)"
                                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-zinc-400">Group</label>
                                <input
                                    value={newPkgGroup}
                                    onChange={(e) => setNewPkgGroup(e.target.value)}
                                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-zinc-400">Priority</label>
                                <input
                                    type="number"
                                    value={newPkgPriority}
                                    onChange={(e) => setNewPkgPriority(e.target.value === "" ? "" : Number(e.target.value))}
                                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-zinc-400">Duration (e.g. 3d2h, 30m, 20s)</label>
                                <input
                                    value={newPkgDurationExpr}
                                    onChange={(e) => setNewPkgDurationExpr(e.target.value)}
                                    className={clsx(
                                        "w-full rounded border bg-zinc-900 px-3 py-2 text-sm outline-none",
                                        newPkgDurationExpr && !isValidDurationExprWithDays(newPkgDurationExpr)
                                            ? "border-red-600 focus:border-red-600"
                                            : "border-zinc-700 focus:border-zinc-500"
                                    )}
                                />
                                {newPkgDurationExpr && !isValidDurationExprWithDays(newPkgDurationExpr) && (
                                    <div className="mt-1 text-xs text-red-400">Invalid duration expression.</div>
                                )}
                            </div>
                        </div>

                        {/* Preview for new package */}
                        <div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
                            <div className="mb-1 text-zinc-500">Preview</div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="truncate font-medium">
                                        <McText text={newPkgDisplayName || newPkgName || "Display name preview"} />
                                    </div>
                                    <div className="mt-1 text-xs text-zinc-400">
                    <span className="mr-2 rounded bg-zinc-800 px-1.5 py-0.5">
                      group: {newPkgGroup || "-"}
                    </span>
                                        <span className="mr-2 rounded bg-zinc-800 px-1.5 py-0.5">
                      prio: {newPkgPriority === "" ? 0 : newPkgPriority}
                    </span>
                                    </div>
                                </div>
                                <div className="text-right text-xs text-zinc-300">
                                    <div>Duration: {newPkgDurationExpr || "-"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ACTIVE form */}
                {newModalType === "ACTIVE" && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="mb-1 block text-xs text-zinc-400">Player name</label>
                                <input
                                    value={newActivePlayer}
                                    onChange={(e) => setNewActivePlayer(e.target.value)}
                                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-zinc-400">Package</label>
                                <select
                                    value={newActivePackage}
                                    onChange={(e) => setNewActivePackage(e.target.value)}
                                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                                >
                                    <option value="">Select a package</option>
                                    {vipPackages
                                        .slice()
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map((v) => (
                                            <option key={v.name} value={v.name}>
                                                {v.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-zinc-400">Duration (optional, e.g. 30d or 20m10s)</label>
                                <input
                                    value={newActiveDurationExpr}
                                    onChange={(e) => setNewActiveDurationExpr(e.target.value)}
                                    className={clsx(
                                        "w-full rounded border bg-zinc-900 px-3 py-2 text-sm outline-none",
                                        newActiveDurationExpr && !isValidDurationExprWithDays(newActiveDurationExpr)
                                            ? "border-red-600 focus:border-red-600"
                                            : "border-zinc-700 focus:border-zinc-500"
                                    )}
                                />
                                {newActiveDurationExpr && !isValidDurationExprWithDays(newActiveDurationExpr) && (
                                    <div className="mt-1 text-xs text-red-400">Invalid duration expression.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* CODE form */}
                {newModalType === "CODE" && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="mb-1 block text-xs text-zinc-400">Type</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-1 text-sm">
                                        <input
                                            type="radio"
                                            className="accent-indigo-500"
                                            checked={newCodeType === "VIP"}
                                            onChange={() => setNewCodeType("VIP")}
                                        />
                                        VIP
                                    </label>
                                    <label className="flex items-center gap-1 text-sm">
                                        <input
                                            type="radio"
                                            className="accent-indigo-500"
                                            checked={newCodeType === "KIT"}
                                            onChange={() => setNewCodeType("KIT")}
                                        />
                                        KIT
                                    </label>
                                </div>
                            </div>

                            {newCodeType === "VIP" ? (
                                <>
                                    <div>
                                        <label className="mb-1 block text-xs text-zinc-400">VIP Package</label>
                                        <select
                                            value={newCodeVip}
                                            onChange={(e) => setNewCodeVip(e.target.value)}
                                            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                                        >
                                            <option value="">Select a package</option>
                                            {vipPackages
                                                .slice()
                                                .sort((a, b) => a.name.localeCompare(b.name))
                                                .map((v) => (
                                                    <option key={v.name} value={v.name}>
                                                        {v.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-zinc-400">Duration (optional, e.g. 30d, 20m10s)</label>
                                        <input
                                            value={newCodeDurationExpr}
                                            onChange={(e) => setNewCodeDurationExpr(e.target.value)}
                                            className={clsx(
                                                "w-full rounded border bg-zinc-900 px-3 py-2 text-sm outline-none",
                                                newCodeDurationExpr && !isValidDurationExprWithDays(newCodeDurationExpr)
                                                    ? "border-red-600 focus:border-red-600"
                                                    : "border-zinc-700 focus:border-zinc-500"
                                            )}
                                        />
                                        {newCodeDurationExpr && !isValidDurationExprWithDays(newCodeDurationExpr) && (
                                            <div className="mt-1 text-xs text-red-400">Invalid duration expression.</div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
                                    In construction
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </SlideOver>

            {/* SlideOver: Edit Active VIP (Enter to save supported) */}
            <SlideOver
                title={
                    editingActive ? (
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Edit Active VIP</span>
                            <span className="text-xs text-zinc-400">
                {editingActive.playerName} • {editingActive.packageName}
              </span>
                        </div>
                    ) : (
                        "Edit Active VIP"
                    )
                }
                open={!!editingActive}
                onClose={() => setEditingActive(null)}
                onSave={saveActiveEditor}
                saveDisabled={!activeExprValid}
            >
                <div className="space-y-4">
                    <div className="text-xs text-zinc-400">
                        Adjust duration using quick actions or enter a custom expression (e.g. 3m12s, -2h10m2s). Press Enter to
                        save.
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {["-6h", "-2h", "-30m", "+30m", "+2h", "+6h"].map((x) => (
                            <button
                                key={x}
                                onClick={() => setActiveEditExpr(x)}
                                className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
                            >
                                {x}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-zinc-400">Custom</label>
                        <input
                            value={activeEditExpr}
                            onChange={(e) => setActiveEditExpr(e.target.value)}
                            placeholder='e.g. "3m12s" or "-2h10m2s"'
                            className={clsx(
                                "w-full rounded border bg-zinc-900 px-3 py-2 text-sm outline-none",
                                activeExprValid ? "border-zinc-700 focus:border-zinc-500" : "border-red-600 focus:border-red-600"
                            )}
                        />
                        {!activeExprValid && <div className="mt-1 text-xs text-red-400">Invalid duration expression.</div>}
                    </div>

                    {editingActive && (
                        <div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
                            <div className="mb-1 text-zinc-500">Current</div>
                            <div className="flex flex-wrap gap-4">
                                <div>
                                    <span className="text-zinc-500">Player:</span> {editingActive.playerName}
                                </div>
                                <div>
                                    <span className="text-zinc-500">Package:</span> {editingActive.packageName}
                                </div>
                                <div>
                                    <span className="text-zinc-500">Duration:</span> {secondsToHuman(editingActive.duration)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SlideOver>

            {/* SlideOver: Edit VIP Package (Enter to save supported) */}
            <SlideOver
                title={
                    editingPackage ? (
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Edit VIP Package</span>
                            <span className="text-xs text-zinc-400">{editingPackage.name}</span>
                        </div>
                    ) : (
                        "Edit VIP Package"
                    )
                }
                open={!!editingPackage}
                onClose={() => setEditingPackage(null)}
                onSave={savePackageEditor}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <label className="mb-1 block text-xs text-zinc-400">Group</label>
                            <input
                                value={pkgGroup}
                                onChange={(e) => setPkgGroup(e.target.value)}
                                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs text-zinc-400">Priority</label>
                            <input
                                type="number"
                                value={pkgPriority}
                                onChange={(e) => setPkgPriority(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs text-zinc-400">Display Name</label>
                            <input
                                value={pkgDisplayName}
                                onChange={(e) => setPkgDisplayName(e.target.value)}
                                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                            />
                            <div className="mt-1 text-[11px] text-zinc-500">
                                Minecraft color codes supported (e.g. &aGreen, &6Gold). Press Enter to save.
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs text-zinc-400">Duration (seconds)</label>
                            <input
                                type="number"
                                value={pkgDuration}
                                onChange={(e) => setPkgDuration(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                            />
                        </div>
                    </div>

                    {editingPackage && (
                        <div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
                            <div className="mb-1 text-zinc-500">Preview</div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="truncate font-medium">
                                        <McText text={pkgDisplayName || editingPackage.name} />
                                    </div>
                                    <div className="mt-1 text-xs text-zinc-400">
                                        <span className="mr-2 rounded bg-zinc-800 px-1.5 py-0.5">group: {pkgGroup || "-"}</span>
                                        <span className="mr-2 rounded bg-zinc-800 px-1.5 py-0.5">prio: {pkgPriority || 0}</span>
                                    </div>
                                </div>
                                <div className="text-right text-xs text-zinc-300">
                                    <div>{secondsToHuman(Number(pkgDuration) || 0)}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SlideOver>
        </div>
    );
}