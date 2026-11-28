import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readProjectFile(path) {
    return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

const designCss = readProjectFile("css/design-system.css");
const designGuide = readProjectFile("docs/design-system.md");
const eventCss = readProjectFile("css/events.css");
const squashCss = readProjectFile("css/squash.css");
const serverCss = readProjectFile("css/servers.css");
const eventPage = readProjectFile("src/components/EventsPage.vue");
const votingPage = readProjectFile("src/components/NominationsPage.vue");
const serverPage = readProjectFile("src/components/ServersPage.vue");
const menuCss = readProjectFile("css/menu.css");
const profileCss = readProjectFile("css/profile.css");
const pagesCss = readProjectFile("css/pages.css");
const nominationCss = readProjectFile("css/nominations.css");
const notificationCss = readProjectFile("css/notifications.css");
const friendsCss = readProjectFile("css/friends.css");
const componentsCss = readProjectFile("css/components.css");

test("the four typography roles scale fluidly with a rem baseline", () => {
    assert.match(designCss, /--app-font-size-small:\s*clamp\(0\.75rem,/);
    assert.match(designCss, /--app-font-size-normal:\s*clamp\(1rem,\s*calc\(0\.94rem \+ 0\.34vw\),\s*1\.1875rem\)/);
    assert.match(designCss, /--app-font-size-large:\s*clamp\(1\.125rem,\s*calc\(1\.07rem \+ 0\.42vw\),\s*1\.375rem\)/);
    assert.match(designCss, /--app-font-size-display:\s*clamp\(1\.5rem,/);
    assert.match(designGuide, /четыре плавные роли/);
    assert.match(designGuide, /Обычный[\s\S]*примерно 16–19 px/);
});

test("descriptions use bold large text while metadata remains small and regular", () => {
    const description = designCss.match(/\.app-description\s*\{([^}]+)\}/);
    const metadata = designCss.match(/\.app-meta\s*\{([^}]+)\}/);
    assert.ok(description);
    assert.ok(metadata);
    assert.match(description[1], /font-size:\s*var\(--app-font-size-large\)/);
    assert.match(description[1], /font-weight:\s*var\(--app-font-weight-bold\)/);
    assert.match(metadata[1], /font-size:\s*var\(--app-font-size-small\)/);
    assert.match(metadata[1], /font-weight:\s*var\(--app-font-weight-regular\)/);
});

test("event descriptions are large while dates and countdowns stay small", () => {
    assert.match(eventPage, /class="event-card-description app-description"/);
    assert.match(eventPage, /class="event-card-meta app-meta"/);
    const metaBlocks = [...eventCss.matchAll(/\.event-card-meta\s*\{([^}]+)\}/g)];
    assert.ok(metaBlocks.length >= 1);
    for (const match of metaBlocks) {
        assert.doesNotMatch(match[1], /(?:font-size|font-weight|line-height|color)\s*:/);
    }
    assert.match(eventCss, /\.event-countdown-value,\s*\.event-countdown-unit\s*\{\s*color:\s*inherit;\s*font:\s*inherit;/);
    assert.match(eventCss, /\.event-card-title\s*\{[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
});

test("SQUASH subtitle and date use description and metadata roles respectively", () => {
    assert.match(votingPage, /class="squash-hero-subtitle app-description"/);
    assert.match(votingPage, /class="squash-hero-date app-meta"/);
    const dateBlock = squashCss.match(/\.squash-hero-date\s*\{([^}]+)\}/);
    assert.ok(dateBlock);
    assert.doesNotMatch(dateBlock[1], /(?:font-size|font-weight|letter-spacing|line-height|color)\s*:/);
    assert.match(squashCss, /\.squash-details-message\s*\{[^}]*font-size:\s*var\(--app-font-size-normal\)/s);
    assert.match(squashCss, /\.squash-details-message\s*\{[^}]*font-weight:\s*var\(--app-font-weight-regular\)/s);
});

test("server title scales within its card, is bold, and its description uses the large role", () => {
    assert.match(serverPage, /class="server-card-subtitle app-description"/);
    assert.match(serverPage, /:title="server\.name"/);
    assert.match(serverCss, /--app-font-size-display:\s*clamp\(var\(--app-font-size-large\),\s*4\.8cqi,/);
    assert.match(serverCss, /\.server-card-title\s*\{[^}]*text-overflow:\s*ellipsis/s);
    assert.match(serverCss, /\.server-card-title\s*\{[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.equal((serverCss.match(/\.server-card-subtitle\s*\{/g) || []).length, 1);
});

test("large and display roles are bold across primary interface components", () => {
    assert.match(pagesCss, /\.section-page-title\s*\{[^}]*font-size:\s*var\(--app-font-size-display\)[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(menuCss, /\.menu-panel-title\s*\{[^}]*font-size:\s*var\(--app-font-size-display\)[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(menuCss, /\.menu-item-label\s*\{[^}]*font-size:\s*var\(--app-font-size-large\)[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(profileCss, /\.profile-nickname\s*\{[^}]*font-size:\s*var\(--app-font-size-large\)[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(profileCss, /\.profile-telegram-tag\s*\{[^}]*font-size:\s*var\(--app-font-size-normal\)/s);
    assert.match(friendsCss, /\.friend-card-tag\s*\{[^}]*font-size:\s*var\(--app-font-size-normal\)/s);
    assert.match(serverCss, /\.server-details-label\s*\{[^}]*font-size:\s*var\(--app-font-size-normal\)/s);
    assert.match(nominationCss, /\.vote-nomination-title\s*\{[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(notificationCss, /\.app-notification__title\s*\{[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(friendsCss, /\.friend-card-name\s*\{[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(componentsCss, /\.ui-button\s*\{[^}]*font-weight:\s*var\(--app-button-font-weight\)/s);
    assert.match(designCss, /--app-button-font-weight:\s*var\(--app-font-weight-bold\)/);
});

test("the application uses exactly four font-size tokens and avoids mid-word wrapping", () => {
    const stylesheets = [
        "css/base.css", "css/components.css", "css/design-system.css", "css/events.css",
        "css/friends.css", "css/layout.css", "css/menu.css", "css/nominations.css",
        "css/nominations-cards.css", "css/nominations-carousel.css", "css/nominations-picker.css",
        "css/notifications.css", "css/pages.css", "css/profile.css", "css/servers.css", "css/squash.css"
    ];
    const allowed = /^var\(--app-font-size-(?:small|normal|large|display)\)$|^inherit$/;
    for (const path of stylesheets) {
        const css = readProjectFile(path);
        assert.doesNotMatch(css, /--app-font-size-(?!small\b|normal\b|large\b|display\b)[A-Za-z0-9_-]+/);
        for (const match of css.matchAll(/font-size\s*:\s*([^;]+);/g)) {
            assert.match(match[1].trim(), allowed, path + " has an unapproved font size: " + match[0]);
        }
        assert.doesNotMatch(css, /overflow-wrap:\s*anywhere|word-break:\s*break-all/);
    }
});

test("font weights use regular, medium and bold semantic tokens", () => {
    assert.match(designCss, /--app-font-weight-regular:\s*400/);
    assert.match(designCss, /--app-font-weight-medium:\s*500/);
    assert.match(designCss, /--app-font-weight-bold:\s*700/);
    assert.doesNotMatch(designCss, /--app-font-weight-(?:semibold|display|subtle|normal)\b/);
    assert.doesNotMatch(designCss, /font-weight:\s*(?:600|700|800|900|950)\b/);
});

test("server page resets expanded gallery state whenever navigation leaves it", () => {
    assert.match(serverPage, /window\.addEventListener\("splitevents:menu-page", handleMenuPageChange\)/);
    assert.match(serverPage, /window\.removeEventListener\("splitevents:menu-page", handleMenuPageChange\)/);
    assert.match(serverPage, /if \(event\.detail\?\.page !== "servers"\)\s*\{\s*resetServerPageState\(\);/);
});
