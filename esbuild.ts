import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/keep.ts"],
  bundle: true,
  outfile: "dist/keep.js",
  minify: false,
  platform: "node",
});
