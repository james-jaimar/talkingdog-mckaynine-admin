
export function getCurrentTermString(termData: { term_number?: any; year?: any } | null | undefined): string {
  if (
    termData &&
    typeof termData === "object" &&
    "term_number" in termData &&
    "year" in termData &&
    termData.term_number &&
    termData.year
  ) {
    return `Term ${termData.term_number} ${termData.year}`;
  }
  return "Current term";
}
