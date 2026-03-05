import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import fs from "fs/promises";
import path from "path";
const traverse = typeof _traverse === "function" ? _traverse : _traverse.default;
const generate = typeof _generate === "function" ? _generate : _generate.default;
export async function patchJS(codeFiles, mapping, targetDir, dryRun) {
    let updatedFilesCount = 0;
    const parseFailureFiles = [];
    const normalizedMapping = new Map();
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
        }
        catch {
            parseFailureFiles.push(path.relative(targetDir, file));
            continue;
        }
        let isModified = false;
        traverse(ast, {
            StringLiteral(pathNode) {
                const rawValue = pathNode.node.value;
                if (typeof rawValue !== "string")
                    return;
                const source = rawValue.split("?")[0];
                if (!/\.(png|jpe?g|mp4|mov)$/i.test(source))
                    return;
                const queryParam = rawValue.includes("?")
                    ? "?" + rawValue.split("?")[1]
                    : "";
                let matchedOriginal;
                // absolute /public/ path — Next.js style: src="/images/hero.png"
                if (source.startsWith("/")) {
                    const cleanSource = source.replace(/^\//, "");
                    for (const [origPath] of normalizedMapping.entries()) {
                        if (origPath.endsWith(path.join("public", cleanSource)) ||
                            origPath.endsWith(cleanSource)) {
                            matchedOriginal = origPath;
                            break;
                        }
                    }
                }
                else {
                    // relative path: ./assets/hero.png
                    const resolved = path.normalize(path.resolve(path.dirname(file), source));
                    if (normalizedMapping.has(resolved)) {
                        matchedOriginal = resolved;
                    }
                    else {
                        // alias fallback: @/images/hero.png or ~/images/hero.png
                        const cleanSource = source.replace(/^@\/?|^~\//, "");
                        for (const [origPath] of normalizedMapping.entries()) {
                            if (origPath.endsWith(cleanSource)) {
                                matchedOriginal = origPath;
                                break;
                            }
                        }
                    }
                }
                if (matchedOriginal) {
                    const newSource = source
                        .replace(/\.(png|jpe?g)$/i, ".webp")
                        .replace(/\.(mp4|mov)$/i, ".webm") + queryParam;
                    pathNode.node.value = newSource;
                    // update extra.raw so Babel generator outputs the new value
                    if (pathNode.node.extra) {
                        pathNode.node.extra.rawValue = newSource;
                        const quote = pathNode.node.extra.raw?.[0] || '"';
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
//# sourceMappingURL=js.js.map