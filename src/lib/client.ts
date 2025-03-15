import {toast} from "react-toastify";

export const errorToast = (message: string, delay: number = 1000) => {
    return toast.error(message, {
        autoClose: delay,
        closeOnClick: true,
    })
}