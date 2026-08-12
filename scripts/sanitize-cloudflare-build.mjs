import { readFile, writeFile } from "node:fs/promises";

const generatedConfigUrl = new URL("../dist/server/wrangler.json", import.meta.url);
const config = JSON.parse(await readFile(generatedConfigUrl, "utf8"));

// The Vite plugin records build-machine paths for its own diagnostics. They are
// unnecessary at deploy time, harm reproducibility and must never leave the PC.
delete config.configPath;
delete config.userConfigPath;
delete config.dev;

await writeFile(generatedConfigUrl, `${JSON.stringify(config)}\n`, "utf8");
console.log("Sanitized generated Cloudflare config (no local paths or dev host).");
