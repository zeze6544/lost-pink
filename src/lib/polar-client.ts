import { Polar } from "@polar-sh/sdk";

export function polarServer(): "sandbox" | "production" {
  return process.env.POLAR_SERVER === "production" ? "production" : "sandbox";
}

export function getPolar(): Polar | null {
  if (!process.env.POLAR_ACCESS_TOKEN) return null;
  return new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    server: polarServer(),
  });
}
