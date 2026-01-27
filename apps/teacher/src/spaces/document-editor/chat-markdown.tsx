import ReactMarkdown, { type Components } from "react-markdown";

interface ChatMarkdownProps {
  content: string;
}

const components: Components = {
  // Headings - scale down for chat context
  h1: ({ children }) => (
    <h3 className="mb-2 mt-3 text-base font-semibold first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h4 className="mb-2 mt-3 text-sm font-semibold first:mt-0">{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 className="mb-1.5 mt-2 text-sm font-medium first:mt-0">{children}</h5>
  ),
  h4: ({ children }) => (
    <h6 className="mb-1 mt-2 text-sm font-medium first:mt-0">{children}</h6>
  ),
  h5: ({ children }) => (
    <h6 className="mb-1 mt-2 text-sm font-medium first:mt-0">{children}</h6>
  ),
  h6: ({ children }) => (
    <h6 className="mb-1 mt-2 text-sm font-medium first:mt-0">{children}</h6>
  ),

  // Paragraphs
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,

  // Links - open in new tab
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:no-underline"
    >
      {children}
    </a>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-current/30 pl-3 italic opacity-90">
      {children}
    </blockquote>
  ),

  // Inline code
  code: ({ children, className }) => {
    // Check if this is a code block (has language class) vs inline code
    const isCodeBlock = className?.includes("language-");
    if (isCodeBlock) {
      return (
        <code className="block overflow-x-auto rounded bg-black/10 p-2 text-xs">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-black/10 px-1 py-0.5 text-[0.9em]">
        {children}
      </code>
    );
  },

  // Code blocks
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded bg-black/10 p-2 text-xs last:mb-0">
      {children}
    </pre>
  ),

  // Emphasis
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em>{children}</em>,

  // Horizontal rule
  hr: () => <hr className="my-3 border-current/20" />,
};

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="prose-sm max-w-none">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
