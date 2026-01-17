export function AnimatedCheckbox({ checked, onChange, label, id }: {
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
    id: string;
}) {
    return (
        <label htmlFor={id} className="flex items-center gap-2 cursor-pointer select-none group outline-none">
            <span className="relative">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="peer sr-only focus:outline-none"
                />
                <span className={`w-7 h-4 flex items-center rounded-full p-1 duration-300 bg-gray-600 peer-checked:bg-sky-500 transition-all`}>
                    <span className={`h-3 w-3 bg-white rounded-full duration-300 transform transition-all ${checked ? "translate-x-3 scale-110" : "scale-100"}`}></span>
                </span>
                <span
                    className="absolute inset-0 rounded-full peer-focus:ring-2 transition"
                    aria-hidden="true"
                />
            </span>
            <span className="text-base text-gray-300">{label}</span>
        </label>
    );
}