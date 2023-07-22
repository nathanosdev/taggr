import { resolve } from "path";
import { defineConfig } from "vitest/config";
import checker from "vite-plugin-checker";
import { glob } from "glob";

export default defineConfig(async () => {
    return {
        plugins: [checker({ typescript: true })],
        build: {
            outDir: resolve(__dirname, "dist"),
            emptyOutDir: true,
            cssCodeSplit: true,
            minify: false,
            sourcemap: true,
            lib: {
                entry: resolve(__dirname, "src/index.ts"),
                formats: ["es"],
                fileName: "[name].js",
            },
            rollupOptions: {
                input: glob.sync(resolve(__dirname, "src/**/*[!.stories].ts")),
                output: {
                    format: "esm",
                    preserveModules: true,
                    preserveModulesRoot: "src",
                },
            },
        },
    };
});
