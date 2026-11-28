import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
    return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("primary containers use the shared responsive inset token", () => {
    const design = read("css/design-system.css");
    assert.match(design, /--app-container-padding:\s*16px;/);
    assert.match(
        design,
        /@media \(max-width: 640px\)[\s\S]*?:root\s*\{\s*--app-container-padding:\s*14px;/
    );

    const sharedRules = [
        ["css/events.css", /\.event-card-content\s*\{[^}]*padding:\s*var\(--app-container-padding\)/s],
        ["css/friends.css", /\.friend-card\s*\{[^}]*padding:\s*var\(--app-container-padding\)/s],
        ["css/profile.css", /\.profile-details\s*\{[^}]*padding:\s*66px var\(--app-container-padding\) var\(--app-container-padding\)/s],
        ["css/servers.css", /\.server-details-panel-surface\s*\{[^}]*padding:\s*var\(--app-container-padding\)/s],
        ["css/nominations.css", /\.vote-dialog\s*\{[^}]*padding:\s*var\(--app-container-padding\)/s],
        ["css/nominations-cards.css", /\.vote-nomination-content\s*\{[^}]*padding:[^;]*var\(--app-container-padding\)/s]
    ];

    for (const [path, pattern] of sharedRules) {
        assert.match(read(path), pattern, `${path} should use the shared container padding token`);
    }
});

test("server card button has equal horizontal and bottom inset", () => {
    const servers = read("css/servers.css");
    assert.match(
        servers,
        /grid-template-rows:\s*minmax\(0, 1fr\) calc\(var\(--app-control-height\) \+ var\(--app-container-padding\) \+ var\(--app-container-padding\)\)/
    );
    assert.match(
        servers,
        /\.server-card-footer\s*\{[^}]*align-items:\s*flex-end;[^}]*padding:\s*0 var\(--app-container-padding\) var\(--app-container-padding\)/s
    );
    assert.match(
        servers,
        /\.server-card-content\s*\{[^}]*inset:\s*0 0 calc\(var\(--app-control-height\) \+ var\(--app-container-padding\) \+ var\(--app-container-padding\)\)[^}]*padding:\s*0 var\(--app-container-padding\)/s
    );
});

test("all CSS bundles use the refreshed cache key", () => {
    const html = read("index.html");
    assert.equal((html.match(/20261128-37/g) || []).length, 16);
});
