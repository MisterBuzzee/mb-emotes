import { existsSync } from "node:fs";
import { defineConfig, type UserConfig } from "tsdown";

const config: Record<string, UserConfig> = {
  resource: {
    outExtensions() { return { js: ".js" }; },
    sourcemap: "hidden",
    outputOptions: { entryFileNames: "[name].js" },
    deps: { alwaysBundle: [/.*/], onlyBundle: false, neverBundle: [/^public\//] },
  },
  client: { platform: "browser", target: "es2023", format: "iife", minify: true },
};

function createConfig(name: string): UserConfig {
  return {
    name,
    entry: { [name]: `./resource/${name}/index.ts` },
    tsconfig: `./resource/${name}/tsconfig.json`,
    ...config.resource,
    ...config[name],
    outputOptions: { ...config.resource?.outputOptions, ...config[name]?.outputOptions },
  };
}

const sides = ["client", "server"].filter((side) => existsSync(`./resource/${side}/index.ts`));
export default defineConfig(sides.map(createConfig));