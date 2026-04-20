import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("docs/*", "routes/docs.tsx"),
  route("api/search", "routes/search.ts"),
  route("llms.txt", "routes/llms.ts"),
  route("llms-full.txt", "routes/llms-full.ts"),
  route("llms.mdx/docs/*", "routes/docs/llms-mdx.ts"),
] satisfies RouteConfig;
