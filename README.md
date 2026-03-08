# docs4ts

<!-- automd:badges color=yellow -->

[![npm version](https://img.shields.io/npm/v/docs4ts?color=yellow)](https://npmjs.com/package/docs4ts)
[![npm downloads](https://img.shields.io/npm/dm/docs4ts?color=yellow)](https://npm.chart.dev/docs4ts)

<!-- /automd -->

Extract JSDoc documentation from TypeScript/JavaScript source files and generate formatted Markdown. Uses [oxc-parser](https://oxc.rs) for fast, accurate parsing with automatic re-export traversal.

## CLI

```bash
# Print markdown to stdout
npx docs4ts src/index.ts

# Write to file
npx docs4ts src/index.ts -o docs/api.md
```

```
Usage: docs4ts [options] <file>

Options:
  -o, --out <file>  Write output to file
  -h, --help        Show this help
```

The CLI follows re-exports automatically — point it at your entry file and it will traverse the module graph to document all exported symbols.

## Programmatic Usage

<!-- automd:docs4ts -->

### `JSDocTag`

```ts
interface JSDocTag
```

Parsed JSDoc tag (e.g. `@param`, `@returns`, `@example`).

---

### `JSDocEntry`

```ts
interface JSDocEntry
```

A single documented declaration extracted from source code.

---

### `ExtractJSDocsOptions`

```ts
interface ExtractJSDocsOptions
```

Options for [`extractJSDocs`](#extractjsdocs).

---

### `extractJSDocs`

```ts
function extractJSDocs(source: string, options?: ExtractJSDocsOptions): JSDocEntry[];
```

Extract JSDoc entries from TypeScript/JavaScript source code.

Parses the source with `oxc-parser`, matches JSDoc block comments to
their associated declarations by byte position, and returns structured entries.

**Parameters:**

- **`source`** — Source code string to parse
- **`options`** — Parser options (filename hint, include private declarations)

**Returns:** — Array of extracted JSDoc entries for documented declarations

**Example:**

```ts
const entries = extractJSDocs(`
  /** Add two numbers. *​/
  export function add(a: number, b: number): number {
    return a + b;
  }
`);
// entries[0] => { name: "add", kind: "function", description: "Add two numbers.", ... }
```

---

### `parseJSDoc`

```ts
function parseJSDoc(raw: string):
```

Parse raw JSDoc comment content into description and tags.

Expects the inner content of a `/** ... *​/` block (without the delimiters).
Splits the comment into a leading description and structured `@tag` entries.

**Parameters:**

- **`raw`** — Raw JSDoc comment body (the text between `/**` and `*​/`)

**Returns:** — Parsed description and array of tags

**Example:**

```ts
const { description, tags } = parseJSDoc(`
  * Add two numbers.
  * @param a - First number
  * @param b - Second number
  * @returns The sum
`);
```

---

### `renderJSDocsMarkdown`

```ts
function renderJSDocsMarkdown(entries: JSDocEntry[]): string;
```

Render an array of JSDoc entries as formatted Markdown.

Each entry becomes a `###` section with signature, description,
parameters, return info, examples, and other tags.

**Parameters:**

- **`entries`** — JSDoc entries to render (from [`extractJSDocs`](#extractjsdocs) or [`loadJSDocs`](#loadjsdocs))

**Returns:** — Formatted Markdown string with `---` separators between sections

**Example:**

```ts
const entries = await loadJSDocs("src/index.ts");
const markdown = renderJSDocsMarkdown(entries);
```

---

### `jsdocsToMarkdown`

```ts
function jsdocsToMarkdown(source: string, options?: ExtractJSDocsOptions): string;
```

Extract JSDoc from TypeScript/JavaScript source and return Markdown.

Convenience wrapper that combines [`extractJSDocs`](#extractjsdocs) and [`renderJSDocsMarkdown`](#renderjsdocsmarkdown).

**Parameters:**

- **`source`** — Source code string to parse
- **`options`** — Parser options (filename hint, include private declarations)

**Returns:** — Formatted Markdown documentation string

**Example:**

```ts
const markdown = jsdocsToMarkdown(`
  /** Greet someone. *​/
  export function greet(name: string): string {
    return "Hello, " + name;
  }
`);
```

---

### `LoadJSDocsOptions`

```ts
interface LoadJSDocsOptions
```

Options for [`loadJSDocs`](#loadjsdocs).

---

### `loadJSDocs`

```ts
async function loadJSDocs(entry: string, options?: LoadJSDocsOptions): Promise<JSDocEntry[]>;
```

Load JSDoc entries from an entry file, traversing all re-exported modules.

Starting from the given file, follows `export ... from` and `export *` statements
to collect documentation across the entire module graph.

**Parameters:**

- **`entry`** — Path to the entry file to start from
- **`options`** — Loader options (include private declarations)

**Returns:** — Array of JSDoc entries collected from all traversed modules

**Example:**

```ts
const entries = await loadJSDocs("src/index.ts");
```

<!-- /automd -->

## Types

```ts
interface JSDocEntry {
  kind: "function" | "class" | "interface" | "type" | "enum" | "variable" | "method" | "property";
  name: string;
  exported: boolean;
  description?: string;
  tags: JSDocTag[];
  signature?: string;
}

interface JSDocTag {
  tag: string;
  name?: string;
  type?: string;
  description?: string;
}
```

## Development

<details>

<summary>local development</summary>

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

</details>

## License

Published under the [MIT](https://github.com/pi0/docs4ts/blob/main/LICENSE) license.
