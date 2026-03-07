import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import fs from "fs/promises";
import path from "path";

const traverse =
  typeof _traverse === "function" ? _traverse : (_traverse as any).default;
const generate =
  typeof _generate === "function" ? _generate : (_generate as any).default;

/**
 * Patches JavaScript/TypeScript code files by updating references to images and videos.
 *
 * This function parses each code file into an AST (Abstract Syntax Tree) using
 * Babel, traverses the tree to find string literals pointing to media files
 * (PNG, JPG, JPEG, MP4, MOV), and updates them based on the provided mapping.
 * Query parameters like `?v=2` are preserved during replacement. Supports
 * both absolute paths (starting with "/") and relative paths.
 *
 * @param {string[]} codeFiles - Array of absolute paths to JS/TS code files to patch
 * @param {Record<string, string>} mapping - A mapping of original media paths to converted paths.
 *                                           Example: { "./assets/hero.png": "./assets/hero.webp" }
 * @param {string} targetDir - The root directory of the project; used for relative path logging
 * @param {boolean} dryRun - If true, will not write any changes, just reports what would change
 * @returns {Promise<{ updatedFilesCount: number; parseFailureFiles: string[] }>}
 *          Returns an object containing:
 *          - updatedFilesCount: number of files successfully patched
 *          - parseFailureFiles: array of file paths that failed to parse
 *
 * @example
 * ```ts
 * const { updatedFilesCount, parseFailureFiles } = await patchJS(
 *   ['/project/src/App.tsx', '/project/src/components/Hero.tsx'],
 *   { './assets/hero.png': './assets/hero.webp' },
 *   '/project',
 *   false
 * );
 *
 * console.log(updatedFilesCount); // e.g. 2
 * console.log(parseFailureFiles); // e.g. []
 * ```
 */
export async function patchJS(
  codeFiles: string[],
  mapping: Record<string, string>, // mapping content example {"./assets/hero.png => ./assets/hero.webp"}
  targetDir: string,
  dryRun: boolean,
): Promise<{ updatedFilesCount: number; parseFailureFiles: string[] }> {
  let updatedFilesCount = 0;
  const parseFailureFiles: string[] = [];

  const normalizedMapping = new Map<string, string>();

  for (const [orig, converted] of Object.entries(mapping)) {
    normalizedMapping.set(path.normalize(orig), path.normalize(converted));
  }

  if (normalizedMapping.size === 0)
    return { updatedFilesCount: 0, parseFailureFiles };

  for (const file of codeFiles) {
    const code = await fs.readFile(file, "utf8");
    let ast;
    try {
      ast = parse(code, {
        sourceType: "module",
        plugins: ["jsx", "typescript"],
        errorRecovery: true,
      });
    } catch {
      parseFailureFiles.push(path.relative(targetDir, file));
      continue;
    }

    let isModified = false;

    traverse(ast, {
      StringLiteral(pathNode: any) {
        // takes only the string value for example const a = "aayush" will only take the aayush part
        const rawValue: string = pathNode.node.value;
        if (typeof rawValue !== "string") return;
        const source = rawValue.split("?")[0];
        if (!/\.(png|jpe?g|mp4|mov)$/i.test(source)) return; // Regular expression to check if the source path is a file with ext of the specified file type
        const queryParam = rawValue.includes("?") //if images are like ./hero.png?v=2 seperates the queryparams and joins them later
          ? "?" + rawValue.split("?")[1]
          : "";
        let matchedOriginal: string | undefined;
        if (source.startsWith("/")) {
          const cleanSource = source.replace(/^\//, ""); // replaces the leading slash finds the first / and replaces it with ""
          for (const [origPath] of normalizedMapping.entries()) {
            if (
              origPath.endsWith(path.join("public", cleanSource)) ||
              origPath.endsWith(cleanSource)
            ) {
              matchedOriginal = origPath;
              break;
            }
          }
        } else {
          const resolved = path.normalize(
            path.resolve(path.dirname(file), source),
          );
          if (normalizedMapping.has(resolved)) {
            matchedOriginal = resolved;
          } else {
            const cleanSource = source.replace(/^@\/?|^~\//, ""); // removes the alias like @ or ~/
            for (const [origPath] of normalizedMapping.entries()) {
              if (origPath.endsWith(cleanSource)) {
                matchedOriginal = origPath;
                break;
              }
            }
          }
        }

        if (matchedOriginal) {
          const newSource =
            source
              .replace(/\.(png|jpe?g)$/i, ".webp")
              .replace(/\.(mp4|mov)$/i, ".webm") + queryParam;

          pathNode.node.value = newSource;
          if (pathNode.node.extra) {
            pathNode.node.extra.rawValue = newSource;
            const quote = (pathNode.node.extra.raw as string)?.[0] || '"';
            pathNode.node.extra.raw = `${quote}${newSource}${quote}`;
          }

          isModified = true;
        }
      },
    });

    if (isModified) {
      updatedFilesCount++;
      if (!dryRun) {
        const output = generate(ast, { retainLines: true }, code);
        await fs.writeFile(file, output.code, "utf8");
      }
    }
  }

  return { updatedFilesCount, parseFailureFiles };
}
