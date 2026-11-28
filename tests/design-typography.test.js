import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
    return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

const design = read("css/design-system.css");
const guide = read("docs/design-system.md");

const stylesheets = [
    "css/base.css", "css/components.css", "css/design-system.css", "css/events.css",
    "css/friends.css", "css/layout.css", "css/menu.css", "css/nominations.css",
    "css/nominations-cards.css", "css/nominations-carousel.css", "css/nominations-picker.css",
    "css/notifications.css", "css/pages.css", "css/profile.css", "css/servers.css", "css/squash.css"
];

test("four typography roles use smooth, zoom-friendly fluid ranges", () => {
    assert.match(design, /--app-font-size-small:\s*clamp\(0\.75rem, calc\(0\.72rem \+ 0\.18vw\), 0\.875rem\)/);
    assert.match(design, /--app-font-size-regular:\s*clamp\(0\.875rem, calc\(0\.84rem \+ 0\.2vw\), 1rem\)/);
    assert.match(design, /--app-font-size-large:\s*clamp\(1rem, calc\(0\.94rem \+ 0\.3vw\), 1\.25rem\)/);
    assert.match(design, /--app-font-size-title:\s*clamp\(1\.5rem, calc\(1\.1rem \+ 1\.6vw\), 3rem\)/);
    for (const role of ["мелкий", "обычный", "крупный", "титульный"]) assert.match(guide, new RegExp(role));
    assert.doesNotMatch(design, /--app-font-size-(?:heading|main|accent)\b/);
});

test("descriptions and event metadata use large and small roles respectively", () => {
    const description = design.match(/\.app-description\s*\{([^}]+)\}/);
    const small = design.match(/\.app-description--small\s*\{([^}]+)\}/);
    assert.ok(description);
    assert.ok(small);
    assert.match(description[1], /font-size:\s*var\(--app-font-size-large\)/);
    assert.match(small[1], /font-size:\s*var\(--app-font-size-small\)/);
    assert.match(read("src/components/EventsPage.vue"), /class="event-card-meta app-description app-description--small"/);
    assert.match(read("src/components/EventsPage.vue"), /class="event-card-description app-description"/);
    assert.match(read("src/components/NominationsPage.vue"), /class="squash-hero-date app-description app-description--small"/);
});

test("semantic components are assigned to the requested hierarchy", () => {
    assert.match(read("css/pages.css"), /\.section-page-title\s*\{[^}]*font-size:\s*var\(--app-font-size-title\)/s);
    assert.match(read("css/menu.css"), /\.menu-panel-title\s*\{[^}]*font-size:\s*var\(--app-font-size-title\)/s);
    assert.match(read("css/components.css"), /\.ui-button\s*\{[^}]*font-size:\s*var\(--app-font-size-large\)/s);
    assert.match(read("css/menu.css"), /\.menu-item-label\s*\{[^}]*font-size:\s*var\(--app-font-size-large\)/s);
    assert.match(read("css/profile.css"), /\.profile-telegram-tag\s*\{[^}]*font-size:\s*var\(--app-font-size-regular\)/s);
    assert.match(read("css/servers.css"), /\.server-card-details\s*\{[^}]*container-type:\s*inline-size/s);
    assert.match(read("css/events.css"), /\.event-card-content\s*\{[^}]*container-type:\s*inline-size/s);
});

test("all CSS font sizes come from the four semantic tokens", () => {
    const allowed = /^var\(--app-font-size-(?:small|regular|large|title)\)$|^inherit$/;
    for (const path of stylesheets) {
        const css = read(path);
        assert.doesNotMatch(css, /--app-font-size-(?!small\b|regular\b|large\b|title\b)[A-Za-z0-9_-]+/);
        for (const match of css.matchAll(/font-size\s*:\s*([^;]+);/g)) {
            assert.match(match[1].trim(), allowed, `${path} contains an unapproved font size: ${match[0]}`);
        }
    }
});

test("all text weights are regular and no bold emphasis is rendered", () => {
    assert.match(design, /--app-font-weight-(?:regular|medium|semibold|bold|subtle|normal|display):\s*400/);
    assert.match(design, /--app-button-font-weight:\s*400/);
    assert.match(design, /strong,\s*b\s*\{\s*font-weight:\s*var\(--app-font-weight-regular\);/);
    for (const path of stylesheets) {
        const css = read(path);
        assert.doesNotMatch(css, /font-weight\s*:\s*(?:bold|[5-9]00|[5-9]50)\s*;/i, `${path} must not use bold weights`);
    }
});

test("server description remains a single shared style and gallery reset stays intact", () => {
    assert.match(read("src/components/ServersPage.vue"), /class="server-card-subtitle app-description"/);
    assert.equal((read("css/servers.css").match(/\.server-card-subtitle\s*\{/g) || []).length, 1);
    const component = read("src/components/ServersPage.vue");
    assert.match(component, /window\.addEventListener\("splitevents:menu-page", handleMenuPageChange\)/);
    assert.match(component, /window\.removeEventListener\("splitevents:menu-page", handleMenuPageChange\)/);
});
