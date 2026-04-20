import { resolve, relative, join, dirname, basename } from "path";
import { readdirSync, readFileSync, writeFileSync, renameSync } from "fs";

const SCRIPTS_DIR = import.meta.dirname;
const DOCS_DIR = resolve(SCRIPTS_DIR, "..");
const API_DIR = resolve(DOCS_DIR, "content", "api");

const PACKAGE_TITLES: Record<string, string> = {
  common: "@streamflow/common",
  stream: "@streamflow/stream",
  staking: "@streamflow/staking",
  distributor: "@streamflow/distributor",
  launchpad: "@streamflow/launchpad",
};

const DIR_ICONS: Record<string, string> = {
  classes: "Box",
  interfaces: "Box",
  "type-aliases": "Type",
  enumerations: "List",
  functions: "Function",
  variables: "Variable",
  rpc: "Server",
};

function getAllMdFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllMdFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

function getSubdirs(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function getMdFileNamesInDir(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => f.replace(/\.md$/, ""));
}

function extractTitleAndDescription(content: string, filePath: string): { title: string; description: string } {
  const headingMatch = content.match(/^#\s+(.+)$/m);
  const title = headingMatch ? headingMatch[1].trim() : basename(filePath, ".md");

  let description = "";
  if (headingMatch) {
    const afterHeading = content.slice(headingMatch.index! + headingMatch[0].length);
    for (const line of afterHeading.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("---") && !trimmed.startsWith("```")) {
        description = trimmed;
        break;
      }
    }
  }

  return { title, description };
}

function rewriteLinks(content: string, filePath: string, apiDir: string): string {
  const relFromApi = relative(apiDir, filePath);
  const packageName = relFromApi.split(/[/\\]/)[0];
  const packageApiDir = join(apiDir, packageName);
  const fileDir = dirname(filePath);

  // Matches [text](target.md) and [text](target.md#fragment)
  return content.replace(/\[([^\]]+)\]\(([^)]+\.md(?:#[^)]*)?)\)/g, (_match, linkText: string, linkTarget: string) => {
    if (linkTarget.startsWith("http://") || linkTarget.startsWith("https://") || linkTarget.includes("://")) {
      return `[${linkText}](${linkTarget})`;
    }

    let fragment = "";
    let target = linkTarget;
    if (target.includes("#")) {
      const idx = target.indexOf("#");
      fragment = target.slice(idx);
      target = target.slice(0, idx);
    }

    target = target.replace(/\.md$/, "");
    const absoluteLink = resolve(fileDir, target);

    if (!absoluteLink.startsWith(packageApiDir)) {
      return `[${linkText}](${linkTarget})`;
    }

    const relFromPackage = relative(packageApiDir, absoluteLink).split("\\").join("/");
    return `[${linkText}](/docs/api/${packageName}/${relFromPackage}${fragment})`;
  });
}

function addFrontmatter(content: string, filePath: string): string {
  if (content.startsWith("---")) return content;

  const { title, description } = extractTitleAndDescription(content, filePath);
  const esc = (s: string) => s.replace(/"/g, '\\"');
  return `---\ntitle: "${esc(title)}"\ndescription: "${esc(description)}"\n---\n\n${content}`;
}

function generateMetaJson(apiDir: string): void {
  const packageDirs = getSubdirs(apiDir);
  writeFileSync(
    join(apiDir, "meta.json"),
    JSON.stringify({ title: "API Reference", icon: "BookOpen", pages: packageDirs }, null, 2) + "\n",
  );
  console.log("  Generated root meta.json for API Reference");

  for (const pkgDir of packageDirs) {
    const packagePath = join(apiDir, pkgDir);
    const packageTitle = PACKAGE_TITLES[pkgDir] ?? pkgDir;

    const pages: Array<Record<string, string>> = [{ title: "Overview", url: `/docs/api/${pkgDir}`, icon: "FileText" }];

    for (const subdir of getSubdirs(packagePath)) {
      pages.push({ title: subdir, icon: DIR_ICONS[subdir] ?? "Folder" });
    }

    writeFileSync(
      join(packagePath, "meta.json"),
      JSON.stringify({ title: packageTitle, icon: "Library", pages }, null, 2) + "\n",
    );
    console.log(`  Generated meta.json for ${packageTitle}`);

    generateSubdirMeta(packagePath);
  }
}

function generateSubdirMeta(dirPath: string): void {
  for (const subdir of getSubdirs(dirPath)) {
    const subdirPath = join(dirPath, subdir);
    const mdFiles = getMdFileNamesInDir(subdirPath);

    if (mdFiles.length === 0) {
      generateSubdirMeta(subdirPath);
      continue;
    }

    const pages = mdFiles.filter((p) => p !== "index");
    const title = subdir
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    writeFileSync(
      join(subdirPath, "meta.json"),
      JSON.stringify({ title, icon: DIR_ICONS[subdir] ?? "Box", pages }, null, 2) + "\n",
    );

    generateSubdirMeta(subdirPath);
  }
}

async function main() {
  console.log("Post-processing API docs...\n");

  console.log("1. Adding frontmatter and rewriting links...");
  const mdFiles = getAllMdFiles(API_DIR);
  for (const file of mdFiles) {
    let content = readFileSync(file, "utf-8");
    content = addFrontmatter(content, file);
    content = rewriteLinks(content, file, API_DIR);
    writeFileSync(file, content);
  }
  console.log(`  Processed ${mdFiles.length} files\n`);

  console.log("2. Generating meta.json files...");
  generateMetaJson(API_DIR);
  console.log();

  console.log("3. Renaming .md files to .mdx...");
  const allMd = getAllMdFiles(API_DIR);
  for (const file of allMd) {
    renameSync(file, file.replace(/\.md$/, ".mdx"));
  }
  console.log(`  Renamed ${allMd.length} files\n`);

  console.log("Post-processing complete!");
}

main();
