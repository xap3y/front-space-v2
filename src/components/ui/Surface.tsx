import type { ComponentPropsWithRef } from "react";
import styles from "./ui.module.css";

/** Shared opaque card, dropdown and dialog surface; content controls its spacing. */
export default function Surface({ className, ...props }: ComponentPropsWithRef<"div">) {
    return <div {...props} className={[styles.surface, className].filter(Boolean).join(" ")} />;
}
