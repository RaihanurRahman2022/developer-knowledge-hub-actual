import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  inline = false,
}) => {
  const sanitizedHtml = useMemo(() => {
    if (!content) return '';
    try {
      const parsed = inline
        ? marked.parseInline(content)
        : marked.parse(content, { async: false });

      const rawHtml = typeof parsed === 'string' ? parsed : '';

      if (typeof window !== 'undefined') {
        return DOMPurify.sanitize(rawHtml, {
          ADD_ATTR: ['target', 'rel'],
        });
      }
      return rawHtml;
    } catch (e) {
      console.error('Failed to parse markdown:', e);
      return content;
    }
  }, [content, inline]);

  if (inline) {
    return (
      <span
        className={`markdown-content inline-markdown ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};
