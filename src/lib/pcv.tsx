export function parseDurationToSeconds(input: string): number {
    if (!input || typeof input !== "string") {
        throw new Error("Invalid duration: input must be a non-empty string.");
    }

    const s = input.trim();
    if (!s) {
        throw new Error("Invalid duration: empty string.");
    }

    // Leading sign applies to tokens without their own sign
    const leading = s.match(/^[+-]/)?.[0];
    const leadingSign = leading === "-" ? -1 : 1;

    // Match tokens like "+2h", "30m", "-10s", "5d" (case-insensitive), allowing spaces between value and unit
    const tokenRe = /([+-]?\d+)\s*([dhmsDHMS])/g;

    let total = 0;
    let foundAny = false;
    let m: RegExpExecArray | null;

    // Compute factor per unit
    const unitFactor = (u: string): number => {
        switch (u.toLowerCase()) {
            case "d":
                return 86400;
            case "h":
                return 3600;
            case "m":
                return 60;
            case "s":
                return 1;
            default:
                return NaN;
        }
    };

    while ((m = tokenRe.exec(s)) !== null) {
        foundAny = true;
        const rawNum = m[1]; // may include per-token sign
        const unit = m[2];
        const factor = unitFactor(unit);
        if (!isFinite(factor)) {
            throw new Error(`Invalid duration unit: "${unit}"`);
        }

        const num = parseInt(rawNum, 10);
        if (!Number.isFinite(num)) {
            throw new Error(`Invalid duration number: "${rawNum}"`);
        }

        // If token has its own sign, it overrides leading sign; otherwise apply leading sign
        const hasTokenSign = rawNum.startsWith("+") || rawNum.startsWith("-");
        const signed = (hasTokenSign ? num : leadingSign * num) * factor;

        total += signed;
    }

    if (!foundAny) {
        throw new Error("Invalid duration: no time tokens found.");
    }

    // Ensure the entire string consisted only of valid tokens, an optional leading sign, and spaces
    const cleaned = s
        .replace(tokenRe, "") // remove all matched tokens
        .replace(/^[+-]/, "") // remove a single leading sign if present
        .replace(/\s+/g, ""); // remove whitespace

    if (cleaned.length > 0) {
        throw new Error(`Invalid duration: unexpected content "${cleaned}"`);
    }

    return total;
}

export function tryParseDurationToSeconds(input: string): number | null {
    try {
        return parseDurationToSeconds(input);
    } catch {
        return null;
    }
}