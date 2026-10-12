import type { Citation } from '../types';

export function extractCitations(text: string): Citation[] {
  const citations: Citation[] = [];
  // Match patterns like [Source: python_ebook.pdf, Page 74] or (Source: ... Page ...)
  const regex = /\[(?:Source|Citation):\s*([a-zA-Z0-9_\-\.]+)(?:,\s*Page[\s\u202F]*([0-9]+))?\]/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const source = match[1];
    const page = match[2];
    // Avoid duplicates
    if (!citations.some((c) => c.source === source && c.page === page)) {
      citations.push({
        source,
        page: page ? Number(page) : undefined,
      });
    }
  }

  return citations;
}
