import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readProjectFile(path) {
    return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

const designCss = readProjectFile("css/design-system.css");
const baseCss = readProjectFile("css/base.css");
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
const nominationCardsCss = readProjectFile("css/nominations-cards.css");
const nominationPickerCss = readProjectFile("css/nominations-picker.css");
const nominationCarouselCss = readProjectFile("css/nominations-carousel.css");
const notificationCss = readProjectFile("css/notifications.css");
const friendsCss = readProjectFile("css/friends.css");
const componentsCss = readProjectFile("css/components.css");

test("the six typography roles scale fluidly from a fixed 16px rem baseline", () => {
    assert.match(baseCss, /html\s*\{[^}]*font-size:\s*16px;[^}]*-webkit-text-size-adjust:\s*100%;[^}]*text-size-adjust:\s*100%;/s);
    assert.match(designCss, /--app-font-size-small:\s*clamp\(0\.75rem,/);
    assert.match(designCss, /--app-font-size-normal:\s*clamp\(1rem,/);
    assert.match(designCss, /--app-font-size-control:\s*clamp\(1rem,/);
    assert.match(designCss, /--app-line-height-control:\s*1\.3/);
    assert.match(designCss, /--app-font-size-control-compact:\s*clamp\(0\.875rem,/);
    assert.match(designCss, /--app-line-height-control-compact:\s*1\.25/);
    assert.match(designCss, /--app-font-size-large:\s*clamp\(1\.125rem,/);
    assert.match(designCss, /--app-font-size-display:\s*clamp\(1\.5rem,/);
    assert.match(designCss, /--app-font-size-hero:\s*clamp\(2\.4rem,\s*calc\(2\.08rem \+ 1\.6vw\),\s*3\.6rem\)/);
    assert.match(designCss, /\.app-heading-hero\s*\{[^}]*font-size:\s*var\(--app-font-size-hero\)/s);
    assert.match(designCss, /\.app-heading-hero\s*\{[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(designGuide, /шесть семантических ролей/);
    assert.match(designGuide, /ровно \*\*1,6× титульного\*\*/);
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

test("event title and description are never line-clamped or hidden", () => {
    const card = eventCss.match(/\.event-card\s*\{([^}]+)\}/);
    const title = eventCss.match(/\.event-card-title\s*\{([^}]+)\}/);
    const description = eventCss.match(/\.event-card-description\s*\{([^}]+)\}/);
    assert.ok(card && title && description);
    assert.match(card[1], /min-height:\s*250px/);
    assert.match(card[1], /height:\s*auto/);
    assert.doesNotMatch(card[1], /aspect-ratio:/);
    assert.doesNotMatch(title[1], /line-clamp|text-overflow|overflow:\s*hidden/);
    assert.doesNotMatch(description[1], /line-clamp|text-overflow|overflow:\s*hidden/);
    assert.match(eventPage, /class="event-card-title app-heading-hero"/);
    assert.doesNotMatch(eventCss.match(/\.event-card-title\s*\{([^}]+)\}/)[1], /font-size\s*:/);
    assert.match(eventCss, /\.event-card-title\s*\{[^}]*width:\s*100%;[^}]*text-align:\s*center;/s);
    assert.match(eventCss, /@media \(max-width: 640px\)[\s\S]*?\.event-card-artwork\s*\{[^}]*width:\s*42%;[\s\S]*?\.event-card-content\s*\{[^}]*width:\s*58%;/);
    assert.match(serverCss, /\.server-card-title\s*\{[^}]*text-wrap:\s*balance;/s);
    assert.match(serverPage, /class="server-card-title app-heading-hero"/);
    assert.match(eventCss, /\.event-card-actions\s*\{[^}]*width:\s*100%;/s);
    assert.match(eventPage, /class="event-card-description app-description"/);
    assert.match(eventPage, /class="event-card-meta app-meta"/);
});

test("SQUASH masthead uses the shared hero role and its date remains small", () => {
    assert.match(votingPage, /class="squash-hero-title app-heading-hero"/);
    assert.match(votingPage, /class="squash-hero-subtitle app-description"/);
    assert.match(votingPage, /class="squash-hero-date app-meta"/);
    const dateBlock = squashCss.match(/\.squash-hero-date\s*\{([^}]+)\}/);
    assert.ok(dateBlock);
    assert.doesNotMatch(dateBlock[1], /(?:font-size|font-weight|letter-spacing|line-height|color)\s*:/);
    assert.match(squashCss, /\.squash-hero-title\s*\{[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(squashCss, /\.squash-hero-title\.app-heading-hero\s*\{[^}]*line-height:\s*\.92/s);
    assert.match(squashCss, /\.squash-hero-subtitle\s*\{[^}]*text-align:\s*left/s);
});

test("server titles use the hero role and their text contributes to card height", () => {
    const title = serverCss.match(/\.server-card-title\s*\{([^}]+)\}/);
    const content = serverCss.match(/\.server-card-content\s*\{([^}]+)\}/);
    assert.ok(title && content);
    assert.match(serverPage, /class="server-card-title app-heading-hero"/);
    assert.match(title[1], /text-wrap:\s*balance/);
    assert.doesNotMatch(title[1], /text-overflow:\s*ellipsis|white-space:\s*nowrap|overflow:\s*hidden/);
    assert.match(content[1], /position:\s*relative/);
    assert.match(content[1], /grid-row:\s*1/);
});

test("profile name and Telegram tag use a compact natural-height row", () => {
    const row = profileCss.match(/\.profile-name-row\s*\{([^}]+)\}/);
    const nickname = profileCss.match(/\.profile-nickname\s*\{([^}]+)\}/);
    const edit = profileCss.match(/\.profile-edit-button\s*\{([^}]+)\}/);
    const tag = profileCss.match(/\.profile-telegram-tag\s*\{([^}]+)\}/);
    assert.ok(row && nickname && edit && tag);
    assert.match(row[1], /min-height:\s*28px/);
    assert.match(nickname[1], /height:\s*auto/);
    assert.match(edit[1], /position:\s*absolute/);
    assert.match(edit[1], /translate:\s*0 -50%/);
    assert.match(tag[1], /margin:\s*var\(--app-content-gap-tight\) 0 0/);
});

test("server detail labels are large, while capsule values stay normal", () => {
    const label = serverCss.match(/\.server-details-label\s*\{([^}]+)\}/);
    const badge = serverCss.match(/\.server-details-grid \.menu-item-badge\s*\{([^}]+)\}/);
    assert.ok(label && badge);
    assert.match(label[1], /font-size:\s*var\(--app-font-size-large\)/);
    assert.match(label[1], /font-weight:\s*var\(--app-font-weight-bold\)/);
    assert.match(badge[1], /font-size:\s*var\(--app-font-size-normal\)/);
    assert.match(badge[1], /font-weight:\s*var\(--app-font-weight-regular\)/);
    assert.match(serverCss, /grid-auto-rows:\s*minmax\(var\(--app-space-11\),\s*auto\)/);
    assert.match(serverCss, /grid-template-columns:\s*minmax\(0, 0\.9fr\) minmax\(0, 1\.1fr\)/);
    assert.match(serverCss, /\.server-details-grid \.menu-item-badge\s*\{[^}]*overflow-wrap:\s*anywhere/s);
    assert.match(serverCss, /\.server-details-ip-button\s*\{[^}]*min-height:\s*var\(--app-space-11\)/s);
    assert.match(serverCss, /\.server-details-download\s*\{[^}]*min-height:\s*var\(--app-space-11\)/s);
});

