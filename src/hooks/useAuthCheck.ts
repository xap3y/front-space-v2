"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {getApiUrl} from "@/lib/core";

export interface UseAuthCheckOptions {
    onValid?: (response: Response) => void | Promise<void>;
    onInvalid?: (info: { response: Response | null; error: unknown }) => void | Promise<void>;
    once?: boolean;
    dependency?: unknown;
    method?: "POST" | "GET";
}

export function useAuthCheck(options: UseAuthCheckOptions = {}) {
    const {
        onValid,
        onInvalid,
        once = true,
        dependency,
        method = "POST",
    } = options;

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setCheckingAuth(true);
            try {
                const response = await fetch(getApiUrl() + "/v1/auth/verify/validate", {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    credentials: "include",
                });

                if (cancelled) return;

                if (!response.ok) {
                    setAuthenticated(false);
                    setCheckingAuth(false);
                    if (onInvalid) await onInvalid({ response, error: null });
                    return;
                }

                setAuthenticated(true);
                setCheckingAuth(false);
                if (onValid) await onValid(response);
            } catch (error) {
                if (cancelled) return;
                setAuthenticated(false);
                setCheckingAuth(false);
                if (onInvalid) await onInvalid({ response: null, error });
            }
        };

        run();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [once ? undefined : dependency, method]); // if once === true, dependency ignored

    return {
        checkingAuth,
        authenticated,
        setCheckingAuth,
        refresh: async () => {
            return new Promise<void>((resolve) => {
                // Trigger by toggling loading; simplest manual re-run:
                setAuthenticated(null);
                setCheckingAuth(true);
                (async () => {
                    try {
                        const response = await fetch(getApiUrl() + "/v1/auth/verify/validate", {
                            method,
                            headers: {
                                "Content-Type": "application/json",
                                Accept: "application/json",
                            },
                            credentials: "include",
                        });
                        if (!response.ok) {
                            setAuthenticated(false);
                            if (onInvalid) await onInvalid({ response, error: null });
                        } else {
                            setAuthenticated(true);
                            if (onValid) await onValid(response);
                        }
                    } catch (error) {
                        setAuthenticated(false);
                        if (onInvalid) await onInvalid({ response: null, error });
                    } finally {
                        setCheckingAuth(false);
                        resolve();
                    }
                })();
            });
        },
    };
}