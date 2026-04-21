import { Link } from "react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";

export default function HomePage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4">Streamflow JS SDK Documentation</h1>
        <p className="text-lg text-fd-muted-foreground mb-8">
          Documentation for the Streamflow JavaScript SDK — interact with vesting, staking, and distribution protocols
          on Solana.
        </p>
        <div className="flex gap-4 mb-12">
          <Link to="/docs" className="rounded-lg bg-fd-primary px-6 py-3 text-fd-primary-foreground font-medium">
            Browse Documentation
          </Link>
          <Link to="/docs/api/stream" className="rounded-lg border border-fd-border px-6 py-3 font-medium">
            API Reference
          </Link>
        </div>
        <section>
          <h2 className="text-2xl font-semibold mb-4">Packages</h2>
          <ul className="space-y-2">
            <li>
              <Link to="/docs/api/common" className="text-fd-primary underline">
                @streamflow/common
              </Link>{" "}
              — Shared types and utilities
            </li>
            <li>
              <Link to="/docs/api/stream" className="text-fd-primary underline">
                @streamflow/stream
              </Link>{" "}
              — Core vesting/stream protocol
            </li>
            <li>
              <Link to="/docs/api/staking" className="text-fd-primary underline">
                @streamflow/staking
              </Link>{" "}
              — Staking pools and rewards
            </li>
            <li>
              <Link to="/docs/api/distributor" className="text-fd-primary underline">
                @streamflow/distributor
              </Link>{" "}
              — Merkle airdrop protocol
            </li>
            <li>
              <Link to="/docs/api/launchpad" className="text-fd-primary underline">
                @streamflow/launchpad
              </Link>{" "}
              — Token launchpad
            </li>
          </ul>
        </section>
      </main>
    </HomeLayout>
  );
}