test("voting buttons wrap and candidate cards can grow to fit labels", () => {
    const button = nominationCss.match(/\.vote-button\s*\{([^}]+)\}/);
    const suggestion = nominationCss.match(/\.vote-suggest-text\s*\{([^}]+)\}/);
    assert.ok(button && suggestion);
    assert.match(button[1], /min-height:\s*var\(--app-control-height\)/);
    assert.match(button[1], /height:\s*auto/);
    assert.match(button[1], /text-wrap:\s*balance/);
    assert.match(suggestion[1], /overflow:\s*visible/);
    assert.doesNotMatch(suggestion[1], /max-height|overflow:\s*hidden/);
    assert.match(nominationCss, /\.vote-add-card \.vote-candidate-name--label\s*\{[^}]*font-size:\s*var\(--app-font-size-normal\)[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(nominationCss, /\.vote-button\s*\{[^}]*height:\s*auto;[^}]*font-size:\s*var\(--app-font-size-control\)/s);
    assert.match(nominationCss, /@media \(max-width:\s*380px\)[\s\S]*?\.vote-button\s*\{[^}]*font-size:\s*var\(--app-font-size-control\)/);
    assert.match(nominationPickerCss, /\.vote-dialog \.vote-candidate-card > \.vote-button\s*\{[^}]*min-height:\s*var\(--app-control-height\)[^}]*font-size:\s*var\(--app-font-size-control-compact\)/s);
    assert.match(nominationPickerCss, /\.vote-dialog \.vote-grid > \.vote-candidate-card\s*\{[^}]*height:\s*auto/s);
    assert.match(votingPage, /предложить вариант/);
    assert.doesNotMatch(votingPage, /предложить другое/);
    assert.match(votingPage, /добавить номинанта/);
    assert.match(nominationCardsCss, /\.vote-nomination-card\.vote-carousel-card \.vote-nomination-content \.vote-action-button\s*\{[^}]*min-height:\s*var\(--app-control-height\)/s);
    assert.match(nominationCarouselCss, /\.vote-nomination-card\.vote-carousel-card\s*\{[^}]*height:\s*280px/s);
});

