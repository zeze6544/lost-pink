/** Host and path helpers for the localsites directory, Jaws, and lost.pink. */

export const LOST_MOUNT = "/lost";
export const JAWS_MOUNT = "/jaws";

export function hostnameOf(hostHeader: string | null | undefined): string {
  const raw = (hostHeader || "").split(",")[0].trim().toLowerCase();
  return raw.split(":")[0].replace(/\.$/, "");
}

export function portOf(hostHeader: string | null | undefined): string {
  const raw = (hostHeader || "").split(",")[0].trim();
  const idx = raw.lastIndexOf(":");
  if (idx === -1) return "";
  const port = raw.slice(idx + 1);
  return /^\d+$/.test(port) ? port : "";
}

export function isLostHost(hostHeader: string | null | undefined): boolean {
  const host = hostnameOf(hostHeader);
  if (!host || host === "localhost") return false;
  if (host === "lost.pink" || host === "www.lost.pink") return true;
  return host.split(".")[0] === "lost";
}

export function isJawsHost(hostHeader: string | null | undefined): boolean {
  const host = hostnameOf(hostHeader);
  if (!host || host === "localhost") return false;
  return host.split(".")[0] === "jaws";
}

/** Prefix an in-app path when lost.pink is mounted at /lost. */
export function withBase(base: string, path: string): string {
  if (!base) return path;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return path;
  }
  const hashAt = path.indexOf("#");
  const beforeHash = hashAt === -1 ? path : path.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : path.slice(hashAt);
  const queryAt = beforeHash.indexOf("?");
  const pathname = queryAt === -1 ? beforeHash : beforeHash.slice(0, queryAt);
  const search = queryAt === -1 ? "" : beforeHash.slice(queryAt);
  if (pathname === base || pathname.startsWith(`${base}/`)) return path;
  const next = pathname === "/" ? base : `${base}${pathname}`;
  return `${next}${search}${hash}`;
}

/** Only the known preview mount is accepted from the request header. */
export function lostBaseFromHeader(value: string | null | undefined): string {
  return value === LOST_MOUNT ? LOST_MOUNT : "";
}

export function lostEntryHref(hostHeader: string | null | undefined): string {
  const host = hostnameOf(hostHeader);
  const port = portOf(hostHeader);
  const portPart = port ? `:${port}` : "";
  if (host === "localhost" || host.endsWith(".localhost")) {
    return `http://lost.localhost${portPart}/`;
  }
  if (isLostHost(hostHeader)) return "/";
  return LOST_MOUNT;
}

export function directoryHref(hostHeader: string | null | undefined): string {
  if (!isJawsHost(hostHeader) && !isLostHost(hostHeader)) return "/";
  const host = hostnameOf(hostHeader);
  const port = portOf(hostHeader);
  const portPart = port ? `:${port}` : "";
  const proto =
    host === "localhost" || host.endsWith(".localhost") ? "http" : "https";
  if (host === "lost.pink" || host === "www.lost.pink") return LOST_MOUNT;
  const apex = host.split(".").slice(1).join(".");
  if (!apex) return "/";
  return `${proto}://${apex}${portPart}/`;
}
