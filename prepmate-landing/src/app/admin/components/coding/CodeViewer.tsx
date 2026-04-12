import { useState } from 'react';
import { Copy, Check, WrapText } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';

interface CodeViewerProps {
  code: string;
  language?: string;
  maxHeight?: string;
}

// Very lightweight syntax-highlighter using token colorization
function tokenize(code: string, language: string): React.ReactNode[] {
  const lines = code.split('\n');
  const nodes: React.ReactNode[] = [];

  // Language-specific keywords
  const keywordsMap: Record<string, string[]> = {
    python: ['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or', 'import', 'from', 'class', 'self', 'None', 'True', 'False', 'lambda', 'pass', 'break', 'continue', 'try', 'except', 'with', 'as', 'raise', 'yield', 'async', 'await'],
    javascript: ['function', 'var', 'let', 'const', 'return', 'if', 'else', 'for', 'while', 'in', 'of', 'new', 'this', 'class', 'extends', 'import', 'export', 'default', 'from', 'null', 'undefined', 'true', 'false', 'typeof', 'instanceof', 'throw', 'try', 'catch', 'break', 'continue', 'async', 'await', 'switch', 'case'],
    typescript: ['function', 'var', 'let', 'const', 'return', 'if', 'else', 'for', 'while', 'in', 'of', 'new', 'this', 'class', 'extends', 'import', 'export', 'default', 'from', 'null', 'undefined', 'true', 'false', 'typeof', 'instanceof', 'interface', 'type', 'enum', 'implements', 'async', 'await', 'readonly'],
    java: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'return', 'if', 'else', 'for', 'while', 'new', 'this', 'static', 'void', 'int', 'String', 'boolean', 'null', 'true', 'false', 'import', 'package', 'throw', 'throws', 'try', 'catch', 'finally'],
  };

  const lang = language?.toLowerCase() || 'javascript';
  const keywords = new Set(keywordsMap[lang] || keywordsMap['javascript']);

  lines.forEach((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    let i = 0;

    while (i < line.length) {
      // Comment
      if (line[i] === '#' || (line[i] === '/' && line[i + 1] === '/')) {
        parts.push(
          <span key={`c-${i}`} className="text-slate-500 dark:text-slate-400 italic">
            {line.slice(i)}
          </span>
        );
        i = line.length;
        continue;
      }

      // String single
      if (line[i] === '"' || line[i] === "'") {
        const quote = line[i];
        let j = i + 1;
        while (j < line.length && line[j] !== quote) j++;
        parts.push(
          <span key={`s-${i}`} className="text-emerald-600 dark:text-emerald-400">
            {line.slice(i, j + 1)}
          </span>
        );
        i = j + 1;
        continue;
      }

      // Number
      if (/\d/.test(line[i]) && (i === 0 || /\W/.test(line[i - 1]))) {
        let j = i;
        while (j < line.length && /[\d.]/.test(line[j])) j++;
        parts.push(
          <span key={`n-${i}`} className="text-amber-600 dark:text-amber-400">
            {line.slice(i, j)}
          </span>
        );
        i = j;
        continue;
      }

      // Word / keyword
      if (/[a-zA-Z_$]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
        const word = line.slice(i, j);
        if (keywords.has(word)) {
          parts.push(
            <span key={`k-${i}`} className="text-sky-600 dark:text-sky-400">
              {word}
            </span>
          );
        } else if (/^[A-Z]/.test(word)) {
          parts.push(
            <span key={`t-${i}`} className="text-violet-600 dark:text-violet-400">
              {word}
            </span>
          );
        } else {
          parts.push(<span key={`w-${i}`}>{word}</span>);
        }
        i = j;
        continue;
      }

      // Punctuation / operator
      if (/[(){}[\].,;:=<>!+\-*/%&|^~]/.test(line[i])) {
        parts.push(
          <span key={`p-${i}`} className="text-slate-400 dark:text-slate-500">
            {line[i]}
          </span>
        );
        i++;
        continue;
      }

      parts.push(<span key={`x-${i}`}>{line[i]}</span>);
      i++;
    }

    nodes.push(
      <div key={lineIdx} className="flex">
        <span className="select-none w-10 shrink-0 text-right pr-4 text-slate-400 dark:text-slate-600 text-xs tabular-nums">
          {lineIdx + 1}
        </span>
        <span className="flex-1 whitespace-pre">{parts}</span>
      </div>
    );
  });

  return nodes;
}

export function CodeViewer({ code, language = 'javascript', maxHeight = '360px' }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-slate-50 dark:bg-slate-900/60">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border-b border-border">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{language}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setWordWrap(!wordWrap)}
            title="Toggle word wrap"
          >
            <WrapText className={`size-3 ${wordWrap ? 'text-primary' : 'text-muted-foreground'}`} />
          </Button>
          <Button variant="ghost" size="icon" className="size-6" onClick={handleCopy}>
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* Code */}
      <div
        className={`overflow-auto text-xs font-mono py-3 text-foreground/90 ${wordWrap ? '' : 'overflow-x-auto'}`}
        style={{ maxHeight }}
      >
        <div className={wordWrap ? 'break-all' : ''}>
          {tokenize(code, language)}
        </div>
      </div>
    </div>
  );
}
