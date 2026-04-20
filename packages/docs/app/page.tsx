import Link from "next/link";

const packages = [
  { name: "@streamflow/common", href: "/docs/api/common", description: "Shared types and utilities" },
  { name: "@streamflow/stream", href: "/docs/api/stream", description: "Core vesting/stream protocol" },
  { name: "@streamflow/staking", href: "/docs/api/staking", description: "Staking pools and rewards" },
  { name: "@streamflow/distributor", href: "/docs/api/distributor", description: "Merkle airdrop protocol" },
  { name: "@streamflow/launchpad", href: "/docs/api/launchpad", description: "Token launchpad" },
];

export default function HomePage() {
  return (
    <main>
      <h1>Streamflow JS SDK Documentation</h1>
      <p>
        Documentation for the Streamflow JavaScript SDK — interact with vesting, staking, and distribution protocols on
        Solana.
      </p>
      <div>
        <Link href="/docs">Browse Documentation</Link>
        <Link href="/docs/api/stream">API Reference</Link>
      </div>
      <section>
        <h2>Packages</h2>
        <ul>
          {packages.map((pkg) => (
            <li key={pkg.name}>
              <Link href={pkg.href}>{pkg.name}</Link> — {pkg.description}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
