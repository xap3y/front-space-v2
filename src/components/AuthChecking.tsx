"use client";

export const AuthChecking = () => {
    return (
        <>
            <main className="flex min-h-screen items-center justify-center px-4">
                <div className="w-full max-w-md rounded-md bg-primary_light/60 backdrop-blur-sm border border-primary_border shadow-card p-8">
                    <h1 className="text-center text-xl font-semibold tracking-wide text-white">
                        Verifying...
                    </h1>
                    <p className="mt-1 text-center text-xs text-gray-400">
                        Please wait while we verify your email.
                    </p>
                </div>
            </main>
        </>
    );
};