test("the shared text button supports natural height and wrapping", () => {
    const button = componentsCss.match(/\.ui-button\s*\{([^}]+)\}/);
    assert.ok(button);
    assert.match(button[1], /height:\s*auto/);
    assert.match(button[1], /font-size:\s*var\(--app-font-size-control\)/);
    assert.match(button[1], /line-height:\s*var\(--app-line-height-control\)/);
    assert.match(button[1], /min-height:\s*var\(--app-control-height\)/);
    assert.match(button[1], /white-space:\s*normal/);
    assert.match(button[1], /text-wrap:\s*balance/);
});

test("large and display roles stay bold across primary interface components", () => {
    assert.match(pagesCss, /\.section-page-title\s*\{[^}]*font-size:\s*var\(--app-font-size-display\)[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(menuCss, /\.menu-panel-title\s*\{[^}]*font-size:\s*var\(--app-font-size-display\)[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(menuCss, /\.menu-item-label\s*\{[^}]*font-size:\s*var\(--app-font-size-large\)[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(profileCss, /\.profile-nickname\s*\{[^}]*font-size:\s*var\(--app-font-size-large\)[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(profileCss, /\.profile-telegram-tag\s*\{[^}]*font-size:\s*var\(--app-font-size-normal\)/s);
    assert.match(friendsCss, /\.friend-card-tag\s*\{[^}]*font-size:\s*var\(--app-font-size-normal\)/s);
    assert.match(nominationCss, /\.vote-nomination-title\s*\{[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(notificationCss, /\.app-notification__title\s*\{[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(friendsCss, /\.friend-card-name\s*\{[^}]*font-weight:\s*var\(--app-font-weight-bold\)/s);
    assert.match(componentsCss, /\.ui-button\s*\{[^}]*font-weight:\s*var\(--app-button-font-weight\)/s);
    assert.match(designCss, /--app-button-font-weight:\s*var\(--app-font-weight-bold\)/);
});

test("all CSS font sizes use one of the six semantic tokens", () => {
    const stylesheets = [
        "css/base.css", "css/components.css", "css/design-system.css", "css/events.css",
        "css/friends.css", "css/layout.css", "css/menu.css", "css/nominations.css",
        "css/nominations-cards.css", "css/nominations-carousel.css", "css/nominations-picker.css",
        "css/notifications.css", "css/pages.css", "css/profile.css", "css/servers.css", "css/squash.css"
    ];
    const allowed = /^var\(--app-font-size-(?:small|normal|control-compact|control|large|display|hero)\)$|^inherit$/;
    for (const path of stylesheets) {
        const css = readProjectFile(path);
        assert.doesNotMatch(css, /--app-font-size-(?!small\b|normal\b|control-compact\b|control\b|large\b|display\b|hero\b)[A-Za-z0-9_-]+/);
        for (const match of css.matchAll(/font-size\s*:\s*([^;]+);/g)) {
            assert.match(match[1].trim(), allowed, path + " has an unapproved font size: " + match[0]);
        }
        assert.doesNotMatch(css, /word-break:\s*break-all/);
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
