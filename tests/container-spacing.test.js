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
        /\.server-card-content\s*\{[^}]*position:\s*relative;[^}]*grid-row:\s*1;[^}]*padding:\s*0 var\(--app-container-padding\)/s
    );
});

test("all CSS bundles use the refreshed cache key", () => {
    const html = read("index.html");
    assert.equal((html.match(/20261128-42/g) || []).length, 16);
});

test("all content gaps use the shared semantic spacing scale", () => {
    const design = read("css/design-system.css");
    for (const [token, value] of [
        ["--app-content-gap-tight", "--app-space-1"],
        ["--app-content-gap", "--app-space-2"],
        ["--app-content-gap-relaxed", "--app-space-3"],
        ["--app-content-gap-group", "--app-space-4"],
        ["--app-container-gap", "--app-space-6"]
    ]) {
        assert.match(design, new RegExp(token + ":\\s*var\\(" + value + "\\)"));
    }

    const sharedGaps = [
        ["css/events.css", /\.event-card-content\s*\{[^}]*gap:\s*var\(--app-content-gap\)/s],
        ["css/servers.css", /\.server-card-details\s*\{[^}]*gap:\s*var\(--app-content-gap-tight\)/s],
        ["css/profile.css", /\.profile-name-row\s*\{[^}]*gap:\s*var\(--app-content-gap\)/s],
        ["css/friends.css", /\.friend-card\s*\{[^}]*gap:\s*var\(--app-content-gap-relaxed\)/s],
        ["css/nominations.css", /\.vote-candidate-card\s*\{[^}]*gap:\s*var\(--app-content-gap\)/s],
        ["css/components.css", /\.ui-button\s*\{[^}]*gap:\s*var\(--app-content-gap\)/s]
    ];
    for (const [path, pattern] of sharedGaps) {
        assert.match(read(path), pattern, path + " should use the shared semantic gap scale");
    }
});
