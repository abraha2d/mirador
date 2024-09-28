#!/usr/bin/env bun
import fs from "node:fs";
import { htmlPlugin } from "@craftamap/esbuild-plugin-html";
import esbuild, { type BuildOptions } from "esbuild";

const watch = process.argv.includes("--watch");

const servedir = "build";
const publicPath = "/static";
const outdir = `${servedir}${publicPath}`;

const options: BuildOptions = {
  bundle: true,
  define: {
    "process.env.REACT_APP_VERSION": `'${
      // biome-ignore lint/complexity/useLiteralKeys: TS4111
      process.env["REACT_APP_VERSION"] || "dev"
    }'`,
  },
  entryNames: "[dir]/[name]-[hash]",
  entryPoints: ["src/index.tsx"],
  format: "esm",
  jsx: "automatic",
  jsxDev: true,
  logLevel: "info",
  metafile: true,
  minify: !watch,
  outdir,
  publicPath,
  sourcemap: true,
  splitting: true,
  target: ["ES2023"],
  plugins: [
    htmlPlugin({
      files: [
        {
          entryPoints: ["src/index.tsx"],
          filename: "../index.html",
          htmlTemplate: fs.readFileSync("static/index.html").toString(),
          scriptLoading: "module",
        },
      ],
    }),
  ],
};

// Clean build directory
fs.rmSync(servedir, { recursive: true });

// Build main entrypoint
console.log("Building main entrypoint...");
if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();

  const { host } = await ctx.serve({
    port: 2999,
    servedir,
  });

  console.log(` > Proxy:   http://${host}:3000/`);
} else {
  await esbuild.build(options);
}
