import React from 'react';

/**
 * Parses inline markdown:
 * - Bold: **text**
 * - Italic: *text*
 * - Code: `code`
 * - Links: [text](http(s)://...) - strictly validates protocol to prevent XSS
 */
function parseInline(text) {
  if (!text) return null;

  // Regex pattern matching:
  // 1: [text](url)
  // 2: **bold**
  // 3: *italic*
  // 4: `code`
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Check link: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const linkUrl = linkMatch[2].trim();
      // Strict protocol validation: only allow http:// or https://
      if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
        return (
          <a
            key={index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 font-medium decoration-current/50 hover:decoration-current hover:opacity-80 text-inherit transition-all"
          >
            {parseInline(linkText)}
          </a>
        );
      }
      // If invalid/unsafe protocol, render as safe plain text
      return <span key={index}>{linkText}</span>;
    }

    // Check bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-semibold text-inherit underline-offset-2">
          {parseInline(part.slice(2, -2))}
        </strong>
      );
    }

    // Check italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-inherit opacity-90">
          {parseInline(part.slice(1, -1))}
        </em>
      );
    }

    // Check code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded text-xs font-mono bg-black/10 dark:bg-white/10 text-inherit border border-current/20"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Pure React Markdown renderer without dangerouslySetInnerHTML.
 * Supports headings (#, ##, ###), bold, italics, code, bullet/numbered lists, tables, and links.
 * Adds dark:prose-invert for proper dark theme readability.
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    // 1. Empty lines -> Spacer
    if (!trimmed) {
      index++;
      continue;
    }

    // 2. Markdown Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${index}`}
          className="text-sm font-bold text-inherit mt-3 mb-1 opacity-95"
        >
          {parseInline(trimmed.substring(4))}
        </h3>
      );
      index++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${index}`}
          className="text-base font-bold text-inherit mt-3.5 mb-1.5"
        >
          {parseInline(trimmed.substring(3))}
        </h2>
      );
      index++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${index}`}
          className="text-lg font-bold text-inherit mt-4 mb-2"
        >
          {parseInline(trimmed.substring(2))}
        </h1>
      );
      index++;
      continue;
    }

    // 3. Markdown Tables (| col1 | col2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines = [];
      while (
        index < lines.length &&
        lines[index].trim().startsWith('|') &&
        lines[index].trim().endsWith('|')
      ) {
        tableLines.push(lines[index].trim());
        index++;
      }

      if (tableLines.length >= 2) {
        // First line is header
        const headerCells = tableLines[0]
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        // Remaining lines: skip divider if present (e.g. |---|---|)
        const rowLines = tableLines.slice(1).filter((l) => !/^\|[\s\-:|]+\|$/.test(l));

        elements.push(
          <div key={`table-${index}`} className="overflow-x-auto my-2.5">
            <table className="min-w-full text-xs text-left border border-current/20 rounded-lg overflow-hidden">
              <thead className="bg-black/5 dark:bg-white/10 text-inherit font-semibold border-b border-current/20">
                <tr>
                  {headerCells.map((h, hi) => (
                    <th key={hi} className="px-3 py-2 border-r last:border-r-0 border-current/20 text-inherit">
                      {parseInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-current/15">
                {rowLines.map((rowStr, ri) => {
                  const cells = rowStr
                    .slice(1, -1)
                    .split('|')
                    .map((c) => c.trim());
                  return (
                    <tr
                      key={ri}
                      className="even:bg-black/[0.03] dark:even:bg-white/[0.04]"
                    >
                      {cells.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-3 py-1.5 border-r last:border-r-0 border-current/15 text-inherit"
                        >
                          {parseInline(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 4. Bullet lists (* or -)
    if (/^[\*\-]\s+/.test(trimmed)) {
      const listItems = [];
      while (index < lines.length && /^[\*\-]\s+/.test(lines[index].trim())) {
        listItems.push(lines[index].trim().replace(/^[\*\-]\s+/, ''));
        index++;
      }
      elements.push(
        <ul key={`ul-${index}`} className="list-disc pl-5 space-y-1 my-1.5 text-inherit">
          {listItems.map((item, li) => (
            <li key={li}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 5. Numbered lists (1. , 2. )
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        listItems.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index++;
      }
      elements.push(
        <ol key={`ol-${index}`} className="list-decimal pl-5 space-y-1 my-1.5 text-inherit">
          {listItems.map((item, li) => (
            <li key={li}>{parseInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 6. Regular Paragraph
    elements.push(
      <p key={`p-${index}`} className="leading-relaxed text-inherit">
        {parseInline(trimmed)}
      </p>
    );
    index++;
  }

  return (
    <div className={`space-y-2 text-inherit text-xs sm:text-sm ${className}`}>
      {elements}
    </div>
  );
}
