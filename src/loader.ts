import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseSync, Visitor } from "oxc-parser";
import { type JSDocEntry, extractJSDocs } from "./parser.ts";

/** Options for {@link loadJSDocs}. */
export interface LoadJSDocsOptions {
  /** Include non-exported declarations (default: false) */
  includePrivate?: boolean;
}

/**
 * Load JSDoc entries from an entry file, traversing all re-exported modules.
 *
 * Starting from the given file, follows `export ... from` and `export *` statements
 * to collect documentation across the entire module graph.
 *
 * @param entry - Path to the entry file to start from
 * @param options - Loader options (include private declarations)
 * @returns Array of JSDoc entries collected from all traversed modules
 * @example
 * const entries = await loadJSDocs("src/index.ts");
 */
export async function loadJSDocs(
  entry: string,
  options?: LoadJSDocsOptions,
): Promise<JSDocEntry[]> {
  const visited = new Set<string>();
  const entries: JSDocEntry[] = [];

  async function processFile(filePath: string): Promise<void> {
    const resolved = resolve(filePath);
    if (visited.has(resolved)) return;
    visited.add(resolved);

    const source = await readFile(resolved, "utf8");

    // Extract JSDoc entries from this file
    const fileEntries = extractJSDocs(source, {
      filename: resolved,
      includePrivate: options?.includePrivate,
    });
    entries.push(...fileEntries);

    // Find re-exported modules to traverse
    const reExportSources = findReExportSources(source, resolved);
    await Promise.all(reExportSources.map((src) => processFile(src)));
  }

  await processFile(entry);
  return sortEntries(entries);
}

/** Sort entries alphabetically, with interfaces grouped at the end. */
export function sortEntries(entries: JSDocEntry[]): JSDocEntry[] {
  return entries.toSorted((a, b) => {
    const aIsInterface = a.kind === "interface" ? 1 : 0;
    const bIsInterface = b.kind === "interface" ? 1 : 0;
    if (aIsInterface !== bIsInterface) return aIsInterface - bIsInterface;
    return a.name.localeCompare(b.name);
  });
}

// --- Internal helpers ---

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"];

function findReExportSources(source: string, filePath: string): string[] {
  const result = parseSync(filePath, source);
  const sources: string[] = [];
  const dir = dirname(filePath);

  const visitor = new Visitor({
    ExportNamedDeclaration(node: any) {
      if (node.source?.value) {
        const resolved = resolveModulePath(dir, node.source.value);
        if (resolved) sources.push(resolved);
      }
    },
    ExportAllDeclaration(node: any) {
      if (node.source?.value) {
        const resolved = resolveModulePath(dir, node.source.value);
        if (resolved) sources.push(resolved);
      }
    },
  });
  visitor.visit(result.program);

  return sources;
}

function resolveModulePath(dir: string, specifier: string): string | undefined {
  // Only follow relative imports
  if (!specifier.startsWith(".")) return undefined;

  const full = resolve(dir, specifier);

  // If specifier already has an extension and the file exists, use as-is
  if (EXTENSIONS.some((ext) => specifier.endsWith(ext))) {
    if (existsSync(full)) return full;
    // TypeScript allows `.js` imports that resolve to `.ts` files
    const tsEquivalent = full.replace(/\.(js|jsx|mjs)$/, (_, ext) =>
      ext === "js" ? ".ts" : ext === "jsx" ? ".tsx" : ".mts",
    );
    if (tsEquivalent !== full && existsSync(tsEquivalent)) return tsEquivalent;
    return undefined;
  }

  // Try adding extensions, check which file exists
  for (const ext of EXTENSIONS) {
    const candidate = full + ext;
    if (existsSync(candidate)) return candidate;
  }

  return undefined;
}
