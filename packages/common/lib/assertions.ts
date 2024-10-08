const prefix = "Assertion failed";
export const invariant: (condition: any, message?: string | (() => string)) => asserts condition = (
  condition,
  message,
) => {
  if (condition) {
    return;
  }
  const provided: string | undefined = typeof message === "function" ? message() : message;
  const value: string = provided ? `${prefix}: ${provided}` : prefix;
  throw new Error(value);
};
