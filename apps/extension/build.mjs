import * as esbuild from "esbuild";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "dist");
const watch = process.argv.includes("--watch");

const define = {
  "process.env.STASH_SUPABASE_URL": JSON.stringify(
    process.env.STASH_SUPABASE_URL ?? "http://127.0.0.1:54321",
  ),
  "process.env.STASH_DASHBOARD_URL": JSON.stringify(
    process.env.STASH_DASHBOARD_URL ?? "http://127.0.0.1:3000",
  ),
};

function copyStaticAssets() {
  mkdirSync(distDir, { recursive: true });
  mkdirSync(join(distDir, "icons"), { recursive: true });

  cpSync(join(__dirname, "manifest.json"), join(distDir, "manifest.json"));
  cpSync(join(__dirname, "src/popup.html"), join(distDir, "popup.html"));
  cpSync(join(__dirname, "src/popup.css"), join(distDir, "popup.css"));
  cpSync(join(__dirname, "icons"), join(distDir, "icons"), { recursive: true });

  const popupHtml = readFileSync(join(distDir, "popup.html"), "utf8");
  writeFileSync(
    join(distDir, "popup.html"),
    popupHtml.replace('src="popup.ts"', 'src="popup.js"'),
  );
}

const buildOptions = {
  entryPoints: {
    background: join(__dirname, "src/background.ts"),
    content: join(__dirname, "src/content.ts"),
    popup: join(__dirname, "src/popup.ts"),
  },
  bundle: true,
  outdir: distDir,
  format: "esm",
  target: "chrome120",
  sourcemap: true,
  logLevel: "info",
  define,
};

async function build() {
  copyStaticAssets();

  if (watch) {
    const context = await esbuild.context(buildOptions);
    await context.watch();
    console.log("Watching extension sources...");
    return;
  }

  await esbuild.build(buildOptions);
  console.log("Extension built to apps/extension/dist");
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
