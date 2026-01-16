import humanBodySvgRaw from "../assets/imgs/HumanBodySvg/Body.svg?raw";
import { useState } from "react";

export default function HumanBody() {
    const [active, setActive] = useState(null);

    const handleClick = (e) => {
        const group = e.target.closest("g[id]");
        if (group) setActive(group.id);
    };


    return (
        <div className="w-[320px] mx-auto">
            {/* Inline SVG so <g id="..."> is targetable from CSS */}
            <div
                className="w-full organ-map"
                aria-label="Human body anatomy"
                role="img"
                // Safe here: static local SVG asset bundled with the app
                dangerouslySetInnerHTML={{ __html: humanBodySvgRaw }}
                onClick={handleClick} 
            />


            {active && (
                <div className="p-4 bg-white shadow rounded w-64">
                <h2 className="font-bold capitalize">{active}</h2>
                <p>Organ info here...</p>
                </div>
            )}
        </div>
    )
}