/**
 * Fetches the last 2 releases from the js-sdk GitHub repo and rewrites
 * the release section in changelog.mdx between RELEASES_START / RELEASES_END markers.
 *
 * Run: npx tsx scripts/update-changelog.ts
 * Runs automatically as part of `pnpm build` via the prebuild script.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CHANGELOG_PATH = join(import.meta.dirname, "../content/docs/resources/changelog.mdx");
const RELEASES_URL = "https://api.github.com/repos/streamflow-finance/js-sdk/releases?per_page=2";

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  prerelease: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function parseReleaseBody(body: string): string {
  return (
    body
      // Remove "What's Changed" heading (GitHub auto-adds it)
      .replace(/^#{1,3}\s*What'?s?\s*Changed\s*\n/im, "")
      // Remove "Full Changelog" footer line
      .replace(/\*\*Full Changelog\*\*:.*$/m, "")
      // Collapse trailing blank lines
      .trimEnd()
  );
}

async function fetchReleases(): Promise<GitHubRelease[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Use token if available (avoids rate limiting in CI)
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(RELEASES_URL, { headers });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const releases = (await res.json()) as GitHubRelease[];
  return releases.filter((r) => !r.prerelease);
}

function buildReleasesMarkdown(releases: GitHubRelease[]): string {
  const blocks = releases.map((release, index) => {
    const isLatest = index === 0;
    const date = formatDate(release.published_at);
    const tag = release.tag_name;
    const heading = isLatest ? `## ${tag} — Latest <small>${date}</small>` : `## ${tag} <small>${date}</small>`;
    const body = parseReleaseBody(release.body ?? "").trim();
    return body ? `${heading}\n\n${body}` : heading;
  });

  return blocks.join("\n\n");
}

async function run() {
  console.log("Fetching latest releases from GitHub...");
  const releases = await fetchReleases();

  if (!releases.length) {
    console.warn("No releases found — changelog not updated.");
    return;
  }

  const markdown = buildReleasesMarkdown(releases);

  const source = readFileSync(CHANGELOG_PATH, "utf8");
  const start = "{/* RELEASES_START */}";
  const end = "{/* RELEASES_END */}";

  if (!source.includes(start) || !source.includes(end)) {
    throw new Error(`changelog.mdx is missing ${start} / ${end} markers.`);
  }

  // Escape special regex chars in the markers before building the pattern
  const escStart = start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escEnd = end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const updated = source.replace(new RegExp(`${escStart}[\\s\\S]*?${escEnd}`), `${start}\n\n${markdown}\n\n${end}`);

  writeFileSync(CHANGELOG_PATH, updated, "utf8");
  console.log(
    `✓ changelog.mdx updated with ${releases.length} releases (${releases.map((r) => r.tag_name).join(", ")})`,
  );
}

run().catch((err) => {
  // Don't fail the build — the file already has content from the last successful run.
  process.stderr.write(`⚠ Could not update changelog: ${err.message}\n`);
});
