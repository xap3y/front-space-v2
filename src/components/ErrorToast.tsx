import {MdErrorOutline, MdInfoOutline, MdWarningAmber} from "react-icons/md";
import {IconType} from "react-icons";

type ToastType = "ERROR" | "WARN" | "INFO";

interface Props {
    type: ToastType;
    message: string;
}

const TOAST_STYLES: Record<
    ToastType,
    {
        bg: string;
        color: string;
        Icon: IconType;
    }
> = {
    ERROR: {
        bg: "#b91c1c", // Dark red
        color: "#fff",
        Icon: MdErrorOutline,
    },
    WARN: {
        bg: "#f59e42", // Dark amber/orange
        color: "#212121",
        Icon: MdWarningAmber,
    },
    INFO: {
        bg: "#2563eb", // Blue-700
        color: "#fff",
        Icon: MdInfoOutline,
    },
};

export function ErrorToast({type, message}: Props) {
    const style = TOAST_STYLES[type];
    return (
        <>
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    zIndex: 9999,
                    background: style.bg,
                    color: style.color,
                    padding: "0.18rem 0.75rem", // Short height
                    display: "flex",
                    alignItems: "center",
                    fontWeight: "bold",
                    fontSize: "0.95rem",
                    minHeight: "1.6rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
                role={type === "ERROR" ? "alert" : "status"}
                aria-live={type === "ERROR" ? "assertive" : "polite"}
            >
                <style.Icon
                    size={18}
                    style={{ marginRight: "0.6rem", flexShrink: 0 }}
                    aria-hidden="true"
                />
                <span style={{ flex: 1 }}>{message}</span>
            </div>
        </>
    )
}