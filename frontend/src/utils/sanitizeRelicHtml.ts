/** Allowed subset for museum/catalog HTML snippets (no scripts, inline handlers, or hostile URLs). */
const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'em',
  'strong',
  'b',
  'i',
  'u',
  'span',
  'a',
  'ul',
  'ol',
  'li',
  'div',
  'small',
  'sub',
  'sup',
  'blockquote',
]);

const STRIP_ENTIRELY = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'link',
  'style',
  'meta',
  'base',
  'svg',
  'math',
]);

function sanitizeElement(container: Element): void {
  let child = container.firstChild;
  while (child) {
    const next = child.nextSibling;

    if (child.nodeType === Node.TEXT_NODE) {
      child = next;
      continue;
    }

    if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
      child = next;
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      child.remove();
      child = next;
      continue;
    }

    const node = child as HTMLElement;
    const tag = node.tagName.toLowerCase();

    if (STRIP_ENTIRELY.has(tag)) {
      node.remove();
      child = next;
      continue;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      while (node.firstChild) {
        container.insertBefore(node.firstChild, node);
      }
      node.remove();
      child = next;
      continue;
    }

    if (tag === 'a') {
      const href = node.getAttribute('href');
      while (node.attributes.length > 0) {
        node.removeAttribute(node.attributes[0].name);
      }
      const trimmed = href?.trim() ?? '';
      if (/^https?:\/\//i.test(trimmed)) {
        node.setAttribute('href', trimmed);
        node.setAttribute('rel', 'noopener noreferrer');
        node.setAttribute('target', '_blank');
      }
    } else {
      while (node.attributes.length > 0) {
        node.removeAttribute(node.attributes[0].name);
      }
    }

    sanitizeElement(node);
    child = next;
  }
}

/**
 * Returns sanitized HTML safe for `dangerouslySetInnerHTML`.
 */
export function sanitizeRelicHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return '';
  const doc = new DOMParser().parseFromString(trimmed, 'text/html');
  sanitizeElement(doc.body);
  return doc.body.innerHTML;
}

/**
 * Plain text for comparisons / search normalization (strips tags).
 */
export function relicDescriptionPlainText(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return '';
  const doc = new DOMParser().parseFromString(trimmed, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}
