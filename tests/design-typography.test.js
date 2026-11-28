import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
    return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

const designCss = read("css/design-system.css");
const designGuide = read("docs/design-system.md");
const eventCss = read("css/events.css");
const squashCss = read("css/squash.css");
const serverCss = read("css/servers.css");
const eventPage = read("src/components/EventsPage.vue");
const votingPage = read("src/components/NominationsPage.vue");
const serverPage = read("src/components/ServersPage.vue");

const stylesheets = [
    "css/base.css",
    "css/components.css",
    "css/design-system.css",
    "css/events.css",
    "css/friends.css",
    "css/layout.css",
    "css/menu.css",
    "css/nominations.css",
    "css/nominations-cards.css",
    "css/nominations-carousel.css",
    "css/nominations-picker.css",
    "css/notifications.css",
    "css/pages.css",
    "css/profile.css",
    "css/servers.css",
    "css/squash.css"
];

test("all four responsive typography roles have rem-based fluid ranges", () => {
    assert.match(designCss, /--app-font-size-small:\s*clamp\(0\.875rem,\s*calc\(0\.82rem\s*\+\s*0\.18vw\),\s*0\.9375rem\)/);
    assert.match(designCss, /--app-font-size-regular:\s*clamp\(1rem,\s*calc\(0\.94rem\s*\+\s*0\.2vw\),\s*1\.125rem\)/);
    assert.match(designCss, /--app-font-size-large:\s*clamp\(1\.125rem,\s*calc\(1\.02rem\s*\+\s*0\.32vw\),\s*1\.375rem\)/);
    assert.match(designCss, /--app-font-size-title:\s*clamp\(1\.75rem,\s*calc\(1\.5rem\s*\+\s*1vw\),\s*2\.5rem\)/);
    assert.match(designGuide, /мелкий 14–15 px/);
    assert.match(designGuide, /обычный 16–18 px/);
    assert.match(designGuide, /крупный 18–22 px/);
    assert.match(designGuide, /титульный 28–40 px/);
});

test("descriptions and metadata use separate large and small roles", () => {
    const description = designCss.match(/\.app-description\s*\{([^}]+)\}/);
    const metadata = designCss.match(/\.app-meta\s*\{([^}]+)\}/);
    assert.ok(description);
    assert.ok(metadata);
    assert.match(description[1], /font-size:\s*var\(--app-font-size-large\)/);
    assert.match(metadata[1], /font-size:\s*var\(--app-font-size-small\)/);
    assert.match(description[1], /font-weight:\s*var\(--app-font-weight-regular\)/);
    assert.match(metadata[1], /font-weight:\s*var\(--app-font-weight-regular\)/);
});

test("events use large descriptions and small date/countdown metadata", () => {
    assert.match(eventPage, /class="event-card-description app-description"/);
    assert.match(eventPage, /class="event-card-meta app-meta"/);
    const metaBlocks = [...eventCss.matchAll(/\.event-card-meta\s*\{([^}]+)\}/g)];
    assert.ok(metaBlocks.length >= 1);
    for (const match of metaBlocks) {
        assert.doesNotMatch(match[1], /(?:font-size|font-weight|line-height|color)\s*:/);
    }
    assert.match(eventCss, /\.event-countdown-value,\s*\.event-countdown-unit\s*\{\s*color:\s*inherit;\s*font:\s*inherit;/);
});

test("SQUASH subtitle and date use large and small roles respectively", () => {
    assert.match(votingPage, /class="squash-hero-subtitle app-description"/);
    assert.match(votingPage, /class="squash-hero-date app-meta"/);
    const heroTitle = squashCss.match(/\.squash-hero-title\s*\{([^}]+)\}/);
    assert.ok(heroTitle);
    assert.match(heroTitle[1], /font-size:\s*var\(--app-font-size-title\)/);
});

