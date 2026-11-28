import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readProjectFile(path) {
    return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

const designCss = readProjectFile("css/design-system.css");
const designGuide = readProjectFile("docs/design-system.md");
const stylesheets = [
    "css/base.css", "css/components.css", "css/design-system.css", "css/events.css",
    "css/friends.css", "css/layout.css", "css/menu.css", "css/nominations.css",
    "css/nominations-cards.css", "css/nominations-carousel.css", "css/nominations-picker.css",
    "css/notifications.css", "css/pages.css", "css/profile.css", "css/servers.css", "css/squash.css"
];

test("four new fluid typography roles exist and use rem plus viewport scaling", () => {
    assert.match(designCss, /--app-type-small:\s*clamp\(0\.75rem,\s*0\.72rem\s*\+\s*0\.2vw,\s*0\.875rem\)/);
    assert.match(designCss, /--app-type-normal:\s*clamp\(0\.875rem,\s*0\.82rem\s*\+\s*0\.45vw,\s*1rem\)/);
    assert.match(designCss, /--app-type-large:\s*clamp\(1rem,\s*0\.94rem\s*\+\s*0\.65vw,\s*1\.25rem\)/);
    assert.match(designCss, /--app-type-title:\s*clamp\(1\.25rem,\s*1rem\s*\+\s*2\.6vw,\s*3rem\)/);
    assert.doesNotMatch(designCss, /--app-font-size-(?:title|heading|main|accent)/);
    assert.match(designGuide, /Мелкий.*Обычный.*Крупный.*Титульный/s);
});

test("every stylesheet uses the new semantic roles or safe fluid component sizes", () => {
    for (const path of stylesheets) {
        const css = readProjectFile(path);
        assert.doesNotMatch(css, /--app-font-size-(?:title|heading|main|accent)/, path);
        for (const match of css.matchAll(/font-size\s*:\s*([^;]+);/g)) {
            const value = match[1].trim();
            assert.match(value, /^var\(--app-type-(?:small|normal|large|title)\)$|^inherit$|^clamp\(/,
                `${path} has an unapproved font-size: ${value}`);
        }
    }
});

test("no bold text is used across the app", () => {
    assert.match(designCss, /body,\s*body \*\s*\{\s*font-weight:\s*400 !important;/s);
    for (const path of stylesheets) {
        const css = readProjectFile(path);
        for (const match of css.matchAll(/font-weight\s*:\s*([^;]+);/g)) {
            const value = match[1].trim();
            assert.match(value, /^400$|^inherit$|^var\(--app-font-weight-[\w-]+\)$/,
                `${path} has non-regular font weight: ${value}`);
        }
    }
});

test("titles avoid breaking words and component headings adapt to their own card width", () => {
    assert.match(designCss, /\.event-card-title\s*\{[^}]*font-size:\s*clamp\([^}]+cqw/s);
    assert.match(designCss, /\.server-card-title\s*\{[^}]*font-size:\s*clamp\([^}]+cqw/s);
    assert.match(designCss, /body,\s*body \*\s*\{[^}]*overflow-wrap:\s*normal/s);
});

test("dates and timers use the smallest role, descriptions and menu controls use large", () => {
    assert.match(designCss, /\.event-card-meta,[\s\S]*?font-size:\s*var\(--app-type-small\)/);
    assert.match(designCss, /\.squash-countdown-title,[\s\S]*?font-size:\s*var\(--app-type-small\)/);
    assert.match(designCss, /\.app-description\s*\{[^}]*font-size:s*var\(--app-type-large\)/s);
    assert.match(designCss, /\.menu-item,[\s\S]*?font-size:s*var\(--app-type-large\)/);
});
