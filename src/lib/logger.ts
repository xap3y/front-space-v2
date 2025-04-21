

export function logApiRes(res: Response, data?: any) {
    if (res.ok) {
        if (data) console.debug(`[API] [${res.status}] ${res.url} OK | M: ${data}`);
        else console.debug(`[API] [${res.status}] ${res.url} OK`);
        return;
    }

    if (!data) {
        console.debug(`[API] [${res.status}] ${res.url} E: ${res}`);
        return;
    }

    console.debug(`[API] [${res.status}] ${res.url} E: ${res} M: ${data}`);
}