import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["js", "worker", "scripts"];
const files = [];

async function collect(path) {
    const details = await stat(path);

    if (details.isFile()) {
        if (/\.(?:mjs|js)$/.test(path)) files.push(path);
        return;
    }

    if (!details.isDirectory()) return;

    const entries = await readdir(path);
    for (const entry of entries) {
        await collect(join(path, entry));
    }
}

for (const root of roots) {
    await collect(root);
}

files.sort();

let failed = false;
for (const file of files) {
    const result = spawnSync(process.execPath, ["--check", file], {
        stdio: "inherit"
    });

    if (result.error) {
        console.error("Не удалось проверить " + file + ":", result.error.message);
        failed = true;
    } else if (result.status !== 0) {
        failed = true;
    }
}

if (failed) {
    process.exitCode = 1;
} else {
    console.log("Проверка синтаксиса JavaScript пройдена: " + files.length + " файлов.");
}
