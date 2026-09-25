// components/MarkdownMessage.tsx
import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
}) => {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-lg font-bold text-gray-900 mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            {children}
          </h2>
        ),
        p: ({ children }) => (
          <p className="text-sm text-gray-700 mb-3 last:mb-0 leading-relaxed">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="text-sm list-disc list-inside mb-3 space-y-3">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-3 space-y-3">
            {children}
          </ol>
        ),
        code: ({ children }) => (
          <code className="text-sm bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono">
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="text-sm border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
