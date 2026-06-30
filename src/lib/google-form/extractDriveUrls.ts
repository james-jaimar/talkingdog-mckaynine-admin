// Extract any Google Drive URLs found anywhere inside a Google Form payload.
// Used so admins can click straight through to Shannon's shared Drive folder
// (Ady already has access via the share, so no auth/proxy is needed).

const DRIVE_URL_REGEX = /https?:\/\/(?:drive|docs)\.google\.com\/[^\s"'<>)]+/gi;
const FILE_ID_REGEX = /^[a-zA-Z0-9_-]{20,}$/;

function fileIdToUrl(id: string): string {
  return `https://drive.google.com/file/d/${id}/view`;
}

function collect(value: unknown, out: Set<string>): void {
  if (value == null) return;
  if (typeof value === "string") {
    const matches = value.match(DRIVE_URL_REGEX);
    if (matches) matches.forEach((m) => out.add(m));
    // Apps Script may also hand us a raw file id for FILE_UPLOAD questions.
    else if (FILE_ID_REGEX.test(value.trim())) out.add(fileIdToUrl(value.trim()));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collect(v, out));
    return;
  }
  if (typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((v) => collect(v, out));
  }
}

export function extractDriveUrls(payload: unknown): string[] {
  const out = new Set<string>();
  collect(payload, out);
  return Array.from(out);
}
