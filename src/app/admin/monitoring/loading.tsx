import Surface from "@/components/ui/Surface";
import ResourceList from "@/components/ui/ResourceList";

export default function MonitoringLoading() {
    return (
        <div aria-label="Loading event monitoring" className="animate-pulse space-y-3">
            <div className="h-12 w-64 rounded bg-zinc-900" />
            <Surface className="h-12" />
            <ResourceList>
                {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="h-16 border-b border-zinc-800 bg-zinc-900/40" />
                ))}
                <div className="h-10" />
            </ResourceList>
        </div>
    );
}
