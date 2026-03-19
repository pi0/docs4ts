#!/usr/bin/env node
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { loadJSDocs } from "./loader.ts";
import { renderJSDocsMarkdown } from "./markdown.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string", short: "o" },
    interfaces: { type: "boolean", short: "i" },
    help: { type: "boolean", short: "h" },
  },
});

if (values.help || positionals.length === 0) {
  console.log("Usage: docs4ts [options] <file>");
  console.log("");
  console.log("Options:");
  console.log("  -o, --out <file>     Write output to file");
  console.log("  -i, --interfaces     Include interfaces in output");
  console.log("  -h, --help           Show this help");
  process.exit(values.help ? 0 : 1);
}

const filePath = resolve(positionals[0]!);
const entries = await loadJSDocs(filePath);
const md = renderJSDocsMarkdown(entries, {
  includeInterfaces: values.interfaces,
});

if (values.out) {
  await writeFile(resolve(values.out), md, "utf8");
} else {
  process.stdout.write(md);
}
