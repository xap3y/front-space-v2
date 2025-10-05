"use client";

// @ts-ignore
import { EmbedVisualizer } from 'embed-visualizer'
import 'embed-visualizer/dist/index.css'

import { FaSave, FaPalette, FaUser, FaRegFileAlt, FaRegCommentDots } from "react-icons/fa";
import {UserObj} from "@/types/user";
import {useEffect, useState} from "react";
import {EmbedSettings} from "@/types/configs";
import {errorToast, getUserEmbedSettings, okToast, saveUserEmbedSettings} from "@/lib/client";
import {AnimatedCheckbox} from "@/components/sets/GlobalComponentSet";
import {useRouter} from "next/navigation";

function hexToInt(hex: string) {
    if (hex.startsWith("#")) {
        return parseInt(hex.replace("#", ""), 16);
    }
    return parseInt(hex, 16);
}

export default function EmbedTabContent({ user }: { user: UserObj }) {

    const router = useRouter();

    useEffect(() => {
        const getSettings = async () => {
            const settings = await getUserEmbedSettings(user.apiKey);
            console.log("Fetched embed settings: " + JSON.stringify(settings));
            // loop every settings value and if its null set to empty string
            if (!settings) return;

            for (const key in settings) {
                // @ts-ignore
                if (settings[key] == null) settings[key] = "";
            }

            if (settings) setEmbedSettings(settings);
        }
        getSettings();
    }, [user]);

    const [embedSettings, setEmbedSettings] = useState<EmbedSettings>({
        enabled: false,
        title: "",
        titleUrl: "",
        description: "",
        color: "#5865F2",
        authorName: ""
    });

    const handleEmbedChange = (key: keyof typeof embedSettings, value: string | boolean) => {
        setEmbedSettings(prev => ({ ...prev, [key]: value }));
    };

    const embed: any = {
        embed: {
            image: {
                url: "https://r3.xap3y.space/media/RSOY1YQB"
            }
        }};
    if (embedSettings.title) embed.embed.title = embedSettings.title;
    if (embedSettings.titleUrl) embed.embed.url = embedSettings.titleUrl;
    if (embedSettings.description) embed.embed.description = embedSettings.description;
    if (embedSettings.color) embed.embed.color = hexToInt(embedSettings.color);
    if (embedSettings.authorName) {
        embed.embed.author = {name: embedSettings.authorName || ""}
    }

    const handleSave = () => {
        const save = async () => {
            const res = await saveUserEmbedSettings(user!.apiKey, embedSettings);
            if (res) okToast("Saved")
            else errorToast("Failed to save")
            router.refresh()
        }
        save();
    };

    return (
        <>
            <div className="w-full flex flex-col md:flex-row gap-8 animate-fade-in">
                {/* Settings (left) */}
                <div className="flex-1 pr-0 md:pr-8">
                    <div className="flex items-center justify-between mb-4">
                        <AnimatedCheckbox
                            checked={embedSettings.enabled}
                            onChange={e => handleEmbedChange("enabled", e.target.checked)}
                            label="Enable Discord Embed"
                            id="embedEnabled"
                        />
                    </div>
                    {embedSettings.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                                    <FaRegFileAlt /> Title
                                </label>
                                <input
                                    type="text"
                                    className="px-3 py-2 rounded-lg border border-white/10 bg-primary text-sm focus:outline-none"
                                    value={embedSettings.title}
                                    onChange={e => handleEmbedChange("title", e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                                    <FaRegCommentDots /> Description
                                </label>
                                <input
                                    type="text"
                                    className="px-3 py-2 rounded-lg border border-white/10 bg-primary text-sm focus:outline-none"
                                    value={embedSettings.description}
                                    onChange={e => handleEmbedChange("description", e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                                    <FaUser /> Title URL
                                </label>
                                <input
                                    type="text"
                                    className="px-3 py-2 rounded-lg border border-white/10 bg-primary text-sm focus:outline-none"
                                    value={embedSettings.titleUrl}
                                    onChange={e => handleEmbedChange("titleUrl", e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                                    <FaUser /> Author Label
                                </label>
                                <input
                                    type="text"
                                    className="px-3 py-2 rounded-lg border border-white/10 bg-primary text-sm focus:outline-none"
                                    value={embedSettings.authorName}
                                    onChange={e => handleEmbedChange("authorName", e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                                    <FaPalette /> Color
                                </label>
                                <input
                                    type="color"
                                    className="w-12 h-10 border border-white/10 rounded focus:outline-none"
                                    value={embedSettings.color}
                                    onChange={e => handleEmbedChange("color", e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    {/* Save button */}
                    <div className="flex justify-end mt-8">
                        <button
                            onClick={handleSave}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-green-950 bg-green-600 hover:bg-green-700 transition-colors text-sm font-semibold shadow-md duration-200 text-white"
                        >
                            Save
                        </button>
                    </div>
                </div>
                {/* Divider */}
                <div className="hidden md:block w-px bg-primary-brighter mx-2" />

                {/* Preview (right) */}
                <div className="flex-1 mt-8 md:mt-0 md:ml-0 -ml-4 flex items-start justify-center">
                    {embedSettings.enabled && (
                        <div className="w-full max-w-lg">
                            <EmbedVisualizer
                                embed={embed}
                                onError={(e: any) =>
                                    console.error("Error while parsing embed:", e)
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}