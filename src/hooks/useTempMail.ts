'use client';

import { useState } from 'react';
import { getApiUrl } from "@/lib/core";
import { getEmailInfo } from "@/lib/apiGetters";
import { errorToast } from '@/lib/client';

export interface TempMail {
    email: string;
    status: string;
    createdBy: string;
    expireAt: string | null;
}

export interface TempMailHistoryEntry extends TempMail {
    savedAt: number; // timestamp ms
}

const ACTIVE_STORAGE_KEY = 'lastTempMail';
const HISTORY_STORAGE_KEY = 'tempMailHistory_v2';
const MAX_HISTORY = 20;

// ─── module-level localStorage helpers (no React state) ───────────────────────

export function readHistory(): TempMailHistoryEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as TempMailHistoryEntry[];
    } catch {
        return [];
    }
}

export function writeHistory(history: TempMailHistoryEntry[]) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
        // Dispatch a custom event so same-tab listeners can react
        window.dispatchEvent(new CustomEvent('tempmail-history-changed'));
    } catch { /* ignore */ }
}

/** Move a mail into history. If already there, update its status. */
export function archiveToHistory(mail: TempMail) {
    const history = readHistory();
    const idx = history.findIndex(h => h.email === mail.email);
    if (idx !== -1) {
        history[idx] = { ...history[idx], ...mail };
        writeHistory(history);
    } else {
        const entry: TempMailHistoryEntry = { ...mail, savedAt: Date.now() };
        writeHistory([entry, ...history]);
    }
}

export function removeFromHistory(email: string) {
    writeHistory(readHistory().filter(h => h.email !== email));
}

/** Update status of a history entry (e.g. SUSPENDED/DELETED). */
export function patchHistoryEntry(email: string, patch: Partial<TempMail>) {
    const history = readHistory();
    const idx = history.findIndex(h => h.email === email);
    if (idx !== -1) {
        history[idx] = { ...history[idx], ...patch };
        writeHistory(history);
    }
}

// ─────────────────────────────────────────────────────────────────────────────

