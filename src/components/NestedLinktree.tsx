import {LinkTreeProps} from "@/types/core";


export function NestedLinktree({ links, depth = 0 }: LinkTreeProps) {
    return (
        <div className={"ml-4"}>
            {links.map((link, index) => (
                <div key={index}>
                    {/* Node Content */}
                    <div className={`text-blue-600`}> {/* Add margin-bottom only for top-level nodes */}
                        <span className={"mr-1"}>{'|' + '-'.repeat(depth)}</span>
                        <a className={"no-underline hover:underline"} href={link.href}>
                            {link.label + "  (" + (link.href.startsWith("http") ? link.href.substring(8, 90) : link.href) + ")"}
                        </a>
                    </div>

                    {/* Render nested links */}
                    {link.links && link.links.length > 0 && (
                        <NestedLinktree links={link.links} depth={depth + 1} />
                    )}

                    {/* Add <hr> after each root-level node (including its nested links) */}
                    {depth === 0 && <hr className="my-2 border-gray-300" />} {/* Add <hr> only for root-level nodes */}
                </div>
            ))}
        </div>
    );
}