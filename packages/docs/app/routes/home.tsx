import { useState } from "react";
import { Link } from "react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { Card, Cards } from "fumadocs-ui/components/card";
import { baseOptions } from "@/lib/layout.shared";
import { BookOpen, Blocks, Zap, Code2, ArrowRight, Terminal, GitFork, ExternalLink, Copy, Check } from "lucide-react";
import type { Route } from "./+types/home";

// ── Loader ────────────────────────────────────────────────────────────────────

const FALLBACK_VERSION = "12.1.0";

export async function loader(): Promise<{ version: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const res = await fetch("https://registry.npmjs.org/-/package/@streamflow/stream/dist-tags", {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const data = (await res.json()) as { latest?: string };
    return { version: data.latest ?? FALLBACK_VERSION };
  } catch {
    return { version: FALLBACK_VERSION };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PKG_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;
const SDK_PACKAGES = ["stream", "common", "distributor", "staking"] as const;

const PM_PREFIX: Record<(typeof PKG_MANAGERS)[number], string> = {
  npm: "npm install",
  pnpm: "pnpm add",
  yarn: "yarn add",
  bun: "bun add",
};

const PACKAGES = [
  { name: "@streamflow/common", desc: "BN utils, TX helpers, types", href: "/docs/api/common" },
  { name: "@streamflow/stream", desc: "Vesting, locks, payments", href: "/docs/api/stream" },
  { name: "@streamflow/staking", desc: "Stake pools, rewards", href: "/docs/api/staking" },
  { name: "@streamflow/distributor", desc: "Merkle airdrops", href: "/docs/api/distributor" },
];

const EXTERNAL_LINKS = [
  { label: "App", href: "https://app.streamflow.finance" },
  { label: "Website", href: "https://streamflow.finance" },
  { label: "Support Docs", href: "https://docs.streamflow.finance" },
  { label: "Rust SDK", href: "https://docs.rs/streamflow-sdk/latest/streamflow_sdk/" },
  { label: "GitHub", href: "https://github.com/streamflow-finance" },
  { label: "X / Twitter", href: "https://x.com/streamflow_fi" },
  { label: "npm", href: "https://www.npmjs.com/org/streamflow" },
];

// ── Components ────────────────────────────────────────────────────────────────

function InstallBlock() {
  const [pm, setPm] = useState<(typeof PKG_MANAGERS)[number]>("npm");
  const [pkg, setPkg] = useState<(typeof SDK_PACKAGES)[number]>("stream");
  const [copied, setCopied] = useState(false);

  const cmd = `${PM_PREFIX[pm]} @streamflow/${pkg}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access denied - no-op
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-[340px]">
      <div className="flex rounded-lg border border-fd-border bg-fd-card p-0.5 gap-0.5">
        {PKG_MANAGERS.map((p) => (
          <button
            key={p}
            onClick={() => setPm(p)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              pm === p
                ? "bg-fd-primary text-fd-primary-foreground"
                : "text-fd-muted-foreground hover:text-fd-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="flex rounded-lg border border-fd-border bg-fd-card p-0.5 gap-0.5">
        {SDK_PACKAGES.map((p) => (
          <button
            key={p}
            onClick={() => setPkg(p)}
            className={`rounded-md px-2.5 py-1 text-xs font-mono transition-colors ${
              pkg === p
                ? "bg-fd-accent text-fd-foreground font-semibold"
                : "text-fd-muted-foreground hover:text-fd-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="flex w-full items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-3.5 py-2.5">
        <Terminal className="size-3.5 shrink-0 text-fd-muted-foreground" />
        <code className="flex-1 text-xs font-mono text-fd-foreground">{cmd}</code>
        <button
          onClick={copy}
          aria-label="Copy install command"
          className="shrink-0 text-fd-muted-foreground hover:text-fd-foreground transition-colors"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <span className="text-xs text-fd-muted-foreground">4 packages · dual ESM/CJS · Node ≥ 18</span>
    </div>
  );
}

function FooterLinks({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap justify-center gap-x-5 gap-y-2 pt-6 border-t border-fd-border w-full ${className ?? ""}`}
    >
      {EXTERNAL_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-fd-muted-foreground hover:text-fd-foreground transition-colors"
        >
          {link.label} <ExternalLink className="size-2.5" />
        </a>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage({ loaderData }: Route.ComponentProps) {
  const { version } = loaderData;

  return (
    <HomeLayout {...baseOptions()}>
      <main className="flex min-h-[calc(100vh-56px)] flex-col md:flex-row md:items-stretch">
        {/* ── Left ── */}
        <div className="flex flex-1 flex-col items-center justify-between border-b border-fd-border px-8 py-12 text-center md:border-b-0 md:border-r md:px-14 md:py-14">
          <div className="flex flex-col items-center gap-7">
            <div className="flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-3 py-1">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs text-fd-muted-foreground">v{version} · Solana</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-fd-foreground md:text-5xl">
                Streamflow
                <br />
                <span className="text-fd-primary">JS SDK</span>
              </h1>
              <p className="text-sm leading-relaxed text-fd-muted-foreground max-w-[260px]">
                Build token vesting, locks, staking pools, and Merkle airdrops on Solana.
              </p>
            </div>

            <InstallBlock />

            <div className="flex items-center gap-3">
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground hover:opacity-90 transition-opacity"
              >
                Visit Docs <ArrowRight className="size-3.5" />
              </Link>
              <a
                href="https://github.com/streamflow-finance/js-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-5 py-2.5 text-sm font-medium text-fd-foreground hover:bg-fd-accent transition-colors"
              >
                <GitFork className="size-3.5" /> View Repo
              </a>
            </div>
          </div>

          {/* Desktop footer - inside left column, pushed to bottom */}
          <FooterLinks className="hidden md:flex" />
        </div>

        {/* ── Right ── */}
        <div className="flex flex-1 flex-col justify-between px-8 py-12 md:px-14 md:py-14">
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-fd-muted-foreground">
              Documentation
            </span>
            <Cards>
              <Card
                href="/docs/getting-started"
                icon={<BookOpen className="size-4" />}
                title="Getting Started"
                description="Install, connect, and send your first stream."
              />
              <Card
                href="/docs/core-concepts/streams"
                icon={<Blocks className="size-4" />}
                title="Core Concepts"
                description="Locks, vesting, batch creation, lifecycle ops."
              />
              <Card
                href="/docs/core-concepts/streams/composable-apis"
                icon={<Zap className="size-4" />}
                title="Composable APIs"
                description="3-phase model - instructions, build, sign, execute."
              />
              <Card
                href="/docs/api/stream"
                icon={<Code2 className="size-4" />}
                title="SDK Reference"
                description="Full TypeDoc for all @streamflow packages."
              />
            </Cards>
          </div>

          <div className="flex flex-col gap-4 pt-8 border-t border-fd-border mt-8 md:mt-0">
            <span className="text-xs font-semibold uppercase tracking-widest text-fd-muted-foreground">Packages</span>
            <div className="flex flex-col gap-1.5">
              {PACKAGES.map((pkg) => (
                <Link
                  key={pkg.href}
                  to={pkg.href}
                  className="group flex items-center justify-between rounded-lg border border-fd-border bg-fd-card px-3.5 py-2.5 hover:border-fd-primary/40 hover:bg-fd-accent/30 transition-colors"
                >
                  <span className="font-mono text-xs font-medium text-fd-foreground group-hover:text-fd-primary transition-colors">
                    {pkg.name}
                  </span>
                  <span className="hidden text-xs text-fd-muted-foreground sm:block">{pkg.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile footer - after all content */}
        <div className="md:hidden px-8 pb-10">
          <FooterLinks />
        </div>
      </main>
    </HomeLayout>
  );
}
