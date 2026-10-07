"use client";

import React from "react";

type Seg = {
    text: string;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    obf?: boolean;
    gradient?: string[];
};

const MC_COLOR_HEX: Record<string, string> = {
    "0": "#000000", // black
    "1": "#0000AA", // dark_blue
    "2": "#00AA00", // dark_green
    "3": "#00AAAA", // dark_aqua
    "4": "#AA0000", // dark_red
    "5": "#AA00AA", // dark_purple
    "6": "#FFAA00", // gold
    "7": "#AAAAAA", // gray
    "8": "#555555", // dark_gray
    "9": "#5555FF", // blue
    a: "#55FF55",   // green
    b: "#55FFFF",   // aqua
    c: "#FF5555",   // red
    d: "#FF55FF",   // light_purple
    e: "#FFFF55",   // yellow
    f: "#FFFFFF",   // white
};

export function McText({ text, className }: { text: string; className?: string }) {
    const segments: Seg[] = [];
    let cur: Seg = { text: "" };

    const push = () => {
        if (cur.text.length) {
            segments.push({ ...cur });
            cur.text = "";
        }
    };

    const resetFormats = () => {
        cur.bold = false;
        cur.italic = false;
        cur.underline = false;
        cur.strike = false;
        cur.obf = false;
    };

    const applyColor = (hex: string) => {
        // In MC, a color code also resets formats
        cur.color = hex;
        resetFormats();
    };

    const s = text || "";
    const stack: Array<{ tag: string; style: Seg }> = [];
    const namedColors = Object.fromEntries(
        ["black", "dark_blue", "dark_green", "dark_aqua", "dark_red", "dark_purple", "gold", "gray", "dark_gray", "blue", "green", "aqua", "red", "light_purple", "yellow", "white"]
            .map((name, index) => [name, MC_COLOR_HEX[index.toString(16)]])
    );
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        const rgb = s.slice(i).match(/^(?:[&§]#[0-9a-f]{6}|[&§]x(?:[&§][0-9a-f]){6})/i);
        if (rgb) {
            push();
            const hex = rgb[0].includes("#")
                ? rgb[0].slice(2)
                : rgb[0].slice(2).replace(/[&§]/g, "");
            cur.gradient = undefined;
            applyColor(`#${hex}`);
            i += rgb[0].length - 1;
            continue;
        }

        const tagMatch = ch === "<" ? s.slice(i).match(/^<([^>]+)>/) : null;
        if (tagMatch) {
            const tag = tagMatch[1].toLowerCase();
            const parts = tag.split(":");
            const name = parts[0];
            const formats: Record<string, keyof Seg> = {
                b: "bold", bold: "bold", i: "italic", italic: "italic",
                u: "underline", underlined: "underline", st: "strike",
                strikethrough: "strike", obf: "obf", obfuscated: "obf",
            };
            const color = /^#[0-9a-f]{6}$/i.test(name) ? name : namedColors[name];
            const gradient = name === "gradient" ? parts.slice(1).map(value => namedColors[value] || value) : [];
            const closingIndex = tag.startsWith("/")
                ? stack.map(entry => entry.tag).lastIndexOf(tag.slice(1))
                : -1;
            if (closingIndex >= 0 || color || formats[name] || name === "reset"
                || (gradient.length >= 2 && gradient.every(value => /^#[0-9a-f]{6}$/i.test(value)))) {
                push();
                if (closingIndex >= 0) {
                    cur = { ...stack[closingIndex].style, text: "" };
                    stack.splice(closingIndex);
                } else if (name === "reset") {
                    cur = { text: "" };
                    stack.length = 0;
                } else {
                    stack.push({ tag: name, style: { ...cur } });
                    if (color) {
                        cur.color = color;
                        cur.gradient = undefined;
                    } else if (formats[name]) {
                        cur = { ...cur, [formats[name]]: parts[1] !== "false" };
                    } else {
                        cur.gradient = gradient;
                    }
                }
                i += tagMatch[0].length - 1;
                continue;
            }
        }
        const isCode = (ch === "&" || ch === "§") && i + 1 < s.length;
        if (isCode) {
            const code = s[i + 1].toLowerCase();
            // push current buffer before changing styles
            push();

            if (MC_COLOR_HEX[code]) {
                cur.gradient = undefined;
                applyColor(MC_COLOR_HEX[code]);
            } else {
                switch (code) {
                    case "l": // bold
                        cur.bold = true;
                        break;
                    case "n": // underline
                        cur.underline = true;
                        break;
                    case "m": // strikethrough
                        cur.strike = true;
                        break;
                    case "o": // italic
                        cur.italic = true;
                        break;
                    case "k": // obfuscated
                        cur.obf = true;
                        break;
                    case "r": // reset
                        cur = { text: "" };
                        break;
                    default:
                        // Unknown code, treat literally '&x'
                        cur.text += ch;
                        // don't skip the next char then continue as normal
                        continue;
                }
            }
            i++; // skip code char
        } else {
            cur.text += ch;
        }
    }
    push();

    const rendered: Seg[] = [];
    for (let index = 0; index < segments.length;) {
        const segment = segments[index];
        if (!segment.gradient) {
            rendered.push(segment);
            index++;
            continue;
        }
        const colors = segment.gradient;
        const group: Seg[] = [];
        while (index < segments.length && segments[index].gradient === colors) {
            group.push(segments[index++]);
        }
        const length = group.reduce((total, entry) => total + Array.from(entry.text).length, 0);
        let position = 0;
        for (const entry of group) {
            for (const character of Array.from(entry.text)) {
                const progress = length > 1 ? position / (length - 1) * (colors.length - 1) : 0;
                const stop = Math.min(Math.floor(progress), colors.length - 2);
                const fraction = progress - stop;
                const channels = [1, 3, 5].map(offset => {
                    const start = parseInt(colors[stop].slice(offset, offset + 2), 16);
                    const end = parseInt(colors[stop + 1].slice(offset, offset + 2), 16);
                    return Math.round(start + (end - start) * fraction);
                });
                rendered.push({ ...entry, text: character, color: `rgb(${channels.join(", ")})` });
                position++;
            }
        }
    }

    return (
        <span
            className={className}
            style={{
                fontFamily: "PcvMinecraft, monospace",
                fontVariantLigatures: "none",
            }}
        >
            {rendered.map((seg, idx) => (
                <span
                    key={idx}
                    style={{
                        color: seg.color,
                        fontWeight: seg.bold ? 700 : 400,
                        fontStyle: seg.italic ? "italic" : "normal",
                        textDecorationLine: [
                            seg.underline ? "underline" : "",
                            seg.strike ? "line-through" : "",
                        ].filter(Boolean).join(" ") || "none",
                    }}
                    className={seg.obf ? "animate-pulse" : undefined}
                >
                    {seg.text}
                </span>
            ))}
    </span>
    );
}
