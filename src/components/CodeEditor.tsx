import { useRef, useEffect, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useVisualizerStore, ProgrammingLanguage } from '@/store/visualizerStore';
import { getSnippetsByLanguage, languageConfig, getDefaultSnippet, CodeSnippet } from '@/data/codeSnippets';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Code2, FileCode, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface CodeEditorProps {
  activeLine?: number;
}

const CodeEditor = ({ activeLine = 0 }: CodeEditorProps) => {
  const { code, setCode, steps, currentStep, language, setLanguage } = useVisualizerStore();
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);

  // Update snippets when language changes
  useEffect(() => {
    const langSnippets = getSnippetsByLanguage(language);
    setSnippets(langSnippets);
  }, [language]);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (newLang: ProgrammingLanguage) => {
    setLanguage(newLang);
    // Load default snippet for the new language
    const defaultSnippet = getDefaultSnippet(newLang);
    if (defaultSnippet) {
      setCode(defaultSnippet.code);
    }
  };

  const handleSnippetSelect = (snippet: CodeSnippet) => {
    setCode(snippet.code);
  };

  // Highlight active line
  useEffect(() => {
    if (editorRef.current && steps[currentStep]) {
      const lineNumber = steps[currentStep].line;
      
      // Clear previous decorations
      decorationsRef.current = editorRef.current.deltaDecorations(
        decorationsRef.current,
        lineNumber > 0 ? [
          {
            range: {
              startLineNumber: lineNumber,
              startColumn: 1,
              endLineNumber: lineNumber,
              endColumn: 1,
            },
            options: {
              isWholeLine: true,
              className: 'line-highlight',
              glyphMarginClassName: 'line-glyph-active',
            },
          },
        ] : []
      );

      // Scroll to line
      if (lineNumber > 0) {
        editorRef.current.revealLineInCenter(lineNumber);
      }
    }
  }, [currentStep, steps]);

  const groupedSnippets = snippets.reduce((acc, snippet) => {
    if (!acc[snippet.category]) {
      acc[snippet.category] = [];
    }
    acc[snippet.category].push(snippet);
    return acc;
  }, {} as Record<string, CodeSnippet[]>);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="panel-header justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span>Code Editor</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Snippet Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
                <FileCode className="w-3 h-3" />
                Examples
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {Object.entries(groupedSnippets).map(([category, categorySnippets]) => (
                <div key={category}>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">{category}</DropdownMenuLabel>
                  {categorySnippets.map((snippet) => (
                    <DropdownMenuItem
                      key={snippet.id}
                      onClick={() => handleSnippetSelect(snippet)}
                      className="text-sm"
                    >
                      {snippet.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Language Selector */}
          <Select value={language} onValueChange={(val) => handleLanguageChange(val as ProgrammingLanguage)}>
            <SelectTrigger className="w-[110px] h-7 text-xs border-border/50 bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(languageConfig).map(([key, config]) => (
                <SelectItem key={key} value={key} className="text-sm">
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={languageConfig[language].monacoId}
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'none',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            contextmenu: true,
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
