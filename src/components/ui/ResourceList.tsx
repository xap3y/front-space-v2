import type { ComponentPropsWithRef } from "react";
import styles from "./ui.module.css";

/** Shared outer shell; resource-specific content and grid columns stay intact. */
export default function ResourceList({ className, ...props }: ComponentPropsWithRef<"div">) {
    return <div {...props} className={[styles.resourceList, className].filter(Boolean).join(" ")} />;
}
