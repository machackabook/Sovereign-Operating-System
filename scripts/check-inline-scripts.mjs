import { readFile } from "node:fs/promises";
import { Script } from "node:vm";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const tags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
let checked = 0;
for (const [, attributes, source] of tags) {
  if (/\bsrc\s*=/.test(attributes)) continue;
  const type = attributes.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
  if (type && !["text/javascript", "application/javascript"].includes(type)) continue;
  new Script(source, { filename: "index.html:inline-" + (checked + 1) });
  checked += 1;
}
if (!checked) throw new Error("No classic inline JavaScript blocks were found to validate.");
process.stdout.write("Validated " + checked + " inline JavaScript block(s).\n");
