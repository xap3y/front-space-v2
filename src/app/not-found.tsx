'use client';

import Link from 'next/link';
import { FaArrowLeft } from "react-icons/fa6";
import "./globals.css";
import {FaHome} from "react-icons/fa";
import HoverDiv from "@/components/HoverDiv";

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
                    <Link href="/" className="inline-flex">
                        <HoverDiv icon={<FaHome className="h-4 w-4"/>} bg="white" text="black" className="px-6 py-2.5 text-sm font-medium">Home</HoverDiv>
                    </Link>
                    <HoverDiv onClick={() => window.history.back()} icon={<FaArrowLeft className="h-4 w-4"/>} bg="rgb(0 0 0 / .5)" text="white" className="px-6 py-2.5 text-sm font-medium">Back</HoverDiv>
                </div>
            </div>

            {/* Footer hint */}
            <div className="absolute bottom-8 text-gray-600 text-xs md:text-sm font-mono">
                404
            </div>
        </div>
    );
}
