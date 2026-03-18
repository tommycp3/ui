import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
    css: {
        postcss: {
            plugins: [tailwindcss()]
        }
    },
    plugins: [react()],
    build: {
        outDir: "build",
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
            // external: ["unstorage"], // Add 'unstorage' here
        },
        copyPublicDir: true,
    },
    server: {
        host: "0.0.0.0", // Allow external access in Docker
        port: 5173, // Use default Vite port
        strictPort: true,
        middlewareMode: false
    },
    base: "/",
    preview: {
        port: 5173 // Use default Vite port for preview too
    },
    define: {
        global: "globalThis",
        "process.env": {},
    },
    resolve: {
        alias: {
            crypto: path.resolve(__dirname, "node_modules/crypto-browserify"),
            stream: path.resolve(__dirname, "node_modules/stream-browserify"),
            buffer: path.resolve(__dirname, "node_modules/buffer"),
            process: path.resolve(__dirname, "node_modules/process/browser.js"),
            util: path.resolve(__dirname, "node_modules/util"),
            events: path.resolve(__dirname, "node_modules/events"),
            // Fix @noble/hashes subpath exports for Vite 8 / Rolldown
            "@noble/hashes/sha2.js": path.resolve(__dirname, "node_modules/@noble/hashes/esm/sha2.js"),
            "@noble/hashes/utils.js": path.resolve(__dirname, "node_modules/@noble/hashes/esm/utils.js"),
            "@noble/hashes/sha2": path.resolve(__dirname, "node_modules/@noble/hashes/esm/sha2.js"),
            "@noble/hashes/utils": path.resolve(__dirname, "node_modules/@noble/hashes/esm/utils.js"),
        },
        dedupe: ["@cosmjs/stargate", "@cosmjs/proto-signing", "ethers", "@noble/hashes"],
    },
    optimizeDeps: {
        include: [
            "buffer",
            "crypto-browserify",
            "stream-browserify",
            "process",
            "util",
            "events",
            "@block52/poker-vm-sdk"
        ],
    },
});
