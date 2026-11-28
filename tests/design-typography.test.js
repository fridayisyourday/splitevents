import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
    return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

const design = read("css/design-system.css");
const guide = read("docs/design-system.md");
const cssFiles = [
    "css/base.css", "css/components.css", "css/design-system.css", "css/events.css",
    "css/friends.css", "css/layout.css", "css/menu.css", "css/nominations.css",
    "css/nominations-cards.css", "css/nominations-carousel.css", "css/nominations-picker.css",
    "css/notifications.css", "css/pages.css", "css/profile.css", "css/servers.css", "css/squash.css"
];

test("the typography system defines exactly four fluid responsive roles", () => {
    assert.match(design, /--app-font-size-small:\s*clamp\(0\.75rem, calc\(0\.72rem \+ 0\.12vw\), 0\.875rem\)/);
    assert.match(design, /--app-font-size-normal:\s*clamp\(0\.875rem, calc\(0\.82rem \+ 0\.18vw\), 1rem\)/);
    assert.match(design, /--app-font-size-large:\s*clamp\(1rem, calc\(0\.94rem \+ 0\.35vw\), 1\.25rem\)/);
    assert.match(design, /--app-font-size-title:\s*clamp\(1\.5rem, calc\(1\.25rem \+ 1\.8vw\), 3rem\)/);
    assert.doesNotMatch(design, /--app-font-size-(?:heading|main|accent)\b/);
    assert.match(guide, /мелкий, обычный, крупный и титульный/);
    assert.match(guide, /regular 400/);
});

test("semantic roles are assigned to the correct interface elements", () => {
    assert.match(design, /\.app-description,[\s\S]*?font-size:\s*var\(--app-font-size-large\)/);
    assert.match(design, /\.menu-item,[\s\S]*?font-size:\s*var\(--app-font-size-large\)/);
    assert.match(design, /\.section-page-title,[\s\S]*?font-size:\s*var\(--app-font-size-title\)/);
    assert.match(design, /button,[\s\S]*?font-size:\s*var\(--app-font-size-large\)/);
    assert.match(design, /\.event-card-meta,[\s\S]*?font-size:\s*var\(--app-font-size-small\)/);
    assert.match(design, /\.profile-telegram-tag,[\s\S]*?font-size:\s*var\(--app-font-size-normal\)/);
    assert.match(read("src/components/EventsPage.vue"), /class="event-card-meta app-description"/);
    assert.match(read("src/components/ServersPage.vue"), /class="server-card-subtitle app-description"/);
});

test("all CSS font sizes use only the four semantic tokens or inherit", () => {
    const allowed = /^var\(--app-font-size-(?:small|normal|large|title)\)$|^inherit$/;
    for (const path of cssFiles) {
        const css = read(path);
        assert.doesNotMatch(css, /--app-font-size-(?!small\b|normal\b|large\b|title\b)[A-Za-z0-9_-]+/);
        for (const match of css.matchAll(/font-size\s*:\s*([^;]+);/g)) {
            assert.match(match[1].trim(), allowed, path + " has an unapproved font size: " + match[0]);
        }
    }
});

test("the whole interface uses regular weight without bold variants", () => {
    for (const path of cssFiles) {
        const css = read(path);
        assert.doesNotMatch(css, /--app-font-weight-(?:medium|semibold|bold|subtle|normal|display)\b/);
        for (const match of css.matchAll(/font-weight\s*:\s*([^;]+);/g)) {
            assert.match(match[1].trim(), /^(?:var\(--app-font-weight-regular\)|inherit|400|normal)$/);
        }
    }
    assert.match(design, /strong,[\s\S]*?b\s*\{\s*font-weight:\s*var\(--app-font-weight-regular\)/);
});

test("titles and names wrap at word boundaries instead of splitting mid-word", () => {
    assert.match(design, /\.section-page-title,[\s\S]*?overflow-wrap:\s*normal/);
    assert.match(design, /\.event-card-title\s*\{[\s\S]*?-webkit-line-clamp:\s*2/);
    assert.match(design, /\.server-card-title\s*\{[\s\S]*?text-overflow:\s*ellipsis/);
    assert.match(design, /\.vote-candidate-name\s*\{[\s\S]*?overflow-wrap:\s*normal/);
});

test("event date metadata remains small and countdown values inherit shared number styling", () => {
    assert.match(read("src/components/EventsPage.vue"), /class="event-card-meta app-description"/);
    assert.match(design, /\.event-card-meta,[\s\S]*?font-size:\s*var\(--app-font-size-small\)/);
    assert.match(read("css/events.css"), /\.event-countdown-value,[\s\S]*?font:\s*inherit/);
});

test("server gallery resets expanded state whenever navigation leaves the page", () => {
    const serverPage = read("src/components/ServersPage.vue");
    assert.match(serverPage, /window\.addEventListener\("splitevents:menu-page", handleMenuPageChange\)/);
    assert.match(serverPage, /window\.removeEventListener\("splitevents:menu-page", handleMenuPageChange\)/);
    assert.match(serverPage, /if \(event\.detail\?\.page !== "servers"\)\s*\{\s*resetServerPageState\(\);/);
});
