"use client";

import { Tooltip } from "react-tooltip";
import { HeartbeatChecker } from "./HeartbeatChecker";

export const ClientRoot = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <Tooltip id="my-tooltip" />
            <HeartbeatChecker />
            {children}
        </>
    );
};