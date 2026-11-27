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

test("shared descriptive copy typography has one documented source of truth", () => {
    const block = designCss.match(/\.app-description\s*\{([^}]+)\}/);
    assert.ok(block, "the shared .app-description rule must exist");
    assert.match(block[1], /font-size:\s*var\(--app-font-size-default\)/);
    assert.match(block[1], /font-weight:\s*var\(--app-font-weight-subtle\)/);
    assert.match(block[1], /line-height:\s*var\(--app-line-height-label\)/);
    assert.match(designGuide, /16 px/);
    assert.match(designGuide, /\.app-description/);
});

test("event description, date and countdown inherit the shared typography", () => {
    assert.match(eventPage, /class="event-card-description app-description"/);
    assert.match(eventPage, /class="event-card-meta app-description"/);

    const metaBlocks = [...eventCss.matchAll(/\.event-card-meta\s*\{([^}]+)\}/g)];
    assert.ok(metaBlocks.length >= 1);
    for (const match of metaBlocks) {
        assert.doesNotMatch(match[1], /(?:font-size|font-weight|line-height|color)\s*:/);
    }
    assert.match(eventCss, /\.event-countdown-value,\s*\.event-countdown-unit\s*\{\s*color:\s*inherit;\s*font:\s*inherit;/);
});

test("SQUASH hero subtitle and date share the exact same type style", () => {
    assert.match(votingPage, /class="squash-hero-subtitle app-description"/);
    assert.match(votingPage, /class="squash-hero-date app-description"/);

    const dateBlock = squashCss.match(/\.squash-hero-date\s*\{([^}]+)\}/);
    assert.ok(dateBlock);
    assert.doesNotMatch(dateBlock[1], /(?:font-size|font-weight|letter-spacing|line-height|color)\s*:/);
});

test("server description does not introduce a mobile-only typography override", () => {
    assert.match(serverPage, /class="server-card-subtitle app-description"/);
    assert.equal((serverCss.match(/\.server-card-subtitle\s*\{/g) || []).length, 1);
});

test("server page resets expanded gallery state whenever navigation leaves it", () => {
    assert.match(serverPage, /window\.addEventListener\("splitevents:menu-page", handleMenuPageChange\)/);
    assert.match(serverPage, /window\.removeEventListener\("splitevents:menu-page", handleMenuPageChange\)/);
    assert.match(serverPage, /if \(event\.detail\?\.page !== "servers"\)\s*\{\s*resetServerPageState\(\);/);
});
