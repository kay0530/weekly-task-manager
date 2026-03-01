import { useRef, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';

const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'u', 'br', 'strong', 'em', 'div', 'span'],
  ALLOWED_ATTR: [],
};

export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}

// Convert plain text (with \n) to HTML for contentEditable
function plainTextToHtml(text) {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(/\n/g, '<br>');
}

export default function RichTextEditor({ value, onChange, placeholder, rows = 2, className }) {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editorRef.current) {
      const htmlValue = plainTextToHtml(value);
      if (editorRef.current.innerHTML !== htmlValue) {
        editorRef.current.innerHTML = htmlValue;
      }
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      const html = sanitizeHtml(editorRef.current.innerHTML);
      onChange(html);
    }
  }, [onChange]);

  const execFormat = useCallback((command) => {
    document.execCommand(command, false, null);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const minHeight = `${rows * 1.5}rem`;

  return (
    <div>
      <div className="flex gap-1 mb-1">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('bold')}
          className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-100 font-bold cursor-pointer"
          title="太字 (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('italic')}
          className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-100 italic cursor-pointer"
          title="斜体 (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFormat('underline')}
          className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-100 underline cursor-pointer"
          title="下線 (Ctrl+U)"
        >
          U
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className={`rich-text-editor ${className || ''}`}
        style={{ minHeight, overflowY: 'auto' }}
      />
    </div>
  );
}
