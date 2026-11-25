/* Shared accessible empty-state page renderer. */
const SVG_NS = "http://www.w3.org/2000/svg";

const iconDefinitions = {
    events: [
        ["path", { d: "M4 7L7 3L10 7L13 3L16 7L19 3L21 6" }],
        ["path", { d: "M3 7H21V20H3Z" }],
        ["path", { d: "M3 12H21" }],
        ["path", { d: "M8 12V20" }],
        ["path", { d: "M16 12V20" }]
    ],
    servers: [
        ["path", { d: "M6.5 9H17.5C19.1 9 20.3 10.2 20.7 11.7L22 16.5C22.5 18.5 20.3 19.9 18.8 18.6L15.7 16H8.3L5.2 18.6C3.7 19.9 1.5 18.5 2 16.5L3.3 11.7C3.7 10.2 4.9 9 6.5 9Z" }],
        ["path", { d: "M7 11.5V15.5M5 13.5H9" }],
        ["circle", { cx: "16.2", cy: "12.5", r: "0.8", fill: "currentColor", stroke: "none" }],
        ["circle", { cx: "18.3", cy: "14.5", r: "0.8", fill: "currentColor", stroke: "none" }]
    ]
};

function createIcon(type) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.6");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    const shapes = iconDefinitions[type] || iconDefinitions.events;
    shapes.forEach(([tagName, attributes]) => {
        const shape = document.createElementNS(SVG_NS, tagName);
        Object.entries(attributes).forEach(([name, value]) => {
            shape.setAttribute(name, value);
        });
        svg.appendChild(shape);
    });

    return svg;
}

export function renderEmptyState(container, options) {
    const page = document.createElement("div");
    page.className = "section-page";

    const header = document.createElement("header");
    header.className = "section-page-header";

    const title = document.createElement("h1");
    title.className = "section-page-title";
    title.textContent = options.title;

    header.appendChild(title);

    const card = document.createElement("section");
    card.className = "empty-state-card";
    card.setAttribute("role", "status");
    card.setAttribute("aria-live", "polite");

    const icon = document.createElement("div");
    icon.className = "empty-state-icon";
    icon.appendChild(createIcon(options.icon));

    const message = document.createElement("p");
    message.className = "empty-state-message";
    message.textContent = options.message;

    const note = document.createElement("p");
    note.className = "empty-state-note";
    note.textContent = options.note;

    card.append(icon, message, note);
    page.append(header, card);
    container.replaceChildren(page);
}
