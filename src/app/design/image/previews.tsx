"use client";

import {useEffect, useId, useRef, useState} from "react";
import {FaChevronDown, FaCopy, FaDownload, FaGlobe, FaImage, FaLink} from "react-icons/fa6";
import {NativeButton, NativeDeleteButton} from "@/components/ui/NativeButton";
import {PreviewOption} from "../preview-layout";
import styles from "./preview.module.css";

const imageSource = "/og-image.png";
const fileName = "space-preview.png";

const variants = [
    {id: "split", name: "Dělené Copy", description: "Copy kopíruje odkaz na portál. Šipka vybírá typ odkazu."},
    {id: "primary", name: "Zvýrazněné Download", description: "Plné tlačítko pro stažení a jemnější obrys u nabídky Copy."},
    {id: "overlay", name: "Plovoucí lišta", description: "Kratší sada akcí přímo v pravém dolním rohu náhledu."},
    {id: "rail", name: "Boční panel", description: "Stažení a kopírování vedle náhledu, smazání odděleně dole."},
    {id: "file", name: "Soubor a akce", description: "Údaje o souboru a kompaktní tlačítka v jedné liště."},
] as const;

const links = [
    {label: "Short URL", description: "Krátký odkaz pro sdílení", href: "https://i.example.com/space", icon: FaLink},
    {label: "Portal URL", description: "Otevře stránku náhledu", href: "/design/image", icon: FaGlobe},
    {label: "Raw URL", description: "Otevře přímo soubor", href: imageSource, icon: FaImage},
] as const;

function ImageActionPreview({variant}: {variant: typeof variants[number]}) {
    const [open, setOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [status, setStatus] = useState("");
    const menuId = useId();
    const toolbar = useRef<HTMLDivElement>(null);
    const copyTrigger = useRef<HTMLButtonElement>(null);
    const deleteTrigger = useRef<HTMLButtonElement>(null);
    const split = variant.id === "split";

    useEffect(() => {
        if (!open) return;
        const closeOutside = (event: PointerEvent) => {
            if (event.target instanceof Node && !toolbar.current?.contains(event.target)) setOpen(false);
        };
        document.addEventListener("pointerdown", closeOutside);
        return () => document.removeEventListener("pointerdown", closeOutside);
    }, [open]);

    async function copy(link: typeof links[number]) {
        setOpen(false);
        try {
            const url = new URL(link.href, window.location.origin);
            if (link.href === "/design/image") url.hash = variant.id;
            await navigator.clipboard.writeText(url.href);
            setStatus(`${link.label} zkopírována.`);
        } catch {
            setStatus("Prohlížeč nepovolil přístup ke schránce.");
        }
    }

    return (
        <PreviewOption name={variant.name} description={variant.description}>
            <div id={variant.id} className="flex flex-1 flex-col px-3 pb-3 pt-4 sm:px-4">
                <div className={styles.stage} data-layout={variant.id}>
                    <div className={styles.media}>
                        <img src={imageSource} alt="Ukázkový obrázek Space" width={1734} height={907} />
                    </div>
                    <div ref={toolbar} className={styles.toolbar} role="group" aria-label="Akce obrázku"
                        onBlur={event => {
                            if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
                        }}
                        onKeyDown={event => {
                            if (event.key === "Escape" && open) {
                                setOpen(false);
                                copyTrigger.current?.focus();
                            }
                        }}
                    >
                        {variant.id === "file" && <div className={styles.fileInfo}><strong>{fileName}</strong><span>PNG · 1734 × 907</span></div>}
                        <div className={styles.mainActions}>
                            <a className={styles.action} data-action="download" href={imageSource} download={fileName} title="Download" aria-label="Download">
                                <FaDownload aria-hidden="true" /><span className={styles.actionLabel}>Download</span>
                            </a>
                            <div className={styles.copyGroup}>
                                {split && <NativeButton type="button" className={styles.action} data-action="copy" onClick={() => void copy(links[1])} title="Copy Portal URL">
                                    <FaCopy aria-hidden="true" /><span className={styles.actionLabel}>Copy</span>
                                </NativeButton>}
                                <NativeButton type="button" ref={copyTrigger} className={styles.action} data-action={split ? "chevron" : "copy"} data-active={open}
                                    aria-label={split ? "Typ odkazu" : "Copy"} aria-expanded={open} aria-controls={menuId}
                                    title={split ? "Typ odkazu" : "Copy"} onClick={() => {setOpen(value => !value); setDeleting(false);}}>
                                    {!split && <><FaLink aria-hidden="true" /><span className={styles.actionLabel}>Copy</span></>}
                                    <FaChevronDown className={styles.chevron} aria-hidden="true" />
                                </NativeButton>
                                <div id={menuId} className={styles.menu} hidden={!open} role="group" aria-label="Odkaz ke kopírování">
                                    {links.map(link => (
                                        <NativeButton key={link.label} type="button" layout="row" onClick={() => {void copy(link); copyTrigger.current?.focus();}}>
                                            <span className={styles.linkChoice}>
                                                <link.icon aria-hidden="true" className={styles.linkIcon} />
                                                <span><strong>{link.label}</strong><small>{link.description}</small></span>
                                            </span>
                                        </NativeButton>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <NativeDeleteButton type="button" ref={deleteTrigger} className={styles.action} data-action="delete" aria-expanded={deleting} aria-label="Delete" title="Delete"
                            onClick={() => {setDeleting(value => !value); setOpen(false);}}>
                            <span className={styles.actionLabel}>Delete</span>
                        </NativeDeleteButton>
                    </div>
                </div>
                {deleting && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-red-400/20 bg-red-400/5 px-2.5 py-2 text-xs" role="group" aria-label="Potvrzení smazání">
                        <span className="mr-auto text-red-200">Smazat ukázkový soubor?</span>
                        <NativeButton type="button" onClick={() => {setDeleting(false); deleteTrigger.current?.focus();}}>Zrušit</NativeButton>
                        <NativeButton variant="delete" type="button" onClick={() => {setDeleting(false); setStatus("Smazání potvrzeno v ukázce."); deleteTrigger.current?.focus();}}>Smazat</NativeButton>
                    </div>
                )}
                <p role="status" className="min-h-7 pt-1 text-[11px] text-zinc-400">{status}</p>
            </div>
        </PreviewOption>
    );
}

export default function ImagePreviews() {
    return variants.map(variant => <ImageActionPreview key={variant.id} variant={variant} />);
}
