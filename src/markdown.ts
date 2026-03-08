import type { JSDocEntry } from "./parser.ts";
import type { ExtractJSDocsOptions } from "./parser.ts";
import { extractJSDocs } from "./parser.ts";

/**
 * Render an array of JSDoc entries as formatted Markdown.
 *
 * Each entry becomes a `###` section with signature, description,
 * parameters, return info, examples, and other tags.
 *
 * @param entries - JSDoc entries to render (from {@link extractJSDocs} or {@link loadJSDocs})
 * @returns Formatted Markdown string with `---` separators between sections
 * @example
 * const entries = await loadJSDocs("src/index.ts");
 * const markdown = renderJSDocsMarkdown(entries);
 */
export function renderJSDocsMarkdown(entries: JSDocEntry[]): string {
  const sections: string[] = [];

  for (const entry of entries) {
    const lines: string[] = [];

    // Heading
    lines.push(`### \`${entry.name}\`\n`);

    // Signature
    if (entry.signature) {
      lines.push("```ts");
      lines.push(entry.signature);
      lines.push("```\n");
    }

    // Description
    if (entry.description) {
      lines.push(_resolveInlineLinks(entry.description) + "\n");
    }

    // Params
    const params = entry.tags.filter((t) => t.tag === "param");
    if (params.length > 0) {
      lines.push("**Parameters:**\n");
      for (const p of params) {
        const type = p.type ? ` \`${p.type}\`` : "";
        const desc = p.description ? ` — ${_resolveInlineLinks(p.description)}` : "";
        lines.push(`- **\`${p.name}\`**${type}${desc}`);
      }
      lines.push("");
    }

    // Returns
    const returns = entry.tags.find((t) => t.tag === "returns" || t.tag === "return");
    if (returns) {
      const type = returns.type ? ` \`${returns.type}\`` : "";
      const desc = returns.description ? ` — ${_resolveInlineLinks(returns.description)}` : "";
      lines.push(`**Returns:**${type}${desc}\n`);
    }

    // Examples
    const examples = entry.tags.filter((t) => t.tag === "example");
    for (const ex of examples) {
      lines.push("**Example:**\n");
      if (ex.description) {
        const code = ex.description.trim();
        // If already wrapped in code fence, use as-is
        if (code.startsWith("```")) {
          lines.push(code);
        } else {
          lines.push("```ts");
          lines.push(code);
          lines.push("```");
        }
      }
      lines.push("");
    }

    // Other tags
    const otherTags = entry.tags.filter(
      (t) => t.tag !== "param" && t.tag !== "returns" && t.tag !== "return" && t.tag !== "example",
    );
    for (const t of otherTags) {
      if (t.tag === "deprecated") {
        lines.push(
          `> **Deprecated**${t.description ? `: ${_resolveInlineLinks(t.description)}` : ""}\n`,
        );
      } else if (t.tag === "see") {
        lines.push(`**See:** ${_resolveInlineLinks(t.description || "")}\n`);
      } else if (t.tag === "since") {
        lines.push(`**Since:** ${t.description}\n`);
      } else if (t.description) {
        lines.push(`**@${t.tag}** ${_resolveInlineLinks(t.description)}\n`);
      }
    }

    sections.push(lines.join("\n"));
  }

  return sections.join("\n---\n\n");
}

/**
 * Extract JSDoc from TypeScript/JavaScript source and return Markdown.
 *
 * Convenience wrapper that combines {@link extractJSDocs} and {@link renderJSDocsMarkdown}.
 *
 * @param source - Source code string to parse
 * @param options - Parser options (filename hint, include private declarations)
 * @returns Formatted Markdown documentation string
 * @example
 * const markdown = jsdocsToMarkdown(`
 *   /** Greet someone. *​/
 *   export function greet(name: string): string {
 *     return "Hello, " + name;
 *   }
 * `);
 */
export function jsdocsToMarkdown(source: string, options?: ExtractJSDocsOptions): string {
  const entries = extractJSDocs(source, options);
  return renderJSDocsMarkdown(entries);
}

/** Convert `{@link Name}` and `{@link Name text}` to Markdown anchor links. */
function _resolveInlineLinks(text: string): string {
  return text.replaceAll(
    /\{@link\s+(\w+)(?:\s+([^}]+))?\}/g,
    (_match, name: string, label?: string) => {
      const anchor = name.toLowerCase().replace(/[^\w-]/g, "");
      return `[\`${label || name}\`](#${anchor})`;
    },
  );
}