test("page headings, names and menu labels use their semantic roles", () => {
    assert.match(read("css/pages.css"), /\.section-page-title\s*\{[^}]*font-size:\s*var\(--app-font-size-title\)/s);
    assert.match(read("css/menu.css"), /\.menu-panel-title\s*\{[^}]*font-size:\s*var\(--app-font-size-title\)/s);
    assert.match(read("css/menu.css"), /\.menu-item-label\s*\{[^}]*font-size:\s*var\(--app-font-size-large\)/s);
    assert.match(read("css/profile.css"), /\.profile-nickname\s*\{[^}]*font-size:\s*var\(--app-font-size-large\)/s);
    assert.match(read("css/profile.css"), /\.profile-telegram-tag\s*\{[^}]*font-size:\s*var\(--app-font-size-regular\)/s);
    assert.match(read("css/friends.css"), /\.friend-card-name\s*\{[^}]*font-size:\s*var\(--app-font-size-large\)/s);
});

test("event, server and nomination card titles adapt to their own container width", () => {
    const contextualTitle = /font-size:\s*clamp\(var\(--app-font-size-large\),\s*8cqi,\s*var\(--app-font-size-title\)\)/;
    assert.match(eventCss, /\.event-card-title\s*\{[^}]*font-size:\s*clamp\(var\(--app-font-size-large\),\s*8cqi,\s*var\(--app-font-size-title\)\)/s);
    assert.match(serverCss, /\.server-card-title\s*\{[^}]*font-size:\s*clamp\(var\(--app-font-size-large\),\s*8cqi,\s*var\(--app-font-size-title\)\)/s);
    assert.match(read("css/nominations-cards.css"), /\.vote-nomination-card\s*\{[^}]*container-type:\s*inline-size/s);
    assert.match(read("css/nominations.css"), contextualTitle);
});

test("all stylesheets use only the four text roles or their bounded container-title formula", () => {
    const allowed = /^(?:var\(--app-font-size-(?:small|regular|large|title)\)|clamp\(var\(--app-font-size-large\),\s*8cqi,\s*var\(--app-font-size-title\)\)|inherit)$/;
    const legacy = /--app-font-size-(?!small\b|regular\b|large\b|title\b)[A-Za-z0-9_-]+/;

    for (const path of stylesheets) {
        const css = read(path);
        assert.doesNotMatch(css, legacy, path + " contains a legacy font-size token");
        for (const match of css.matchAll(/font-size\s*:\s*([^;]+);/g)) {
            assert.match(match[1].trim(), allowed, path + " has an unapproved font size: " + match[0]);
        }
    }
});

test("no bold weights are used anywhere in the style system", () => {
    const allowed = /^(?:var\(--app-font-weight-(?:regular|medium)\)|var\(--app-button-font-weight\)|inherit)$/;
    const legacy = /--app-font-weight-(?!regular\b|medium\b)[A-Za-z0-9_-]+/;

    for (const path of stylesheets) {
        const css = read(path);
        assert.doesNotMatch(css, legacy, path + " contains a legacy font-weight token");
        for (const match of css.matchAll(/font-weight\s*:\s*([^;]+);/g)) {
            assert.match(match[1].trim(), allowed, path + " has an unapproved font weight: " + match[0]);
        }
    }
    assert.match(designCss, /b,\s*strong\s*\{\s*font-weight:\s*inherit;/s);
    assert.match(designCss, /--app-button-font-weight:\s*var\(--app-font-weight-medium\)/);
});

test("server description and navigation lifecycle remain standardized", () => {
    assert.match(serverPage, /class="server-card-subtitle app-description"/);
    assert.equal((serverCss.match(/\.server-card-subtitle\s*\{/g) || []).length, 1);
    assert.match(serverPage, /window\.addEventListener\("splitevents:menu-page", handleMenuPageChange\)/);
    assert.match(serverPage, /window\.removeEventListener\("splitevents:menu-page", handleMenuPageChange\)/);
    assert.match(serverPage, /if \(event\.detail\?\.page !== "servers"\)\s*\{\s*resetServerPageState\(\);/);
});


test("the inner SQUASH section heading uses large, not title, typography", () => {
    assert.match(
        squashCss,
        /\.squash-details-title\s*\{[^}]*font-size:\s*var\(--app-font-size-large\)/s
    );
});
