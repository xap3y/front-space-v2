"use client";

import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css'
import {useState} from "react";
import {FaCalendarAlt} from "react-icons/fa";

interface Props {
    onDateChangeAction: (from: Date, to: Date) => void;
}

export function DatePickerComp({onDateChangeAction}: Props) {

    const [fromDate, setFromDate] = useState<Date>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 9);
        return d;
    })
    const [toDate, setToDate] = useState<Date>(new Date());
    const [showPicker, setShowPicker] = useState<boolean>(false)

    const handleApply = () => {
        onDateChangeAction(fromDate, toDate)
        setShowPicker(false)
    }

    return (
        <>
            <div className="relative inline-block">
                <button
                    className="text-xl p-2 border-2 border-gray-400 rounded-lg flex items-center gap-2 font-bold"
                    onClick={() => setShowPicker(!showPicker)}
                >
                    <FaCalendarAlt /> Date
                </button>

                {showPicker && (
                    <div className="absolute top-full left-0 mt-2 bg-secondary border border-gray-300 rounded-lg p-4 shadow-lg z-50">
                        <div className="flex flex-col gap-2 select-none">
                            <div>
                                <span className="font-bold">From:</span>
                                <DatePicker className={"text-black"} selected={fromDate} onChange={(date: Date | null) => date && setFromDate(date)} />
                            </div>
                            <div>
                                <span className="font-bold ">To:</span>
                                <DatePicker className={"text-black"} selected={toDate} onChange={(date: Date | null) => date && setToDate(date)} />
                            </div>
                            <button
                                className="mt-2 bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                                onClick={handleApply}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
