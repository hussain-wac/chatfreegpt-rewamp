import { useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { removeTaskMarkers } from "../services/api";
import {
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  UserIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export function Message({ message, onExecuteTask }) {
  const {
    role,
    content,
    cleanContent,
    tasks,
    isStreaming,
    isSearching,
    images,
    sources,
    videoData,
  } = message;
  const displayContent = cleanContent || removeTaskMarkers(content || "");

  const isUser = role === "user";

  return (
    <div
      className={`
      group relative flex gap-3 sm:gap-4 px-3 sm:px-5 py-4 sm:py-5 rounded-2xl
      transition-colors duration-200
      ${isUser ? "bg-transparent" : "bg-gray-800/30"}
    `}
    >
      {/* Avatar */}
      <div
        className={`
        w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0
        transition-transform duration-200 group-hover:scale-105
        ${
          isUser
            ? "bg-blue-500/20 ring-1 ring-blue-500/30"
            : "bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20"
        }
      `}
      >
        {isUser ? (
          <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
        ) : (
          <SparklesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {/* Role label */}
        <span
          className={`text-xs font-medium mb-1 block ${isUser ? "text-blue-400" : "text-purple-400"}`}
        >
          {isUser ? "You" : "ChatFreeGPT"}
        </span>

        {/* Searching indicator */}
        {isSearching && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl animate-pulse">
            <svg
              className="w-4 h-4 text-blue-400 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-sm text-blue-400">Searching the web...</span>
          </div>
        )}

        {/* Image gallery from web search */}
        {images && images.length > 0 && <ImageGallery images={images} />}

        {/* Waiting for response indicator (no content yet) */}
        {isStreaming && !isSearching && !displayContent && !videoData && (
          <div className="flex items-center gap-2 py-1">
            <div className="flex gap-1.5">
              <span className="typing-dot w-1.5 h-1.5 bg-purple-400 rounded-full" />
              <span className="typing-dot w-1.5 h-1.5 bg-purple-400 rounded-full" />
              <span className="typing-dot w-1.5 h-1.5 bg-purple-400 rounded-full" />
            </div>
            <span className="text-sm text-gray-500">Thinking...</span>
          </div>
        )}

        {/* YouTube video player */}
        {videoData && videoData.videoId && (
          <YouTubePlayer videoData={videoData} />
        )}

        <MessageContent
          content={displayContent}
          isUser={isUser}
          sources={sources}
        />

        {/* Source links from web search */}
        {sources && sources.length > 0 && !isStreaming && (
          <SourcesList sources={sources} />
        )}

        {/* Streaming indicator (content is flowing) */}
        {isStreaming && !isSearching && displayContent && !videoData && (
          <div className="flex gap-1.5 mt-3">
            <span className="typing-dot w-1.5 h-1.5 bg-purple-400 rounded-full" />
            <span className="typing-dot w-1.5 h-1.5 bg-purple-400 rounded-full" />
            <span className="typing-dot w-1.5 h-1.5 bg-purple-400 rounded-full" />
          </div>
        )}

        {/* Task buttons */}
        {tasks && tasks.length > 0 && !isStreaming && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {tasks.map((task, index) => (
              <TaskButton
                key={index}
                type={task.type}
                params={task.params}
                onClick={() => onExecuteTask(task.type, task.params)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ImageGallery({ images }) {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelectedImage(img)}
            className="flex-shrink-0 group/img relative rounded-xl overflow-hidden
              border border-gray-700/50 hover:border-gray-500/50
              transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]
              shadow-lg hover:shadow-xl"
          >
            <img
              src={img.thumbnail || img.image}
              alt={img.title}
              className="w-28 h-28 sm:w-36 sm:h-36 object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
              opacity-0 group-hover/img:opacity-100 transition-opacity duration-200"
            />
            <span
              className="absolute bottom-1 left-1 right-1 text-[10px] text-white truncate
              opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 px-1"
            >
              {img.title}
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.image}
              alt={selectedImage.title}
              className="w-full h-full max-h-[80vh] object-contain rounded-2xl"
            />
            <div className="mt-2 flex items-center justify-between px-1">
              <p className="text-sm text-gray-300 truncate flex-1 mr-4">
                {selectedImage.title}
              </p>
              <div className="flex gap-2 flex-shrink-0">
                {selectedImage.source && (
                  <a
                    href={selectedImage.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 bg-gray-800/80 rounded-lg border border-gray-700/50 transition-colors"
                  >
                    Source
                  </a>
                )}
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-xs text-gray-400 hover:text-white px-3 py-1.5 bg-gray-800/80 rounded-lg border border-gray-700/50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function YouTubePlayer({ videoData }) {
  const iframeRef = useRef(null);
  const { videoId, videoUrl, query } = videoData;

  const handleFullscreen = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      } else if (iframe.webkitRequestFullscreen) {
        iframe.webkitRequestFullscreen();
      }
    }
  }, []);

  const handleOpenYouTube = useCallback(() => {
    window.open(videoUrl, "_blank");
  }, [videoUrl]);

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-gray-700/50 bg-black/40">
      {/* Video embed */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={query || "YouTube video"}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          frameBorder="0"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 border-t border-gray-700/50">
        <span className="text-xs text-gray-400 truncate flex-1 mr-2">
          {query}
        </span>
        <button
          onClick={handleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            text-gray-300 hover:text-white hover:bg-gray-700/50
            border border-gray-600/40 hover:border-gray-500/50
            transition-all duration-200 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5v3a1 1 0 01-2 0V4zM13 3a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-2 0V5h-1a1 1 0 01-1-1zM3 13a1 1 0 011 1v2h3a1 1 0 010 2H4a1 1 0 01-1-1v-3a1 1 0 011-1zM15 13a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 010-2h2v-2a1 1 0 011-1z" />
          </svg>
          Fullscreen
        </button>
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpenYouTube}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            text-red-300 hover:text-red-200 hover:bg-red-500/10
            border border-red-500/30 hover:border-red-400/50
            transition-all duration-200 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          Open in YouTube
        </a>
      </div>
    </div>
  );
}

function SourcesList({ sources }) {
  return (
    <div className="mt-4 pt-3 border-t border-gray-700/40">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((src) => (
          <a
            key={src.number}
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
              bg-gray-800/60 border border-gray-700/50 text-blue-400
              hover:bg-gray-700/60 hover:border-blue-500/30 hover:text-blue-300
              transition-all duration-200 group max-w-[280px]"
            title={src.url}
          >
            <span
              className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px]
              font-bold flex items-center justify-center flex-shrink-0"
            >
              {src.number}
            </span>
            <span className="truncate">{src.title}</span>
            <svg
              className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
        transition-all duration-200 active:scale-95
        ${
          copied
            ? "bg-green-500/10 text-green-400"
            : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
        }
      `}
      title={copied ? "Copied!" : "Copy code"}
    >
      {copied ? (
        <>
          <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <ClipboardDocumentIcon className="w-3.5 h-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function CodeBlock({ children, className, ...props }) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");

  return (
    <div className="code-block-wrapper rounded-xl overflow-hidden my-3 border border-gray-700/50 shadow-lg">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-gray-500 font-mono ml-1">
            {language || "text"}
          </span>
        </div>
        <CopyButton text={codeString} />
      </div>
      {/* Code content */}
      <SyntaxHighlighter
        style={oneDark}
        language={language || "text"}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: "#0d1117",
          fontSize: "0.8125rem",
          lineHeight: "1.6",
        }}
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

/**
 * Convert [n] citation references in text into clickable source badges.
 * Processes React children recursively — only transforms string nodes.
 */
function renderWithCitations(children, sourceMap) {
  if (!sourceMap || Object.keys(sourceMap).length === 0) return children;

  const processNode = (node) => {
    if (typeof node === "string") {
      // Split on [1], [2], etc.
      const parts = node.split(/(\[\d+\])/g);
      if (parts.length === 1) return node;

      return parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (match) {
          const num = parseInt(match[1], 10);
          const src = sourceMap[num];
          if (src) {
            return (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-4.5 h-4.5 mx-0.5
                  rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold
                  hover:bg-blue-500/30 hover:text-blue-300 transition-colors
                  align-super cursor-pointer no-underline"
                title={`${src.title} — ${src.url}`}
              >
                {num}
              </a>
            );
          }
        }
        return part;
      });
    }

    // If it's a React element with children, recurse into it
    if (node && typeof node === "object" && node.props && node.props.children) {
      return {
        ...node,
        props: {
          ...node.props,
          children: processChildren(node.props.children),
        },
      };
    }

    return node;
  };

  const processChildren = (children) => {
    if (Array.isArray(children)) {
      return children.flatMap(processNode);
    }
    return processNode(children);
  };

  return processChildren(children);
}

function MessageContent({ content, isUser, sources }) {
  if (!content) return null;

  if (isUser) {
    return (
      <div className="text-gray-200 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
        {content}
      </div>
    );
  }

  // Build a lookup map from source number to URL
  const sourceMap = {};
  if (sources && sources.length > 0) {
    sources.forEach((s) => {
      sourceMap[s.number] = s;
    });
  }

  return (
    <div className="markdown-body text-gray-200 leading-relaxed text-sm sm:text-base">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = match || String(children).includes("\n");

            if (isBlock) {
              return (
                <CodeBlock className={className} {...props}>
                  {children}
                </CodeBlock>
              );
            }

            return (
              <code
                className="bg-gray-700/60 px-1.5 py-0.5 rounded-md text-[0.8125rem] font-mono text-pink-300 border border-gray-600/30"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
          a({ href, children, ...props }) {
            // If the AI generated a link, try to match it to a real source URL
            let finalHref = href;
            if (sources && sources.length > 0) {
              // Check if any source URL matches (partial match to handle hallucinated variations)
              const matchedSource = sources.find((s) => {
                try {
                  const srcHost = new URL(s.url).hostname;
                  const linkHost = new URL(href).hostname;
                  return srcHost === linkHost;
                } catch {
                  return false;
                }
              });
              if (matchedSource) finalHref = matchedSource.url;
            }
            return (
              <a
                href={finalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 decoration-blue-400/30 hover:decoration-blue-300/60 transition-colors"
                {...props}
              >
                {children}
              </a>
            );
          },
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-gray-700/50">
                <table className="min-w-full" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ children, ...props }) {
            return (
              <thead className="bg-gray-800/60" {...props}>
                {children}
              </thead>
            );
          },
          th({ children, ...props }) {
            return (
              <th
                className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-gray-300 border-b border-gray-700/50"
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ children, ...props }) {
            return (
              <td
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-300 border-b border-gray-700/30"
                {...props}
              >
                {children}
              </td>
            );
          },
          ul({ children, ...props }) {
            return (
              <ul className="list-disc pl-5 sm:pl-6 my-2 space-y-1" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }) {
            return (
              <ol
                className="list-decimal pl-5 sm:pl-6 my-2 space-y-1"
                {...props}
              >
                {children}
              </ol>
            );
          },
          li({ children, ...props }) {
            return (
              <li className="text-gray-300 leading-relaxed" {...props}>
                {renderWithCitations(children, sourceMap)}
              </li>
            );
          },
          blockquote({ children, ...props }) {
            return (
              <blockquote
                className="border-l-3 border-blue-500/50 pl-4 my-4 py-1 bg-blue-500/5 rounded-r-xl"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          h1({ children, ...props }) {
            return (
              <h1
                className="text-xl sm:text-2xl font-bold text-gray-100 mt-6 mb-3"
                {...props}
              >
                {children}
              </h1>
            );
          },
          h2({ children, ...props }) {
            return (
              <h2
                className="text-lg sm:text-xl font-bold text-gray-100 mt-5 mb-2"
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3({ children, ...props }) {
            return (
              <h3
                className="text-base sm:text-lg font-semibold text-gray-200 mt-4 mb-2"
                {...props}
              >
                {children}
              </h3>
            );
          },
          p({ children, ...props }) {
            return (
              <p className="my-2 text-gray-200 leading-relaxed" {...props}>
                {renderWithCitations(children, sourceMap)}
              </p>
            );
          },
          hr({ ...props }) {
            return <hr className="my-6 border-gray-700/50" {...props} />;
          },
          strong({ children, ...props }) {
            return (
              <strong className="font-semibold text-gray-100" {...props}>
                {children}
              </strong>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function TaskButton({ type, params, onClick }) {
  const config = {
    youtube: {
      icon: "▶",
      label: "Play on YouTube",
      className:
        "border-red-500/30 hover:bg-red-500/10 hover:border-red-400/50 text-red-300",
    },
    gmail: {
      icon: "✉",
      label: "Open Gmail",
      className:
        "border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-400/50 text-orange-300",
    },
    search: {
      icon: "🔍",
      label: "Search Web",
      className:
        "border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-400/50 text-blue-300",
    },
    open: {
      icon: "🔗",
      label: "Open Link",
      className:
        "border-green-500/30 hover:bg-green-500/10 hover:border-green-400/50 text-green-300",
    },
  };

  const { icon, label, className } = config[type] || {
    icon: "⚡",
    label: type,
    className: "border-gray-500/30 hover:bg-gray-500/10 text-gray-300",
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl
        border text-xs sm:text-sm font-medium
        transition-all duration-200 active:scale-95
        ${className}
      `}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
