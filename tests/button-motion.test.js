import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
    return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const design = read("css/design-system.css");
const components = read("css/components.css");
const friends = read("css/friends.css");
const menu = read("css/menu.css");
const profile = read("css/profile.css");
const servers = read("css/servers.css");

test("all buttons and server action links use one transition contract", () => {
    assert.match(design, /--app-button-transition:[^;]*var\(--app-duration-fast\)/);
    assert.match(design, /--app-button-hover-brightness:\s*0\.96/);
    assert.match(design, /--app-button-pressed-scale:\s*0\.97/);
    assert.match(
        design,
        /button:not\(\.menu-backdrop\),\s*a\.server-details-download\s*\{\s*transition:\s*var\(--app-button-transition\);/s
    );
    assert.match(
        design,
        /button:not\(\.menu-backdrop\):not\(:disabled\):hover,\s*a\.server-details-download:hover\s*\{\s*filter:\s*brightness\(var\(--app-button-hover-brightness\)\);/s
    );
    assert.match(
        design,
        /button:not\(\.menu-backdrop\):not\(:disabled\):active,\s*a\.server-details-download:active\s*\{\s*transform:\s*scale\(var\(--app-button-pressed-scale\)\);/s
    );
});

test("page-specific buttons do not override the shared hover and press motion", () => {
    assert.doesNotMatch(components, /\.ui-button[^}]*:(?:hover|active)/s);
    assert.doesNotMatch(friends, /\.friend-card:(?:hover|active)/);
    assert.doesNotMatch(menu, /\.menu-item:not\(:disabled\):hover/);
    assert.doesNotMatch(servers, /\.server-details-ip-button[^}]*:(?:hover|active)/s);
    assert.doesNotMatch(servers, /\.server-details-download:(?:hover|active)/);
    assert.match(
        profile,
        /translate\(-50%, -50%\) scale\(var\(--app-button-pressed-scale\)\)/
    );
});

test("reduced motion is respected by the shared button system", () => {
    assert.match(
        design,
        /@media \(prefers-reduced-motion: reduce\)[\s\S]*?button:not\(\.menu-backdrop\),\s*a\.server-details-download,/
    );
    assert.match(
        read("css/base.css"),
        /transition-duration:\s*0\.01ms !important/
    );
});
