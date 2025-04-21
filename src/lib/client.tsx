import {toast} from "react-toastify";
import {RoleType} from "@/types/user";
import {JSX} from "react";

export const errorToast = (message: string, delay: number = 1000) => {
    return toast.error(message, {
        autoClose: delay,
        closeOnClick: true,
    })
}

export const okToast = (message: string, delay: number = 1000) => {
    return toast.success(message, {
        autoClose: delay,
        closeOnClick: true,
    })
}

export const copyToClipboard = (text: string, successMessage: string, delay: number = 500) => {
    navigator.clipboard.writeText(text);
    toast.success(successMessage, {
        autoClose: delay,
        closeOnClick: true,
    });
};

export const debugLog = (text: string, text2?: any) => {
    if (process.env.NODE_ENV === "development") {
        (text2) ? console.debug("[D] " + text) : console.debug("[D] " + text + " => " + text2);
    } else { // TODO: remove this in production
        console.log(text);
    }
}

export const getUserRoleBadge: (role: RoleType) => JSX.Element = (role: RoleType) => {
    switch (role) {
        case "OWNER":
            return <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-yellow-900 text-yellow-300">
                    owner
                </span>
        case "ADMIN":
            return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                    admin
                </span>
        case "MODERATOR":
            return <span className="bg-blue-500 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    moderator
                </span>
        case "USER":
            return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                    user
                </span>
        case "GUEST":
            return <span className="bg-primary-darker text-white text-xs font-medium px-2.5 py-0.5 rounded">
                    guest
                </span>
        case "BANNED":
            return <span className="bg-red-600 text-gray-800 text-xs px-2.5 py-0.5 rounded font-parkinsans font-bold">
                    BANNED
                </span>
        case "DELETED":
            return <span className="bg-red-600 text-gray-800 text-xs px-2.5 py-0.5 rounded font-parkinsans font-bold">
                    DELETED
                </span>
        case "TESTER":
            return <span className={"flex gap-3"}>
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        tester
                    </span>

                    <span
                        className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                        admin
                    </span>
                </span>
        default:
            return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                    user
                </span>
    }
}