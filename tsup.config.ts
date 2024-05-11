import { defineConfig } from "tsup";

/**
 * Export tsup configuration
 */
export default defineConfig({
    entry: ["src/cmd/index.ts"],
    format: ["cjs", "esm"], //Build for cjs and esm
    dts: true, // Genearte declaration file (.d.ts)
    splitting: false,
    sourcemap: true,
    clean: true,
});
