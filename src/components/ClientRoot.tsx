"use client";

import { HeartbeatChecker } from "./HeartbeatChecker";

export const ClientRoot = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <HeartbeatChecker />
            {children}
        </>
    );
};