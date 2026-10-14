export const DocumentStatus = {
  COMPLETE: "COMPLETE",
  INCOMPLETE: "INCOMPLETE",
  NEEDS_REVIEW: "NEEDS_REVIEW",
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];