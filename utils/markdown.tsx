import React from 'react';

export const formatText = (text: string) => {
  // Simple regex-based splitter for code blocks
  const parts = text.split(/```(\w+)?\n([\s\S]*?)```/g);

  // If no code blocks, check for inline code
  if (parts.length === 1) {
      return renderInline(parts[0]);
  }

  return parts.map((part, index) => {
    // The split logic creates: [text, lang, code, text, lang, code, ...]
    // But since `lang` is optional group, we need to be careful with indices.
    // However, a simple split by ``` gives odd indices as code blocks usually if no lang group
    // Let's use a simpler robust approach manually iterating might be safer, 
    // but let's try a simpler split for visual purposes.
    
    // Actually, the above regex split behaves like this:
    // [pre-text, lang, code, post-text, ...]
    // So index % 3 === 0 is text.
    // index % 3 === 1 is lang.
    // index % 3 === 2 is code.
    
    if (index % 3 === 0) {
      // Regular text
      return <span key={index}>{renderInline(part)}</span>;
    } 
    if (index % 3 === 1) {
        // Language identifier (skip rendering, used in next block)
        return null;
    }
    if (index % 3 === 2) {
      // Code block
      const lang = parts[index - 1] || 'text';
      return (
        <div key={index} className="my-4 rounded-lg overflow-hidden bg-gray-900 border border-gray-700 shadow-sm">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <span className="text-xs font-mono text-gray-400 lowercase">{lang}</span>
            <span className="text-xs text-gray-500">Code</span>
          </div>
          <div className="p-4 overflow-x-auto">
            <pre className="font-mono text-sm text-gray-300">
              <code>{part}</code>
            </pre>
          </div>
        </div>
      );
    }
    return null;
  });
};

const renderInline = (text: string) => {
    // Handle **bold** and `code`
    if (!text) return null;

    // Split by bold
    const boldParts = text.split(/\*\*(.*?)\*\*/g);
    return boldParts.map((part, i) => {
        if (i % 2 === 1) {
            return <strong key={i} className="font-bold text-blue-200">{part}</strong>;
        }
        // Split by inline code
        const codeParts = part.split(/`(.*?)`/g);
        return (
            <span key={i}>
                {codeParts.map((cp, j) => {
                    if (j % 2 === 1) {
                        return <code key={j} className="bg-gray-800 text-pink-300 px-1.5 py-0.5 rounded text-sm font-mono">{cp}</code>
                    }
                    return <span key={j} className="whitespace-pre-wrap">{cp}</span>
                })}
            </span>
        );
    });
}