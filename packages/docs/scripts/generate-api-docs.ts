import { Application } from "typedoc";
import { resolve } from "path";
import { rmSync, mkdirSync, existsSync, writeFileSync, mkdtempSync } from "fs";
import { tmpdir } from "os";

const markdownOptions = {
  plugin: ["typedoc-plugin-markdown"],
  theme: "markdown",
  entryFileName: "index.md",
  hideBreadcrumbs: true,
  hidePageHeader: true,
  readme: "none",
  excludeScopesInPaths: true,
  useCodeBlocks: true,
  parametersFormat: "table",
  propertiesFormat: "table",
  enumMembersFormat: "table",
  typeDeclarationFormat: "table",
};

interface PackageConfig {
  name: string;
  entryPoints: string[];
}

const packages: PackageConfig[] = [
  {
    name: "common",
    entryPoints: ["./index.ts", "./solana/index.ts", "./solana/rpc/index.ts"],
  },
  {
    name: "stream",
    entryPoints: ["./index.ts", "./solana/index.ts"],
  },
  {
    name: "staking",
    entryPoints: ["./index.ts"],
  },
  {
    name: "distributor",
    entryPoints: ["./index.ts", "./solana/index.ts", "./solana/descriptor/*"],
  },
  {
    name: "launchpad",
    entryPoints: ["./index.ts", "./solana/index.ts"],
  },
];

function createPackageTsconfig(packageDir: string): string {
  const tsconfig = {
    compilerOptions: {
      module: "Preserve",
      target: "es2022",
      moduleDetection: "force",
      esModuleInterop: true,
      skipLibCheck: true,
      resolveJsonModule: true,
      allowJs: true,
      lib: ["es2022"],
      noEmit: false,
      noUncheckedIndexedAccess: true,
    },
    include: [resolve(packageDir, "**/*.ts")],
    exclude: ["node_modules", "dist", "__tests__"],
  };

  const tmpDir = mkdtempSync(resolve(tmpdir(), "typedoc-"));
  const tsconfigPath = resolve(tmpDir, "tsconfig.json");
  writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  return tsconfigPath;
}

async function generatePackageDocs(pkg: PackageConfig): Promise<boolean> {
  const scriptsDir = import.meta.dirname;
  const docsDir = resolve(scriptsDir, "..");
  const repoRoot = resolve(docsDir, "..", "..");
  const packageDir = resolve(repoRoot, "packages", pkg.name);
  const outputDir = resolve(docsDir, "content", "api", pkg.name);
  const resolvedEntryPoints = pkg.entryPoints.map((ep) => resolve(packageDir, ep));
  const tsconfigPath = createPackageTsconfig(packageDir);

  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true });
  }
  mkdirSync(outputDir, { recursive: true });

  const app = await Application.bootstrapWithPlugins({
    includeVersion: true,
    excludeInternal: true,
    tsconfig: tsconfigPath,
    entryPoints: resolvedEntryPoints,
    out: outputDir,
    skipErrorChecking: true,
    ...markdownOptions,
  });

  const project = await app.convert();
  if (!project) {
    return false;
  }

  await app.generateOutputs(project);
  return true;
}

async function main() {
  const results: Array<{ name: string; success: boolean }> = [];

  for (const pkg of packages) {
    console.log(`Generating docs for @streamflow/${pkg.name}...`);
    try {
      const success = await generatePackageDocs(pkg);
      results.push({ name: pkg.name, success });
      console.log(`  [${success ? "OK" : "FAIL"}] @streamflow/${pkg.name}`);
    } catch (error) {
      console.error(`  [FAIL] @streamflow/${pkg.name}:`, error);
      results.push({ name: pkg.name, success: false });
    }
  }

  console.log("\n--- Summary ---");
  for (const { name, success } of results) {
    console.log(`  [${success ? "OK" : "FAIL"}] @streamflow/${name}`);
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`\n${succeeded} succeeded, ${failed} failed`);

  process.exit(failed === results.length ? 1 : 0);
}

main();
