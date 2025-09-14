import React, { useRef, useEffect, useCallback } from 'react';

// --- DFN to HTML Conversion ---
const dfnToHtml = (text: string): string => {
    if (!text) return '';
    
    const regex = /\[(b|i|u|s|sub|sup)\](.*?)\[\/\1\]|\[(font|color|bg|size)=([^\]]+?)\](.*?)\[\/\3\]/s;
    let result = '';
    let remainingText = text;

    while (remainingText.length > 0) {
        const match = remainingText.match(regex);
        if (match) {
            const before = remainingText.substring(0, match.index);
            result += before;

            const [fullMatch, simpleTag, simpleContent, valuedTag, value, valuedContent] = match;
            const tag = simpleTag || valuedTag;
            const content = simpleContent !== undefined ? simpleContent : valuedContent;
            const innerHtml = dfnToHtml(content || '');

            switch (tag.toLowerCase()) {
                case 'b': result += `<b>${innerHtml}</b>`; break;
                case 'i': result += `<i>${innerHtml}</i>`; break;
                case 'u': result += `<u>${innerHtml}</u>`; break;
                case 's': result += `<s>${innerHtml}</s>`; break;
                case 'sub': result += `<sub>${innerHtml}</sub>`; break;
                case 'sup': result += `<sup>${innerHtml}</sup>`; break;
                case 'font': result += `<span style="font-family: ${value};">${innerHtml}</span>`; break;
                case 'color': result += `<span style="color: ${value};">${innerHtml}</span>`; break;
                case 'bg': result += `<span style="background-color: ${value};">${innerHtml}</span>`; break;
                case 'size': result += `<span style="font-size: ${value}px;">${innerHtml}</span>`; break;
                default: result += innerHtml;
            }
            remainingText = remainingText.substring(match.index! + fullMatch.length);
        } else {
            result += remainingText;
            remainingText = '';
        }
    }
    return result;
};

const HIGHLIGHT_TAG = 'MARK';

// --- HTML to DFN Conversion ---
const htmlToDfn = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        
        // Ignore our highlight tag
        if (el.nodeName === HIGHLIGHT_TAG) {
            return Array.from(el.childNodes).map(child => htmlToDfn(child)).join('');
        }

        let childrenDfn = Array.from(el.childNodes).map(child => htmlToDfn(child)).join('');

        // The <font> tag is deprecated and used by execCommand, handle it specifically.
        if (el.nodeName === 'FONT') {
            const color = el.getAttribute('color');
            const face = el.getAttribute('face');
            // execCommand for size creates <font size="..."> which is 1-7. We ignore it in favor of our span-based size.
            if(color) childrenDfn = `[color=${color}]${childrenDfn}[/color]`;
            if(face) childrenDfn = `[font=${face}]${childrenDfn}[/font]`;
            return childrenDfn;
        }

        switch (el.nodeName) {
            case 'B': case 'STRONG': return `[b]${childrenDfn}[/b]`;
            case 'I': case 'EM': return `[i]${childrenDfn}[/i]`;
            case 'U': return `[u]${childrenDfn}[/u]`;
            case 'S': case 'STRIKE': return `[s]${childrenDfn}[/s]`;
            case 'SUB': return `[sub]${childrenDfn}[/sub]`;
            case 'SUP': return `[sup]${childrenDfn}[/sup]`;
            case 'SPAN': {
                let wrappedContent = childrenDfn;
                if (el.style.fontSize) wrappedContent = `[size=${el.style.fontSize.replace('px', '')}]${wrappedContent}[/size]`;
                if (el.style.backgroundColor) wrappedContent = `[bg=${el.style.backgroundColor}]${wrappedContent}[/bg]`;
                if (el.style.color) wrappedContent = `[color=${el.style.color}]${wrappedContent}[/color]`;
                if (el.style.fontFamily) wrappedContent = `[font=${el.style.fontFamily}]${wrappedContent}[/font]`;
                
                // Handle styles that map to simple tags
                if (el.style.fontWeight === 'bold' || parseInt(el.style.fontWeight) >= 700) wrappedContent = `[b]${wrappedContent}[/b]`;
                if (el.style.fontStyle === 'italic') wrappedContent = `[i]${wrappedContent}[/i]`;
                if (el.style.textDecorationLine === 'underline') wrappedContent = `[u]${wrappedContent}[/u]`;
                if (el.style.textDecorationLine === 'line-through') wrappedContent = `[s]${wrappedContent}[/s]`;

                return wrappedContent;
            }
            case 'DIV':
            case 'P': 
                 return childrenDfn;
        }
        return childrenDfn;
    }
    return '';
};


interface WysiwygEditorProps {
  dfnContent: string;
  onDfnContentChange: (newContent: string) => void;
  onSelectionChange: (formats: { [key: string]: string | boolean }) => void;
  highlightInfo: { query: string; occurrenceIndex: number } | null;
}

