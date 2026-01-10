/**
 * Wraps HTML content with styles needed for proper email preview rendering.
 * This ensures tables, colors, alignment, and other TipTap formatting displays correctly.
 */
export function wrapWithPreviewStyles(htmlContent: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1a1a1a;
      padding: 20px;
      margin: 0;
      background: white;
    }
    
    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.3;
    }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    
    /* Paragraphs */
    p {
      margin: 0.5em 0;
    }
    
    /* Lists */
    ul, ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }
    li {
      margin: 0.25em 0;
    }
    
    /* Links */
    a {
      color: #2563eb;
      text-decoration: underline;
    }
    
    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f3f4f6;
      font-weight: 600;
    }
    tr:nth-child(even) td {
      background-color: #f9fafb;
    }
    
    /* Text alignment */
    [style*="text-align: center"], .text-center {
      text-align: center;
    }
    [style*="text-align: right"], .text-right {
      text-align: right;
    }
    [style*="text-align: left"], .text-left {
      text-align: left;
    }
    
    /* Highlight/marks */
    mark {
      padding: 0.125em 0.25em;
      border-radius: 0.125em;
    }
    
    /* Strong/Bold */
    strong, b {
      font-weight: 600;
    }
    
    /* Italic */
    em, i {
      font-style: italic;
    }
    
    /* Underline */
    u {
      text-decoration: underline;
    }
    
    /* Code */
    code {
      background-color: #f3f4f6;
      padding: 0.125em 0.25em;
      border-radius: 0.25em;
      font-family: monospace;
      font-size: 0.9em;
    }
    
    /* Blockquote */
    blockquote {
      border-left: 3px solid #d1d5db;
      margin: 1em 0;
      padding-left: 1em;
      color: #4b5563;
    }
    
    /* Horizontal rule */
    hr {
      border: none;
      border-top: 1px solid #d1d5db;
      margin: 1.5em 0;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
  `.trim();
}
