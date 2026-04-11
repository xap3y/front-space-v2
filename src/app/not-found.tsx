'use client';

import Link from 'next/link';
import { FaArrowLeft } from "react-icons/fa6";
import "./globals.css";
import {FaHome} from "react-icons/fa";

export default function NotFound() {
    return (
        <div className="w-screen min-h-screen bg-transparent flex flex-col items-center justify-center">
            {/* Content */}
            <div className="flex flex-col items-center justify-center gap-8 px-4 text-center max-w-2xl">
                {/* 404 Number */}
                <div className="space-y-3">
                    <h1 className="text-8xl md:text-9xl font-black text-white font-mono tracking-tighter">
                        404
                    </h1>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-300">
                        Page Not Found
                    </h2>
                </div>

                {/* Description */}
                <p className="max-w-lg text-gray-400 text-sm md:text-base leading-relaxed">
                    This page could not be found. It might have been removed or the URL might be incorrect.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-white text-black font-medium text-sm transition-all duration-200 hover:bg-gray-100 active:scale-95"
                    >
                        <FaHome className="w-4 h-4" />
                        Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-black/50 hover:bg-black/70 text-white font-medium text-sm border border-gray-700 transition-all duration-200 active:scale-95"
                    >
                        <FaArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                </div>
            </div>

            {/* Footer hint */}
            <div className="absolute bottom-8 text-gray-600 text-xs md:text-sm font-mono">
                404
            </div>
        </div>
    );
}