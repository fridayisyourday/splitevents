/* Shared safe DOM and Lucide SVG icon construction helpers. */
const ICON_NAMES = new Set([
    "menu", "x", "house", "user-round", "ticket", "gamepad-2",
    "users-round", "calendar-clock", "plus", "loader-circle",
    "pencil", "check", "eye", "eye-off", "info",
    "chevron-left", "chevron-right"
]);

export function createElement(tagName, className = "", text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function createSvgElement(tagName, attributes = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    Object.entries(attributes).forEach(function ([name, value]) {
        node.setAttribute(name, value);
    });
    return node;
}

export function createIcon(name, className = "") {
    if (!ICON_NAMES.has(name)) {
        throw new RangeError("Unknown Lucide icon: " + name);
    }

    const classes = ["lucide-icon", className].filter(Boolean).join(" ");
    const svg = createSvgElement("svg", {
        class: classes,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "aria-hidden": "true",
        focusable: "false"
    });

    svg.appendChild(createSvgElement("use", {
        href: "#icon-" + name
    }));

    return svg;
}

export function createEyeIcon(isHidden) {
    return createIcon(isHidden ? "eye-off" : "eye");
}
