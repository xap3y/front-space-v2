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
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        const isCode = (ch === "&" || ch === "§") && i + 1 < s.length;
        if (isCode) {
            const code = s[i + 1].toLowerCase();
            // push current buffer before changing styles
            push();

            if (MC_COLOR_HEX[code]) {
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

    return (
        <span className={className}>
      {segments.map((seg, idx) => (
          <span
              key={idx}
              style={seg.color ? { color: seg.color } : undefined}
              className={[
                  seg.bold ? "font-bold" : "",
                  seg.italic ? "italic" : "",
                  seg.underline ? "underline" : "",
                  seg.strike ? "line-through" : "",
                  seg.obf ? "animate-pulse" : "",
              ]
                  .filter(Boolean)
                  .join(" ")}
          >
          {seg.text}
        </span>
      ))}
    </span>
    );
}