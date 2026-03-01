import { sanitizeHtml } from './RichTextEditor';

function isHtml(str) {
  return /<[a-z][\s\S]*>/i.test(str);
}

export default function RichTextDisplay({ content, className }) {
  if (!content) return null;

  if (!isHtml(content)) {
    return <span className={className}>{content}</span>;
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
}
