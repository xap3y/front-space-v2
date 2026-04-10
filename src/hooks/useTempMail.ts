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

export function useTempMail() {
    const [tempMail, setTempMail] = useState<TempMail | null>(null);

    async function createTempMail(apiKey: string) {
        const res = await fetch(getApiUrl() + `/v1/email/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
        });
        if (!res.ok) {
            if (res.status === 429) {
                errorToast('Rate limit exceeded. Please wait before creating another temp mail.');
            } else {
                errorToast(`Failed to create temp mail (${res.status})`);
            }
            return;
        }
        const data = await res.json();
        console.log('Temp mail created:', data);
        const mail: TempMail = {
            email: data.message.email,
            createdBy: data.message.createdBy,
            status: "OPEN",
            expireAt: data.message.expireAt === 'never' ? null : data.message.expireAt
        };
        setTempMail(mail);
        storeInLocalStorage(mail);
        return data;
    }

    async function createPublicTempMail(turnstileToken: string) {
        const res = await fetch(getApiUrl() + `/v1/email/create/public`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: turnstileToken }),
            credentials: 'include',
        });
        if (!res.ok) {
            if (res.status === 429) {
                errorToast('Rate limit exceeded. Please wait before creating another temp mail.');
                return {
                        error: "Rate limit exceeded. Please wait before creating another temp mail.",
                }
            } else {
                errorToast(`Failed to create temp mail (${res.status})`);
            }
            return;
        }
        const data = await res.json();
        console.log('Public temp mail created:', data);
        const mail: TempMail = {
            email: data.message.email,
            createdBy: data.message.createdBy,
            status: "OPEN",
            expireAt: data.message.expireAt === 'never' ? null : data.message.expireAt
        };
        setTempMail(mail);
        storeInLocalStorage(mail);
        return data;
    }

    function resetTempMail() {
        setTempMail(null);
    }

    function setExistingTempMail(mail: TempMail) {
        setTempMail(mail);
    }

    function storeInLocalStorage(mail: TempMail) {
        try {
            localStorage.setItem('lastTempMail', JSON.stringify(mail));
        } catch (e) {
            console.error('Failed to store temp mail in localStorage:', e);
        }
    }

    async function refetchTempMailInfo(email: string): Promise<TempMail | null> {
        const updatedMail = await getEmailInfo(email);
        if (updatedMail && !updatedMail.error) {
            const mail: TempMail = {
                email: updatedMail.message.email,
                createdBy: updatedMail.message.createdBy,
                status: updatedMail.message.status,
                expireAt: updatedMail.message.expireAt === 'never' ? null : updatedMail.message.expireAt
            };
            setTempMail(mail);
            storeInLocalStorage(mail);
            return mail;
        }
        return null;
    }

    async function loadFromLocalStorage(): Promise<TempMail | null> {
        try {
            const raw = localStorage.getItem('lastTempMail');
            if (raw) {
                const email = JSON.parse(raw) as TempMail;
                const updatedMail = await getEmailInfo(email.email);
                if (updatedMail && !updatedMail.error) {
                    const mail: TempMail = {
                        email: updatedMail.message.email,
                        createdBy: updatedMail.message.createdBy,
                        status: updatedMail.message.status,
                        expireAt: updatedMail.message.expireAt === 'never' ? null : updatedMail.message.expireAt
                    };
                    setTempMail(mail);
                    return mail;
                } else {
                    localStorage.removeItem('lastTempMail');
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
        refetchTempMailInfo
    };
}