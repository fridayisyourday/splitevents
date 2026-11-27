import assert from "node:assert/strict";
import test from "node:test";
import { SERVERS } from "../js/servers/data.js";

test("TECHNOCRACY server is listed with the supplied address", () => {
    assert.equal(SERVERS.length, 1);
    assert.equal(SERVERS[0].id, "technocracy");
    assert.equal(SERVERS[0].name, "TECHNOCRACY");
    assert.equal(SERVERS[0].address, "26.135.106.225:4444");
});

test("server entries have unique ids and only metadata, without fabricated artwork", () => {
    const ids = SERVERS.map((server) => server.id);
    assert.equal(new Set(ids).size, ids.length);

    for (const server of SERVERS) {
        assert.ok(server.name);
        assert.ok(server.address);
        assert.equal(Object.hasOwn(server, "banner"), false);
        assert.equal(Object.hasOwn(server, "logo"), false);
    }
});
