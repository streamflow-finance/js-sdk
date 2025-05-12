# Contributions

## Contributing
1. Fork the repository
2. Clone your forked repository
3. Navigate to the `/packages` folder
4. Install dependencies using pnpm:
   ```bash
   pnpm install
   ```
5. Build the project:
   ```bash
   pnpm build
   ```
6. Make your changes
7. Commit and push your changes
8. Create a pull request

Please ensure that you have [pnpm](https://pnpm.io/) installed on your system before contributing.

## Alpha releases

Alpha releases provide early access to new features and fixes for testing purposes. They are automatically published to NPM under the `alpha` dist-tag when specific conditions are met.

**How to Trigger an Alpha Release:**

1.  Create a feature branch with a name starting with `alpha/` (e.g., `alpha/my-new-feature`).
2.  Make your code changes, commit them, and push the branch to your fork.
3.  Create a Pull Request (PR) from your `alpha/*` branch targeting the `master` branch of the main repository.

Once the PR is opened and the required tests pass, the `Alpha Release` workflow will automatically run.

**The Workflow:**

*   The workflow checks out your code.
*   It determines the base version from `lerna.json`.
*   It calculates the alpha version using the pattern: `{base_version}-alpha.p{PR_NUMBER}.{SHORT_GIT_SHA}`.
    *   **Example:** If the base version is `1.2.3`, the PR number is `456`, and the short commit SHA is `abcdef0`, the alpha version will be `1.2.3-alpha.p456.abcdef0`.
*   It modifies the `lerna.json` and package `package.json` files locally within the workflow runner to use this alpha version.
*   It builds all packages using these modified versions.
*   It publishes the packages to NPM with the `--dist-tag alpha` flag.
*   It adds or updates a comment on the PR with the published version number and a link to the NPM package page.

**Important:** The version bump happens *only* within the workflow run to facilitate the build and publish. The changes to `lerna.json` and `package.json` are **not** committed or pushed back to your PR branch.

**How to Skip an Alpha Release for a Specific Commit:**

If you need to push minor changes (like documentation updates or chore tasks) to your `alpha/*` branch *without* triggering a new NPM publish, include the exact string `[skip alpha]` anywhere in your commit message for the latest commit you push.

```bash
git commit -m "docs: update readme [skip alpha]"
```

The workflow will still run the tests, but the `check-commit-message` job will detect the skip string, and the `publish-alpha` job (which handles versioning, building, and publishing) will be skipped.

**Accessing Alpha Versions:**

To install an alpha version of a package, use the `@alpha` tag:

```bash
npm install @streamflow/common@alpha
# or specific version
npm install @streamflow/common@1.2.3-alpha.p456.abcdef0
```