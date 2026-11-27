import assert from "node:assert/strict";
import test from "node:test";
import { SERVERS } from "../js/servers/data.js";

test("TECHNOCRACY server is listed with the supplied metadata", () => {
    assert.equal(SERVERS.length, 1);
    assert.equal(SERVERS[0].id, "technocracy");
    assert.equal(SERVERS[0].name, "TECHNOCRACY");
    assert.equal(SERVERS[0].description, "сервер Minecraft");
    assert.equal(SERVERS[0].address, "26.135.106.225:4444");
    assert.equal(SERVERS[0].loader, "neoforge");
    assert.equal(SERVERS[0].version, "21.1");
    assert.equal(
        SERVERS[0].modpackUrl,
        "https://drive.google.com/drive/folders/1YmdjPFOAKPpo0AKIUSurRo5AMLkzZPdX?hl=ru&sort=13&direction=a"
    );
});

test("server entries have unique ids and use the expected ImageKit artwork paths", () => {
    const ids = SERVERS.map((server) => server.id);
    assert.equal(new Set(ids).size, ids.length);

    for (const server of SERVERS) {
        assert.ok(server.name);
        assert.ok(server.address);
        assert.equal(
            server.banner,
            "https://ik.imagekit.io/splitevents/servers/" + server.id + "/banner.webp"
        );
        assert.deepEqual(server.gallery, [
            "https://ik.imagekit.io/splitevents/servers/" + server.id + "/gallery-01.webp",
            "https://ik.imagekit.io/splitevents/servers/" + server.id + "/gallery-02.webp",
            "https://ik.imagekit.io/splitevents/servers/" + server.id + "/gallery-03.webp"
        ]);
        assert.equal(Object.hasOwn(server, "logo"), false);
    }
});
