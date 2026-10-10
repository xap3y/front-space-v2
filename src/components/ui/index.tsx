"use client";

import { useId, type ReactNode } from "react";
import { FaCopy, FaFloppyDisk, FaMagnifyingGlass, FaSpinner, FaTrashCan } from "react-icons/fa6";
import HoverDiv, { DeleteButton as SharedDeleteButton, type HoverDivProps } from "@/components/HoverDiv";
import MainStringInput, { type MainStringInputProps } from "@/components/MainStringInput";
import styles from "./ui.module.css";

export { default as Pagination } from "./Pagination";
export { default as ResourceList } from "./ResourceList";

function cx(...values: Array<string | false | undefined>) {
    return values.filter(Boolean).join(" ");
}

export interface ButtonProps extends Omit<HoverDivProps, "type"> {
    variant?: "primary" | "secondary" | "save" | "delete" | "warning";
    size?: "small" | "normal";
    loading?: boolean;
    iconOnly?: boolean;
}

export function Button({
    variant = "secondary",
    size = "normal",
    loading = false,
    iconOnly = false,
    disabled,
    className,
    icon,
    children,
    ...props
}: ButtonProps) {
    const scheme = {
        primary: "INFO",
        secondary: "INFO",
        save: "SAVE",
        delete: "DELETE",
        warning: "WARN",
    } as const;

    return (
        <HoverDiv
            {...props}
            type={scheme[variant]}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={cx(styles.button, size === "small" && styles.small, iconOnly && styles.icon, variant === "primary" && styles.primary, className)}
            icon={loading ? <FaSpinner className="motion-safe:animate-spin" aria-hidden="true" /> : icon}
        >
            {children}
        </HoverDiv>
    );
}

export function DeleteButton({size, iconOnly: _iconOnly, className, ...props}: Omit<ButtonProps, "variant" | "icon">) {
    return <SharedDeleteButton {...props} className={cx(size === "small" && styles.small, className)} />;
}

export function SaveButton(props: Omit<ButtonProps, "variant" | "icon">) {
    return <Button {...props} variant="save" icon={<FaFloppyDisk aria-hidden="true" />} />;
}

export function CopyButton(props: Omit<ButtonProps, "variant" | "icon">) {
    return <Button {...props} variant="secondary" icon={<FaCopy aria-hidden="true" />} />;
}

export interface FieldProps extends MainStringInputProps {
    label: string;
    hint?: string;
    error?: string;
}

export function Field({ label, hint, error, id, className, inputClassName, ...props }: FieldProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const description = error ?? hint;

    return (
        <div className={styles.field}>
            <label htmlFor={inputId}>{label}</label>
            <MainStringInput
                {...props}
                id={inputId}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={description ? `${inputId}-help` : undefined}
                className={cx(styles.input, className)}
                inputClassName={cx(styles.inputElement, inputClassName)}
            />
            {description && (
                <p id={`${inputId}-help`} className={cx(styles.help, Boolean(error) && styles.error)}>
                    {description}
                </p>
            )}
        </div>
    );
}

export function SearchField(props: Omit<FieldProps, "type" | "suffix">) {
    return <Field {...props} type="search" suffix={<FaMagnifyingGlass />} />;
}

interface ChoiceProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export function Checkbox({ label, checked, onChange, disabled }: ChoiceProps) {
    return (
        <label className={styles.choice}>
            <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
            <span>{label}</span>
        </label>
    );
}

export function Toggle({ label, checked, onChange, disabled, hideLabel = false }: ChoiceProps & { hideLabel?: boolean }) {
    return (
        <label className={cx(styles.choice, styles.toggle)}>
            <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
            <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
        </label>
    );
}

export function SegmentedControl<T extends string>({ label, value, options, onChange }: {
    label: string;
    value: T;
    options: ReadonlyArray<{ value: T; label: string }>;
    onChange: (value: T) => void;
}) {
    return (
        <div role="group" aria-label={label} className={styles.segmented}>
            {options.map((option) => (
                <Button
                    key={option.value}
                    size="small"
                    aria-pressed={value === option.value}
                    onClick={() => onChange(option.value)}
                    className={cx(styles.segment, value === option.value && styles.selected)}
                >
                    {option.label}
                </Button>
            ))}
        </div>
    );
}

export function Grid({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 }) {
    return <div className={cx(styles.grid, columns === 3 && styles.three)}>{children}</div>;
}

export function Toolbar({ children }: { children: ReactNode }) {
    return <div className={styles.toolbar}>{children}</div>;
}

export function Panel({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
    return (
        <section className={styles.panel}>
            <div className={styles.panelHeader}>
                <h2 className="text-sm font-semibold">{title}</h2>
                {actions}
            </div>
            <div className={styles.panelBody}>{children}</div>
        </section>
    );
}

export function Badge({ children, tone = "neutral" }: {
    children: ReactNode;
    tone?: "neutral" | "success" | "warning" | "danger";
}) {
    return <span className={cx(styles.badge, tone !== "neutral" && styles[tone])}>{children}</span>;
}

export function Skeleton({ width, height = 12 }: { width: number | string; height?: number }) {
    return <span aria-hidden="true" className={styles.skeleton} style={{ width, height }} />;
}

export function ResourceCard({ title, metadata, actions, mode = "compact", loading = false }: {
    title?: ReactNode;
    metadata?: ReactNode;
    actions?: ReactNode;
    mode?: "compact" | "detailed";
    loading?: boolean;
}) {
    return (
        <article aria-busy={loading || undefined} aria-label={loading ? "Načítání položky" : undefined} className={cx(styles.panel, styles.resource, mode === "detailed" && styles.detailed)}>
            <div className={styles.resourceContent}>
                <div className={styles.resourceTitle}>{loading ? <Skeleton width={180} /> : title}</div>
                <div className={styles.resourceMeta}>{loading ? <Skeleton width={140} height={10} /> : metadata}</div>
            </div>
            <Toolbar>
                {loading ? (
                    <>
                        <Button disabled aria-label="Načítání akce"><Skeleton width={48} /></Button>
                        <CopyButton disabled iconOnly aria-label="Načítání kopírování" />
                        <DeleteButton disabled iconOnly aria-label="Načítání mazání" />
                    </>
                ) : actions}
            </Toolbar>
        </article>
    );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
    return (
        <div className={cx(styles.panel, styles.empty)}>
            <p className="text-zinc-200">{title}</p>
            <p className="mb-4 mt-2 text-xs text-zinc-500">{description}</p>
            {action}
        </div>
    );
}

