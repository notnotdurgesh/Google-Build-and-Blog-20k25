import React from 'react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle bullet points
      if (line.trim().startsWith('*') && !line.trim().startsWith('**')) {
        const bulletContent = line.trim().substring(1).trim();
        elements.push(
          <div key={key++} className="flex gap-2 my-1">
            <span className="text-zinc-400">•</span>
            <span>{parseInlineMarkdown(bulletContent)}</span>
          </div>
        );
      }
      // Handle numbered lists
      else if (/^\d+\./.test(line.trim())) {
        elements.push(
          <div key={key++} className="my-1">
            {parseInlineMarkdown(line)}
          </div>
        );
      }
      // Handle empty lines
      else if (line.trim() === '') {
        elements.push(<br key={key++} />);
      }
      // Handle regular text
      else {
        elements.push(
          <div key={key++} className="my-1">
            {parseInlineMarkdown(line)}
          </div>
        );
      }
    }

    return elements;
  };

  const parseInlineMarkdown = (text: string) => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    let key = 0;

    // Regex to match **bold**, *italic*, and `code`
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index));
      }

      const matched = match[0];

      // Bold: **text**
      if (matched.startsWith('**') && matched.endsWith('**')) {
        const content = matched.slice(2, -2);
        parts.push(<strong key={key++} className="font-bold text-white">{content}</strong>);
      }
      // Italic: *text*
      else if (matched.startsWith('*') && matched.endsWith('*')) {
        const content = matched.slice(1, -1);
        parts.push(<em key={key++} className="italic">{content}</em>);
      }
      // Code: `text`
      else if (matched.startsWith('`') && matched.endsWith('`')) {
        const content = matched.slice(1, -1);
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 bg-zinc-700 rounded text-xs font-mono text-indigo-300">
            {content}
          </code>
        );
      }

      currentIndex = match.index + matched.length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={className}>
      {renderMarkdown(content)}
    </div>
  );
}
