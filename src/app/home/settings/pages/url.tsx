"use client";

import { UserObj } from "@/types/user";
import { useRouter } from "next/navigation";
import {useEffect, useMemo, useState} from "react";
import {errorToast, getUserUrlPreferencesSettings, okToast, saveUserUrlPreferencesSettings} from "@/lib/client";
import {UrlPreferences, UrlType} from "@/types/configs";
import LoadingPage from "@/components/LoadingPage";
import SelectMenu from "@/components/SelectMenu";

type PrefKey = keyof UrlPreferences;


const urlOptions: {value: UrlType, label: string}[] = [
    { value: "PORTAL", label: "Portal" },
    { value: "SHORT", label: "Short" },
    { value: "RAW", label: "Raw" },
];

export default function UrlPreferencesTabContent({ user }: { user: UserObj }) {

    const router = useRouter();

    const [preferences, setPreferences] = useState<UrlPreferences>()
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const getSettings = async () => {
            const settings = await getUserUrlPreferencesSettings(user.apiKey);
            console.log("Fetched embed settings: " + JSON.stringify(settings));
            // loop every settings value and if its null set to empty string
            if (!settings) return;

            setPreferences(settings);
        }
        getSettings();
    }, [user]);

    const fields = useMemo<
        { key: PrefKey; label: string; id: string }[]
    >(
        () => [
            { key: "image" as PrefKey, label: "Images", id: "pref-images" },
            { key: "paste" as PrefKey, label: "Pastes", id: "pref-pastes" },
            { key: "url" as PrefKey, label: "Short URL", id: "pref-shorturl" },
        ],
        []
    );

    const handleChange = (key: keyof UrlPreferences, value: UrlType | null) => {
        setPreferences((prev) => ({
            ...(prev as UrlPreferences),
            [key]: value,
        }));
    };

    const saveSettings = async () => {
        if (!preferences) return;
        try {
            setSaving(true);
            const saved = await saveUserUrlPreferencesSettings(user.apiKey, preferences);
            if (saved) {
                okToast("Settings saved");
                router.refresh();
            } else {
                errorToast("Failed to save settings");
            }
        } catch {
            errorToast("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (!preferences) return <LoadingPage />

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                <h2 className="text-lg font-semibold mb-2">URL Preferences</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {fields.map(({ key, label, id }) => (
                        <div key={String(key)} className="flex flex-col gap-1">
                            <label htmlFor={id} className="text-sm text-gray-400 font-medium">
                                {label}
                            </label>
                            <SelectMenu<UrlType>
                                id={id}
                                value={preferences[key]}
                                onChange={(v) => handleChange(key, v)}
                                options={urlOptions}
                                placeholder="Select preference"
                                includeNullOption={true}
                                nullLabel="None"
                                className="w-full"
                            />
                        </div>
                    ))}
                </div>

                <div className="flex justify-end mt-8">
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-green-800 bg-green-600 text-white text-sm font-semibold shadow-md transition-all duration-200 ${
                            saving ? "opacity-70 cursor-not-allowed" : "hover:bg-green-700 hover:scale-[1.04] active:scale-95"
                        }`}
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </>
    )
}