# Security Policy

Even though this is a free and open-source software given to the community, we value security and correctness highly, and as such we want to introduce a bug-bounty program to incentivize the community to help us by auditing the code.

Program is split into 2 parts:
- [Core protocol implementation](https://github.com/streamflow-finance/timelock-crate/tree/community)
- [Anchor wrapper](https://github.com/streamflow-finance/js-sdk/tree/community)

This security policy covers only the smart contracts, not the potential UI bugs. Also any defects found in the forked versions, not deployed by Streamflow will not be covered, as we will not be able to act upon them.

## Reporting
Email us at security@streamflow.finance with a detailed description of a vulnerability. This report must come with at least a crude proof of concept, showcasing the attack. 

## Rewards

Rewards are distributed according to the following classifications:

### Severity critical

- Loss of user funds staked (principal) by freezing or theft
- Unauthorized claims of funds

10% of value at risk, up to $500,000 USD

### Severity high

- Permanent freezing of unlocked funds
- Temporary freezing of unlocked funds for at least 24 hour

Up to $50,000 USD

### Severity medium

- Block stuffing for profit
- Griefing (e.g. no profit motive for an attacker, but damage to the users or the protocol)
- Unbounded lamports consumption 

Up to $5,000 USD

This bounty is only paid out if details about the security issues have not been provided to third parties before a fix has been introduced and verified. Furthermore, the reporter is in no way allowed to exploit the issue without our explicit consent. Actual prize size is determined based on a combination of factors including but not limited to severity, value at risk, and likelihood of being exploited.

Payouts are done in vesting USDC on Solana.

## Out of Scope and Rules

The following vulnerabilities are excluded from the rewards for this bug bounty program:
- Attacks that the reporter has already exploited themselves, leading to damage
- Attacks requiring access to leaked keys/credentials
- Attacks requiring access to privileged addresses (treasury, organization’s private deploy keys)

The following activities are prohibited by this bug bounty program:
- Any testing with mainnet contracts; all testing should be done on devnet or private testnets
- Attempting phishing or other social engineering attacks against our employees and/or customers
- Any testing with third party systems and applications (e.g. browser extensions) as well as websites (e.g. SSO providers, advertising networks)
- Any denial of service attacks
- Automated testing of services that generates significant amounts of traffic
- Public disclosure of an unpatched vulnerability in an embargoed bounty