const WysiwygEditor: React.FC<WysiwygEditorProps> = ({ dfnContent, onDfnContentChange, onSelectionChange, highlightInfo }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const lastDfnContent = useRef(dfnContent);
    const isUpdatingFromOutside = useRef(false);

    const checkActiveFormats = useCallback(() => {
        const formats: { [key: string]: string | boolean } = {};
        if (!editorRef.current || !window.getSelection()?.rangeCount) {
            onSelectionChange(formats);
            return;
        }
        
        formats.bold = document.queryCommandState('bold');
        formats.italic = document.queryCommandState('italic');
        formats.underline = document.queryCommandState('underline');
        formats.strikeThrough = document.queryCommandState('strikeThrough');

        let node = window.getSelection()?.anchorNode;
        if (node) {
            const editorColor = window.getComputedStyle(editorRef.current).color;
            let element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement;
            while (element && editorRef.current.contains(element)) {
                const style = window.getComputedStyle(element);
                if (!formats.color && style.color && style.color !== editorColor) {
                    formats.color = style.color;
                }
                if (!formats.fontSize && style.fontSize && element.nodeName === 'SPAN') {
                    formats.fontSize = style.fontSize.replace('px', '');
                }
                element = element.parentElement;
            }
        }
        onSelectionChange(formats);
    }, [onSelectionChange]);
    
    const removeHighlights = useCallback(() => {
        if (!editorRef.current) return;
        const highlights = editorRef.current.querySelectorAll(HIGHLIGHT_TAG);
        highlights.forEach(node => {
            const parent = node.parentNode;
            if (parent) {
                while (node.firstChild) {
                    parent.insertBefore(node.firstChild, node);
                }
                parent.removeChild(node);
                parent.normalize(); // Merges adjacent text nodes
            }
        });
    }, []);

    useEffect(() => {
        const handler = () => {
            requestAnimationFrame(checkActiveFormats);
        };
        document.addEventListener('selectionchange', handler);
        return () => document.removeEventListener('selectionchange', handler);
    }, [checkActiveFormats]);

    useEffect(() => {
        if (editorRef.current && dfnContent !== lastDfnContent.current) {
            isUpdatingFromOutside.current = true;
            const selection = window.getSelection();
            const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;

            editorRef.current.innerHTML = dfnToHtml(dfnContent);
            lastDfnContent.current = dfnContent;

             if(range && selection && editorRef.current.contains(range.startContainer)){
                try {
                    selection.removeAllRanges();
                    selection.addRange(range);
                } catch (e) {
                    console.error("Failed to restore selection.", e)
                }
            }
            
            setTimeout(() => {
                isUpdatingFromOutside.current = false;
            }, 0);
        }
    }, [dfnContent]);

    useEffect(() => {
        removeHighlights();
        if (!highlightInfo || !editorRef.current) return;

        const { query, occurrenceIndex } = highlightInfo;
        const editor = editorRef.current;

        if (!query) return;

        const regex = new RegExp(query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        let matchCount = -1;
        let currentMatchElement: HTMLElement | null = null;

        const highlightRecursive = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (text && node.parentNode?.nodeName !== 'MARK') {
                    const fragment = document.createDocumentFragment();
                    let lastIndex = 0;
                    let match;
                    
                    regex.lastIndex = 0; // Reset regex state
                    while ((match = regex.exec(text)) !== null) {
                        if (match.index > lastIndex) {
                            fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                        }
                        
                        const mark = document.createElement(HIGHLIGHT_TAG);
                        mark.textContent = match[0];
                        matchCount++;
                        if (matchCount === occurrenceIndex) {
                            mark.classList.add('current-match');
                            currentMatchElement = mark;
                        }
                        fragment.appendChild(mark);
                        lastIndex = regex.lastIndex;
                    }

                    if (lastIndex < text.length) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                    }

                    if (fragment.hasChildNodes()) {
                        node.parentNode?.replaceChild(fragment, node);
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).nodeName !== HIGHLIGHT_TAG) {
                Array.from(node.childNodes).forEach(highlightRecursive);
            }
        };

        highlightRecursive(editor);

        if (currentMatchElement) {
            currentMatchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [highlightInfo, removeHighlights, dfnContent]);

    const handleInput = () => {
        if (isUpdatingFromOutside.current) return;
        if (editorRef.current) {
            const newDfn = htmlToDfn(editorRef.current);
            if (newDfn !== lastDfnContent.current) {
                lastDfnContent.current = newDfn;
                onDfnContentChange(newDfn);
            }
        }
        checkActiveFormats();
    };

    return (
        <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            className="flex-1 w-full focus:outline-none text-text-primary leading-relaxed whitespace-pre-wrap"
        />
    );
};

export default WysiwygEditor;