import { Turnstile, useTurnstile } from "react-turnstile";

type TurnstileWidgetProps = {
    onVerified?: (token: string) => void;
    onError?: () => void;
    onLoad?: () => void;
    turnstile?: ReturnType<typeof useTurnstile>;
};

export function TurnstileWidget({ onVerified, onError, onLoad, turnstile }: TurnstileWidgetProps) {

    return (
        <Turnstile
            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onVerify={(token) => {
                onVerified?.(token);
            }}
            onExpire={() => {
                turnstile.reset();
                onError?.();
            }}
            onError={() => {
                turnstile.reset();
                onError?.();
            }}
            onLoad={() => {
                onLoad?.();
            }}
        />
    );
}