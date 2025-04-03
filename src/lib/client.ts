import {toast} from "react-toastify";

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