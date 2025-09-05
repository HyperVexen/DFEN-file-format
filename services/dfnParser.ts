import { FONT_LIST } from '../constants';

const escapeHtml = (unsafe: string): string => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

export const findFontDetails = (prop: 'name' | 'value', value: string): { name: string, value: string } | undefined => {
    return FONT_LIST.find(f => f[prop].toLowerCase() === value.toLowerCase().replace(/["']/g, ''));
}

export const parseDfn = (text: string): string => {
  if (!text) return '';

  let processedText = escapeHtml(text)
    .replace(/\[b\](.*?)\[\/b\]/gs, '<strong>$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/gs, '<em>$1</em>')
    .replace(/\[u\](.*?)\[\/u\]/gs, '<u>$1</u>')
    .replace(/\[color=(#[0-9a-fA-F]{6})\](.*?)\[\/color\]/gs, '<span style="color: $1;">$2</span>')
    .replace(/\[size=(\d+)\](.*?)\[\/size\]/gs, '<span style="font-size: $1px;">$2</span>')
    .replace(/\[font=([\w\s]+)\](.*?)\[\/font\]/gs, (match, fontName, content) => {
        const fontValue = findFontDetails('name', fontName)?.value || 'serif';
        return `<span style="font-family: ${fontValue};">${content}</span>`;
    })
    .replace(/\[lh=([\d\.]+)\](.*?)\[\/lh\]/gs, '<span style="line-height: $1;">$2</span>')
    .replace(/\[ls=([\d\.]+)\](.*?)\[\/ls\]/gs, '<span style="letter-spacing: $1px;">$2</span>')
    .replace(/\[tt=(none|uppercase|lowercase|capitalize)\](.*?)\[\/tt\]/gs, '<span style="text-transform: $1;">$2</span>')
    .replace(/\n/g, '<br />');

  return processedText;
};

export const parseDfnWithVisibleTags = (text: string): string => {
    if (!text) return '';
    const tagRegex = /(\[\/?(?:b|i|u|color|size|font|lh|ls|tt)[^\]]*\])/g;
    let processedText = escapeHtml(text)
        .replace(tagRegex, `<span class="text-yellow-400 opacity-70">$1</span>`)
        .replace(/\n/g, '<br />');
    return processedText;
};

// --- HTML to DFN Conversion ---

export const rgbToHex = (rgb: string): string => {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return '#ffffff'; // Return a default, e.g., white
  const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
  return `#${toHex(parseInt(match[1]))}${toHex(parseInt(match[2]))}${toHex(parseInt(match[3]))}`;
};

const processNodeToDfn = (node: Node): string => {
    let result = '';
    for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
            result += child.textContent || '';
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            const element = child as HTMLElement;
            // FIX: Corrected typo in recursive function call.
            let childContent = processNodeToDfn(element);
            
            switch(element.nodeName) {
                case 'STRONG':
                    result += `[b]${childContent}[/b]`;
                    break;
                case 'EM':
                    result += `[i]${childContent}[/i]`;
                    break;
                case 'U':
                    result += `[u]${childContent}[/u]`;
                    break;
                case 'SPAN':
                    const color = element.style.color;
                    const size = element.style.fontSize;
                    const font = element.style.fontFamily;
                    const lineHeight = element.style.lineHeight;
                    const letterSpacing = element.style.letterSpacing;
                    const textTransform = element.style.textTransform;
                    
                    if (color) childContent = `[color=${rgbToHex(color)}]${childContent}[/color]`;
                    if (size) childContent = `[size=${size.replace('px', '')}]${childContent}[/size]`;
                    if (font) {
                        const fontName = findFontDetails('value', font.split(',')[0])?.name || 'Arial';
                        childContent = `[font=${fontName}]${childContent}[/font]`;
                    }
                    if (lineHeight) childContent = `[lh=${lineHeight}]${childContent}[/lh]`;
                    if (letterSpacing && letterSpacing !== 'normal') childContent = `[ls=${letterSpacing.replace('px', '')}]${childContent}[/ls]`;
                    if (textTransform && textTransform !== 'none') childContent = `[tt=${textTransform}]${childContent}[/tt]`;

                    result += childContent;
                    break;
                case 'BR':
                    result += '\n';
                    break;
                case 'DIV': // contentEditable often wraps lines in divs
                    result += childContent + (element.nextSibling ? '\n' : '');
                    break;
                default:
                    result += childContent;
            }
        }
    }
    return result;
};


export const htmlToDfn = (element: HTMLElement): string => {
    // Browsers sometimes add a trailing <br> at the end of contenteditable. Remove it.
    if (element.lastChild && element.lastChild.nodeName === 'BR') {
        element.removeChild(element.lastChild);
    }
    
    // Normalize will merge adjacent text nodes
    element.normalize();
    
    let dfnText = processNodeToDfn(element);

    // Tidy up: Replace multiple newlines with a single one.
    dfnText = dfnText.replace(/\n{2,}/g, '\n');

    return dfnText.trim();
};