export function useTempMail() {
    const [tempMail, setTempMail] = useState<TempMail | null>(null);

    // ── internal ──────────────────────────────────────────────────────────────

    function storeActive(mail: TempMail) {
        try {
            localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(mail));
        } catch { /* ignore */ }
    }

    function setAndStore(mail: TempMail) {
        setTempMail(mail);
        storeActive(mail);
    }

    // ── public API ────────────────────────────────────────────────────────────

    async function createTempMail(apiKey: string): Promise<any> {
        // Archive current active to history before replacing
        const currentRaw = localStorage.getItem(ACTIVE_STORAGE_KEY);
        if (currentRaw) {
            try { archiveToHistory(JSON.parse(currentRaw) as TempMail); } catch { /* ignore */ }
        }

        const res = await fetch(getApiUrl() + `/v1/email/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        });
        if (!res.ok) {
            let message = `Failed to create temp mail (${res.status})`;
            try {
                const payload = await res.json();
                if (typeof payload?.message === "string" && payload.message.trim()) message = payload.message;
            } catch { /* use fallback */ }
            if (res.status === 429) {
                message = 'Rate limit exceeded. Please wait before creating another temp mail.';
            }
            errorToast(message);
            return null;
        }
        const data = await res.json();
        const mail: TempMail = {
            email: data.message.email,
            createdBy: data.message.createdBy,
            status: "OPEN",
            expireAt: data.message.expireAt === 'never' ? null : data.message.expireAt
        };
        setAndStore(mail);
        return data;
    }

    async function createPublicTempMail(turnstileToken: string): Promise<any> {
        // Archive current active to history before replacing
        const currentRaw = localStorage.getItem(ACTIVE_STORAGE_KEY);
        if (currentRaw) {
            try { archiveToHistory(JSON.parse(currentRaw) as TempMail); } catch { /* ignore */ }
        }

        const res = await fetch(getApiUrl() + `/v1/email/create/public`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: turnstileToken }),
            credentials: 'include',
        });
        if (!res.ok) {
            if (res.status === 429) {
                errorToast('Rate limit exceeded. Please wait before creating another temp mail.');
                return { error: "Rate limit exceeded. Please wait before creating another temp mail." };
            }
            errorToast(`Failed to create temp mail (${res.status})`);
            return { error: `Failed to create temp mail (${res.status})` };
        }
        const data = await res.json();
        const mail: TempMail = {
            email: data.message.email,
            createdBy: data.message.createdBy,
            status: "OPEN",
            expireAt: data.message.expireAt === 'never' ? null : data.message.expireAt
        };
        setAndStore(mail);
        return data;
    }

    function resetTempMail() { setTempMail(null); }

    function setExistingTempMail(mail: TempMail) { setTempMail(mail); }

    /**
     * Reopen a mail from history:
     * - Archives current active
     * - Fetches fresh status from server (fallback to stored)
     * - Sets it as the new active mail
     */
    async function reopenTempMail(historyEntry: TempMailHistoryEntry): Promise<TempMail | null> {
        // Archive the current active first
        const currentRaw = localStorage.getItem(ACTIVE_STORAGE_KEY);
        if (currentRaw) {
            try { archiveToHistory(JSON.parse(currentRaw) as TempMail); } catch { /* ignore */ }
        }

        // Fetch fresh info from server
        const updated = await getEmailInfo(historyEntry.email);
        let mail: TempMail;
        if (updated && !updated.error) {
            mail = {
                email: updated.message.email,
                createdBy: updated.message.createdBy,
                status: updated.message.status,
                expireAt: updated.message.expireAt === 'never' ? null : updated.message.expireAt
            };
        } else {
            mail = { email: historyEntry.email, status: historyEntry.status, createdBy: historyEntry.createdBy, expireAt: historyEntry.expireAt };
        }

        setAndStore(mail);
        // Remove from history now that it's active again
        removeFromHistory(mail.email);
        return mail;
    }

    /** Refetch status from server, update active mail AND sync to history if present there. */
    async function refetchTempMailInfo(email: string): Promise<TempMail | null> {
        const updatedMail = await getEmailInfo(email);
        if (updatedMail && !updatedMail.error) {
            const mail: TempMail = {
                email: updatedMail.message.email,
                createdBy: updatedMail.message.createdBy,
                status: updatedMail.message.status,
                expireAt: updatedMail.message.expireAt === 'never' ? null : updatedMail.message.expireAt
            };
            setAndStore(mail);
            // Also patch in history if it exists there
            patchHistoryEntry(mail.email, { status: mail.status, expireAt: mail.expireAt });
            return mail;
        }
        return null;
    }

    async function loadFromLocalStorage(): Promise<TempMail | null> {
        try {
            const raw = localStorage.getItem(ACTIVE_STORAGE_KEY);
            if (raw) {
                const cached = JSON.parse(raw) as TempMail;
                const updatedMail = await getEmailInfo(cached.email);
                if (updatedMail && !updatedMail.error) {
                    const mail: TempMail = {
                        email: updatedMail.message.email,
                        createdBy: updatedMail.message.createdBy,
                        status: updatedMail.message.status,
                        expireAt: updatedMail.message.expireAt === 'never' ? null : updatedMail.message.expireAt
                    };
                    setTempMail(mail);
                    storeActive(mail);
                    return mail;
                } else {
                    // Fallback to cached
                    setTempMail(cached);
                    return cached;
                }
            }
        } catch (e) {
            console.error('Failed to load temp mail from localStorage:', e);
        }
        return null;
    }

    return {
        tempMail,
        createTempMail,
        createPublicTempMail,
        resetTempMail,
        loadFromLocalStorage,
        setExistingTempMail,
        refetchTempMailInfo,
        reopenTempMail,
    };
}
