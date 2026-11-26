/* Shared safe DOM and SVG construction helpers. */
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

export function createEyeIcon(isHidden) {
    const svg = createSvgElement("svg", {
        viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
        "stroke-width": "1.8", "stroke-linecap": "round",
        "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false"
    });
    svg.appendChild(createSvgElement("path", {
        d: "M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12Z"
    }));
    if (isHidden) {
        svg.appendChild(createSvgElement("path", { d: "M4 4L20 20" }));
    } else {
        svg.appendChild(createSvgElement("circle", { cx: "12", cy: "12", r: "2.8" }));
    }
    return svg;
}
