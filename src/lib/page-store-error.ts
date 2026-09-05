export function pageStoreProblem(
  error: unknown,
): { error: string; status: number } | null {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message).toLowerCase()
      : "";

  if (
    code === "23514" &&
    (message.includes("pages_palette_check") || message.includes("palette"))
  ) {
    return {
      error: "that color isn't available yet. choose another and try again.",
      status: 400,
    };
  }
  if (code === "23505") {
    return { error: "that name is already spoken for.", status: 409 };
  }
  return null;
}
