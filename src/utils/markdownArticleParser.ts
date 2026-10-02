import { ArticleContentSection, ArticleBlock } from '../types';

export type HeadingSplitLevel = 'auto' | 'h3' | 'h2' | 'h1';

/**
 * Parses a raw Markdown string into structured ArticleContentSections
 * suitable for the Article Details & Notes section.
 * Automatically recognizes interview questions, code blocks, accordions, and text.
 */
export function parseMarkdownToArticleSections(
  markdown: string,
  splitLevel: HeadingSplitLevel = 'auto'
): ArticleContentSection[] {
  const trimmed = markdown.trim();
  if (!trimmed) return [];

  // Determine split regex based on selected level or auto-detection
  let regex: RegExp | null = null;

  if (splitLevel === 'h3') {
    regex = /(?=^###\s+)/m;
  } else if (splitLevel === 'h2') {
    regex = /(?=^##\s+)/m;
  } else if (splitLevel === 'h1') {
    regex = /(?=^#\s+)/m;
  } else {
    // Auto-detection: prioritize ###, then ##, then #
    if (/(?:^|\n)###\s+/.test(trimmed)) {
      regex = /(?=^###\s+)/m;
    } else if (/(?:^|\n)##\s+/.test(trimmed)) {
      regex = /(?=^##\s+)/m;
    } else if (/(?:^|\n)#\s+/.test(trimmed)) {
      regex = /(?=^#\s+)/m;
    }
  }

  const parts = regex ? trimmed.split(regex) : [trimmed];
  const sections: ArticleContentSection[] = [];
  const timestamp = Date.now();

  parts.forEach((part, idx) => {
    let pTrim = part.trim();
    if (!pTrim) return;

    // Clean up trailing and leading horizontal rules (---)
    pTrim = pTrim.replace(/^---\s*\n*/, '').replace(/\n*---\s*$/, '').trim();
    if (!pTrim) return;

    let title = `Section ${idx + 1}`;
    let body = pTrim;

    // Check if the part starts with a heading (# Title, ## Title, ### Title, #### Title)
    const match = pTrim.match(/^(#{1,4})\s+(.+)$/m);
    if (match && pTrim.startsWith(match[1])) {
      title = match[2].trim();
      body = pTrim.slice(match[0].length).trim();
      // Remove any lingering horizontal rules right after heading
      body = body.replace(/^---\s*\n*/, '').replace(/\n*---\s*$/, '').trim();
    }

    const secId = `sec-md-${timestamp}-${idx}`;
    const blocks = parseBodyIntoBlocks(secId, title, body);

    sections.push({
      id: secId,
      title: title,
      content: body,
      blocks: blocks,
    });
  });

  return sections;
}

/**
 * Parses a section's markdown body into structured ArticleBlocks:
 * - Collapsible Question blocks (interview Q&A)
 * - Collapsible Accordion blocks (<details><summary>...</summary>)
 * - Code blocks (```lang ... ```)
 * - Text blocks (paragraphs, markdown tables, bullet points)
 */
function parseBodyIntoBlocks(secId: string, sectionTitle: string, body: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const cleanBody = body.replace(/\n*---\s*$/g, '').trim();

  if (!cleanBody) {
    return [
      {
        id: `blk-${secId}-init`,
        type: 'text',
        text: 'Add section notes and technical content here.',
      },
    ];
  }

  // 1. Check if section contains Interview Questions (e.g. **Q1: ...**, **Q: ...**, #### Q1: ...)
  const qRegex = /(?:^|\n)(?:\*\*(?:Q\d*|Question\s*\d*):?\s*(.+?)\*\*|#{2,4}\s*(?:Q\d*|Question\s*\d*):?\s*(.+?)$)/gm;
  const qMatches = [...cleanBody.matchAll(qRegex)];

  if (qMatches.length > 0) {
    // If there is intro text before the first question, preserve it as a text block
    const firstMatchIdx = qMatches[0].index;
    if (firstMatchIdx > 0) {
      const intro = cleanBody.slice(0, firstMatchIdx).trim();
      if (intro) {
        blocks.push({
          id: `blk-${secId}-intro`,
          type: 'text',
          text: intro,
        });
      }
    }

    qMatches.forEach((m, qIdx) => {
      const questionText = (m[1] || m[2] || `Question ${qIdx + 1}`).trim();
      const startIndex = m.index + m[0].length;
      const endIndex = qIdx + 1 < qMatches.length ? qMatches[qIdx + 1].index : cleanBody.length;
      const qBody = cleanBody.slice(startIndex, endIndex).trim();

      let shortAnswer = '';
      let detailedAnswer = '';
      let tips = '';

      // Pattern 1: 30-Second Summary Answer / Short Answer
      const shortMatch = qBody.match(
        /(?:\*?\s*\*\*(?:30-Second|30\s*Second|Short|Quick)[^:]*:\*\*\s*)([\s\S]*?)(?=(?:\*?\s*\*\*Detailed|\*?\s*\*\*Tip|\*?\s*\*\*Interviewer|$))/i
      );
      // Pattern 2: Detailed Technical Answer / Detailed Nuances
      const detailedMatch = qBody.match(
        /(?:\*?\s*\*\*(?:Detailed|Technical|Deep)[^:]*:\*\*\s*)([\s\S]*?)(?=(?:\*?\s*\*\*Tip|\*?\s*\*\*Interviewer|\*?\s*\*\*30-Second|$))/i
      );
      // Pattern 3: Interviewer Tip
      const tipMatch = qBody.match(
        /(?:\*?\s*\*\*(?:Tip|Interviewer\s*Tip)[^:]*:\*\*\s*|💡\s*)([\s\S]*?)$/i
      );

      if (shortMatch) shortAnswer = shortMatch[1].trim();
      if (detailedMatch) detailedAnswer = detailedMatch[1].trim();
      if (tipMatch) tips = tipMatch[1].trim();

      // If neither labeled pattern matched, use the entire question body as the answer
      if (!shortAnswer && !detailedAnswer) {
        detailedAnswer = qBody;
      }

      blocks.push({
        id: `blk-${secId}-q-${qIdx}`,
        type: 'question',
        question: questionText,
        shortAnswer: shortAnswer || detailedAnswer.slice(0, 160) + '...',
        detailedAnswer: detailedAnswer || shortAnswer,
        tips: tips || undefined,
      });
    });

    return blocks;
  }

  // 2. Check for HTML <details><summary>...</summary>...</details> accordions
  if (cleanBody.includes('<details>')) {
    const detailsRegex = /<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = detailsRegex.exec(cleanBody)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = cleanBody.slice(lastIndex, match.index).trim();
        if (textBefore) {
          blocks.push({
            id: `blk-${secId}-txt-${blocks.length}`,
            type: 'text',
            text: textBefore,
          });
        }
      }

      blocks.push({
        id: `blk-${secId}-acc-${blocks.length}`,
        type: 'accordion',
        accordionTitle: match[1].trim() || 'Details',
        accordionContent: match[2].trim(),
      });

      lastIndex = detailsRegex.lastIndex;
    }

    if (lastIndex < cleanBody.length) {
      const remaining = cleanBody.slice(lastIndex).trim();
      if (remaining) {
        blocks.push({
          id: `blk-${secId}-txt-end`,
          type: 'text',
          text: remaining,
        });
      }
    }

    if (blocks.length > 0) return blocks;
  }

  // 3. Standard parsing: split by Code Fences (```lang ... ```)
  const codeSplit = cleanBody.split(/(```[\s\S]*?```)/g);

  codeSplit.forEach((cPart, cIdx) => {
    const cTrim = cPart.trim();
    if (!cTrim) return;

    if (cTrim.startsWith('```')) {
      const lines = cTrim.split('\n');
      const firstLine = lines[0] || '```';
      const lang = firstLine.replace('```', '').trim() || 'csharp';
      const codeLines = lines.slice(1);
      if (codeLines.length > 0 && codeLines[codeLines.length - 1].trim() === '```') {
        codeLines.pop();
      }
      const code = codeLines.join('\n');

      blocks.push({
        id: `blk-${secId}-code-${cIdx}`,
        type: 'code',
        language: lang,
        code: code,
        codeTitle: `${sectionTitle} Code Snippet`,
      });
    } else {
      blocks.push({
        id: `blk-${secId}-text-${cIdx}`,
        type: 'text',
        text: cTrim,
      });
    }
  });

  if (blocks.length === 0) {
    blocks.push({
      id: `blk-${secId}-text-fallback`,
      type: 'text',
      text: cleanBody,
    });
  }

  return blocks;
}

/**
 * Converts existing ArticleContentSections into a consolidated, clean Markdown string.
 */
export function exportArticleSectionsToMarkdown(
  sections: ArticleContentSection[],
  headingPrefix: string = '###'
): string {
  if (!sections || sections.length === 0) return '';

  return sections
    .map((sec, idx) => {
      const title = sec.title || `Section ${idx + 1}`;
      let body = '';

      if (sec.blocks && sec.blocks.length > 0) {
        body = sec.blocks
          .map((b, bIdx) => {
            switch (b.type) {
              case 'code':
                return `\`\`\`${b.language || 'csharp'}\n${b.code || ''}\n\`\`\``;
              case 'image':
                return `![${b.imageTitle || 'Image'}](${b.imageUrl || ''})`;
              case 'diagram':
                return `\`\`\`text\n${b.diagramContent || ''}\n\`\`\`\n*${b.diagramCaption || b.diagramTitle || ''}*`;
              case 'callout':
                return `> **${b.calloutTitle || 'Note'}** (${b.calloutType || 'info'})\n> ${b.calloutContent || ''}`;
              case 'question':
                return `**Q${bIdx + 1}: ${b.question || ''}**\n\n* **30-Second Summary Answer:** ${b.shortAnswer || ''}\n\n* **Detailed Technical Answer:** ${b.detailedAnswer || ''}${b.tips ? `\n\n* **Interviewer Tip:** ${b.tips}` : ''}`;
              case 'link':
                return `[${b.linkTitle || b.linkUrl}](${b.linkUrl || ''})`;
              case 'checklist':
                return `- [${b.checked ? 'x' : ' '}] ${b.checklistText || ''}`;
              case 'accordion':
                return `<details>\n<summary>${b.accordionTitle || 'Details'}</summary>\n\n${b.accordionContent || ''}\n</details>`;
              case 'text':
              default:
                return b.text || '';
            }
          })
          .join('\n\n');
      } else {
        body = sec.content || '';
      }

      return `${headingPrefix} ${title}\n\n${body.trim()}`;
    })
    .join('\n\n---\n\n');
}
