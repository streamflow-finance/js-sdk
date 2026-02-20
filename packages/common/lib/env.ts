export const isDev: boolean =
  process.env?.NODE_ENV === "development" ||
  // @ts-expect-error - import.meta.env is not defined in the type definitions
  import.meta.env?.NODE_ENV === "development" ||
  // @ts-expect-error - import.meta.env is not defined in the type definitions
  (import.meta.env?.DEV ?? false);
