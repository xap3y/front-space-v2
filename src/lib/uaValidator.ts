export interface UserAgentInfo {
    raw: string;
    validFormat: boolean;
    family: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'ie' | 'unknown';
    version: string | null;
    isMobile: boolean;
}

const regex = {
    // --- THIS IS THE UPDATED LINE ---
    // Enforces structure: 10-512 printable chars, starts with "Mozilla/",
    // and contains a platform string in parentheses like "(...)".
    basicFormat: /^(?=[\x20-\x7E]{10,512}$)Mozilla\/\S+\s+\([^)]+\)\s+\S+.*$/,

    // Browser families
    chrome: /Chrome\/([0-9._]+)/,
    firefox: /Firefox\/([0-9._]+)/,
    safari: /Version\/([0-9._]+).*Safari\//,
    edge: /Edg(?:e|A|iOS)?\/([0-9._]+)/,
    opera: /(?:OPR|Opera)\/([0-9._]+)/,
    ie: /(?:MSIE |Trident\/.*; rv:)([0-9._]+)/,

    // Mobile detection
    mobile: /\b(Mobile|Android|iPhone|iPad|iPod|Phone|BlackBerry|IEMobile)\b/i
};

/**
 * Validates and classifies a user-agent string.
 * (This function logic is correct and does not need to change)
 * @param ua - The user-agent string to validate
 * @returns Parsed user-agent info
 */
export function validateUserAgent(ua: string): UserAgentInfo {
    const raw = ua.trim();
    const validFormat = regex.basicFormat.test(raw);

    // If the basic format is invalid, return immediately.
    if (!validFormat) {
        return {
            raw,
            validFormat: false,
            family: 'unknown',
            version: null,
            isMobile: false
        };
    }

    // Detect browser family/version
    const detectors: [UserAgentInfo['family'], RegExp][] = [
        ['edge', regex.edge],
        ['chrome', regex.chrome],
        ['firefox', regex.firefox],
        ['safari', regex.safari],
        ['opera', regex.opera],
        ['ie', regex.ie]
    ];

    let family: UserAgentInfo['family'] = 'unknown';
    let version: string | null = null;

    for (const [name, pattern] of detectors) {
        const match = raw.match(pattern);
        if (match) {
            family = name;
            version = match[1]?.replace(/_/g, '.') ?? null;
            break;
        }
    }

    const isMobile = regex.mobile.test(raw);

    return {
        raw,
        validFormat: true,
        family,
        version,
        isMobile
    };
}