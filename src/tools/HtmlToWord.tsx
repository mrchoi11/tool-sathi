import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import JSZip from 'jszip';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon,
  Table, Undo, Redo, Download, FileCode, FileText,
  Trash2, Copy, Check, ChevronDown, Highlighter, Type,
  Upload, ArrowLeftRight
} from 'lucide-react';
import './tools.css';
import './HtmlToWord.css';

// ── Toolbar button ──────────────────────────────────────────────────────────
function ToolBtn({ onClick, active = false, disabled = false, title, children }: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`htw-btn${active ? ' htw-btn--active' : ''}${disabled ? ' htw-btn--disabled' : ''}`}
    >
      {children}
    </button>
  );
}

// ── Select dropdown ─────────────────────────────────────────────────────────
function ToolSelect({ value, onChange, options, title }: {
  value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[]; title: string;
}) {
  return (
    <select className="htw-select" title={title} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function HtmlToWord() {
  const [panesOrder, setPanesOrder] = useState<'word-first' | 'html-first'>('word-first');
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [htmlCode, setHtmlCode] = useState('<p>Start typing or paste your HTML here...</p>');
  const [copied, setCopied] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [showTablePopup, setShowTablePopup] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Placeholder.configure({ placeholder: 'Start typing here, or switch to HTML mode to paste code...' }),
      TableKit,
    ],
    content: htmlCode,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlCode(html);
      const text = editor.getText();
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
      setCharCount(text.length);
    },
  });

  // Sync HTML textarea → editor when switching modes
  const handleModeSwitch = useCallback((newMode: 'visual' | 'html') => {
    if (newMode === 'visual' && mode === 'html') {
      editor?.commands.setContent(htmlCode);
    }
    setMode(newMode);
  }, [mode, htmlCode, editor]);

  const handleHtmlChange = (val: string) => {
    setHtmlCode(val);
    const text = val.replace(/<[^>]*>/g, '');
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setCharCount(text.length);
  };

  // ── Insert table ──
  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setShowTablePopup(false);
  };

  // ── Insert link ──
  const applyLink = () => {
    if (!linkUrl) { editor?.chain().focus().unsetLink().run(); }
    else { editor?.chain().focus().setLink({ href: linkUrl }).run(); }
    setShowLinkPopup(false);
    setLinkUrl('');
  };

  // ── Insert image ──
  const applyImage = () => {
    if (imageUrl) editor?.chain().focus().setImage({ src: imageUrl }).run();
    setShowImagePopup(false);
    setImageUrl('');
  };

  // ── Copy HTML ──
  const copyHtml = async () => {
    await navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── File upload ──
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.html') || fileName.endsWith('.htm') || fileName.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = ev => {
        const content = (ev.target?.result as string) || '';
        let cleanContent = content;
        if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
          const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          if (bodyMatch && bodyMatch[1]) {
            cleanContent = bodyMatch[1];
          }
        } else {
          cleanContent = content.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
        }
        editor?.commands.setContent(cleanContent);
        setHtmlCode(cleanContent);
        const text = cleanContent.replace(/<[^>]*>/g, '');
        setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
        setCharCount(text.length);
      };
      reader.readAsText(file);
    } else if (fileName.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = async ev => {
        try {
          const arrayBuf = ev.target?.result as ArrayBuffer;
          const zip = await JSZip.loadAsync(arrayBuf);
          const htmlFile = zip.file('word/afchunk.htm');
          if (htmlFile) {
            const content = await htmlFile.async('string');
            const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            const bodyHtml = (bodyMatch && bodyMatch[1]) ? bodyMatch[1] : content;
            editor?.commands.setContent(bodyHtml);
            setHtmlCode(bodyHtml);
          } else {
            const docXmlFile = zip.file('word/document.xml');
            if (docXmlFile) {
              const xmlStr = await docXmlFile.async('string');
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
              const paragraphs = xmlDoc.getElementsByTagName('w:p');
              let builtHtml = '';
              for (let i = 0; i < paragraphs.length; i++) {
                const texts = paragraphs[i].getElementsByTagName('w:t');
                let pText = '';
                for (let j = 0; j < texts.length; j++) {
                  pText += texts[j].textContent || '';
                }
                if (pText.trim()) {
                  builtHtml += `<p>${pText}</p>`;
                }
              }
              if (!builtHtml) builtHtml = '<p>Loaded Word document.</p>';
              editor?.commands.setContent(builtHtml);
              setHtmlCode(builtHtml);
            }
          }
        } catch (docxErr) {
          console.error('Error parsing docx:', docxErr);
          alert('Could not read Word file. Please upload an .html or .txt file.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Supported formats: .html, .htm, .docx, .txt');
    }
    e.target.value = '';
  };

  // ── Clear ──
  const clearAll = () => {
    editor?.commands.clearContent();
    setHtmlCode('');
    setWordCount(0);
    setCharCount(0);
  };

  // ── Load sample ──
  const loadSample = () => {
    const sample = `<h1>Sample Document</h1>
<p>This is a <strong>sample</strong> document with <em>rich formatting</em>.</p>
<h2>Features</h2>
<ul>
  <li>Bold, Italic, Underline</li>
  <li>Headings H1–H6</li>
  <li>Lists and Tables</li>
</ul>
<blockquote><p>ProToolBox — Smarter Tools, Greater Productivity.</p></blockquote>`;
    editor?.commands.setContent(sample);
    setHtmlCode(sample);
  };

  // ── Download HTML ──
  const downloadHtml = () => {
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Document</title></head><body>${htmlCode}</body></html>`], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'document.html';
    a.click();
  };

  // ── Download DOCX ──
  const downloadDocx = async () => {
    try {
      const zip = new JSZip();

      const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="htm" ContentType="text/html"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

      const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

      const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:altChunk r:id="htmlChunk"/>
    <w:sectPr/>
  </w:body>
</w:document>`;

      const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="htmlChunk" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk" Target="afchunk.htm"/>
</Relationships>`;

      const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #999;padding:6px;}blockquote{border-left:3px solid #4f46e5;padding-left:10px;margin-left:0;color:#555;}</style></head><body>${htmlCode}</body></html>`;

      zip.file('[Content_Types].xml', contentTypes);
      zip.folder('_rels')?.file('.rels', rels);
      const word = zip.folder('word');
      word?.file('document.xml', docXml);
      word?.folder('_rels')?.file('document.xml.rels', docRels);
      word?.file('afchunk.htm', fullHtml);

      const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'document.docx';
      a.click();
    } catch (err) {
      console.error('DOCX export error:', err);
      alert('DOCX export failed. Downloading as HTML instead.');
      downloadHtml();
    }
  };

  // ── Heading selector ──
  const getHeadingValue = () => {
    if (!editor) return 'p';
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i })) return `h${i}`;
    }
    if (editor.isActive('blockquote')) return 'blockquote';
    return 'p';
  };
  const applyHeading = (val: string) => {
    if (!editor) return;
    if (val === 'p') editor.chain().focus().setParagraph().run();
    else if (val === 'blockquote') editor.chain().focus().toggleBlockquote().run();
    else editor.chain().focus().toggleHeading({ level: parseInt(val.replace('h', '')) as any }).run();
  };

  if (!editor) return null;

  return (
    <div className="htw-root">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="htw-header">
        <div className="htw-header-title">
          <FileCode size={22} className="htw-header-icon" />
          <span>HTML</span>
          <span className="htw-header-sep">⇄</span>
          <FileText size={22} className="htw-header-icon" />
          <span>Word</span>
        </div>
        <div className="htw-header-controls">
          <button
            type="button"
            className="htw-swap-order-btn"
            onClick={() => setPanesOrder(p => (p === 'word-first' ? 'html-first' : 'word-first'))}
            title="Swap Panes: Click to swap Word and HTML priority"
          >
            <ArrowLeftRight size={14} />
            <span>{panesOrder === 'word-first' ? 'Word ➔ HTML' : 'HTML ➔ Word'}</span>
          </button>
          <div className="htw-mode-tabs">
            <button className={`htw-mode-tab${mode === 'visual' ? ' active' : ''}`} onClick={() => handleModeSwitch('visual')}>
              <FileText size={14} /> Visual Editor
            </button>
            <button className={`htw-mode-tab${mode === 'html' ? ' active' : ''}`} onClick={() => handleModeSwitch('html')}>
              <FileCode size={14} /> HTML Code
            </button>
          </div>
        </div>
      </div>

      {/* ── Main split layout ────────────────────────────────── */}
      <div className={`htw-split ${panesOrder === 'html-first' ? 'htw-split--reversed' : ''}`}>

        {/* ══ LEFT — Visual WYSIWYG editor ══ */}
        <div className="htw-pane htw-pane--left">
          <div className="htw-pane-label">
            <FileText size={14} /> Word / Visual Editor
          </div>

          {/* Toolbar */}
          <div className="htw-toolbar">
            {/* Row 1 */}
            <div className="htw-toolbar-row">
              <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editor.can().undo()}><Undo size={14} /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editor.can().redo()}><Redo size={14} /></ToolBtn>
              <div className="htw-sep" />
              <ToolSelect
                title="Paragraph style"
                value={getHeadingValue()}
                onChange={applyHeading}
                options={[
                  { label: 'Paragraph', value: 'p' },
                  { label: 'Heading 1', value: 'h1' },
                  { label: 'Heading 2', value: 'h2' },
                  { label: 'Heading 3', value: 'h3' },
                  { label: 'Heading 4', value: 'h4' },
                  { label: 'Heading 5', value: 'h5' },
                  { label: 'Heading 6', value: 'h6' },
                  { label: 'Blockquote', value: 'blockquote' },
                ]}
              />
              <div className="htw-sep" />
              <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={14} /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={14} /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon size={14} /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={14} /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter size={14} /></ToolBtn>
            </div>
            {/* Row 2 */}
            <div className="htw-toolbar-row">
              <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={14} /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={14} /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={14} /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify"><AlignJustify size={14} /></ToolBtn>
              <div className="htw-sep" />
              <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List size={14} /></ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={14} /></ToolBtn>
              <div className="htw-sep" />
              {/* Text color */}
              <div className="htw-color-wrap" title="Text color">
                <Type size={13} />
                <input type="color" className="htw-color-input" defaultValue="#000000"
                  onChange={e => editor.chain().focus().setColor(e.target.value).run()} />
              </div>
              <div className="htw-sep" />
              {/* Link */}
              <div style={{ position: 'relative' }}>
                <ToolBtn onClick={() => setShowLinkPopup(p => !p)} active={editor.isActive('link')} title="Insert Link"><LinkIcon size={14} /></ToolBtn>
                {showLinkPopup && (
                  <div className="htw-popup">
                    <input className="htw-popup-input" placeholder="https://..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && applyLink()} autoFocus />
                    <button className="htw-popup-btn" onClick={applyLink}>Apply</button>
                  </div>
                )}
              </div>
              {/* Image */}
              <div style={{ position: 'relative' }}>
                <ToolBtn onClick={() => setShowImagePopup(p => !p)} title="Insert Image"><ImageIcon size={14} /></ToolBtn>
                {showImagePopup && (
                  <div className="htw-popup">
                    <input className="htw-popup-input" placeholder="https://image-url..." value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && applyImage()} autoFocus />
                    <button className="htw-popup-btn" onClick={applyImage}>Insert</button>
                  </div>
                )}
              </div>
              {/* Table */}
              <div style={{ position: 'relative' }}>
                <ToolBtn onClick={() => setShowTablePopup(p => !p)} title="Insert Table"><Table size={14} /></ToolBtn>
                {showTablePopup && (
                  <div className="htw-popup" style={{ width: 180 }}>
                    <label className="htw-popup-label">Rows</label>
                    <input type="number" className="htw-popup-input" min={1} max={20} value={tableRows} onChange={e => setTableRows(+e.target.value)} />
                    <label className="htw-popup-label">Columns</label>
                    <input type="number" className="htw-popup-input" min={1} max={10} value={tableCols} onChange={e => setTableCols(+e.target.value)} />
                    <button className="htw-popup-btn" onClick={insertTable}>Insert Table</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Editor area */}
          <div className="htw-editor-area">
            <EditorContent editor={editor} className="htw-tiptap" />
          </div>

          {/* Footer stats */}
          <div className="htw-pane-footer">
            <span>{getHeadingValue()}</span>
            <span>Words: {wordCount}</span>
          </div>
        </div>

        {/* ══ RIGHT — HTML Code view ══ */}
        <div className="htw-pane htw-pane--right">
          <div className="htw-pane-label">
            <FileCode size={14} /> HTML Code
            <button className="htw-clean-btn" onClick={clearAll} title="Clear all">
              <Trash2 size={13} /> Clear
            </button>
          </div>

          {/* Code textarea */}
          <div className="htw-code-area">
            {mode === 'html' ? (
              <textarea
                ref={textareaRef}
                className="htw-code-textarea"
                value={htmlCode}
                onChange={e => handleHtmlChange(e.target.value)}
                spellCheck={false}
              />
            ) : (
              <div className="htw-code-preview">
                <pre className="htw-code-pre"><code>{htmlCode}</code></pre>
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div className="htw-pane-footer">
            <span>Characters: {charCount}</span>
          </div>
        </div>
      </div>

      {/* ── Bottom action bar ─────────────────────────────────── */}
      <div className="htw-actions">
        <input
          ref={fileUploadInputRef}
          type="file"
          accept=".html,.htm,.docx,.txt"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <button
          className="htw-action-btn htw-action-btn--upload"
          onClick={() => fileUploadInputRef.current?.click()}
          title="Upload HTML, DOCX, or TXT file"
        >
          <Upload size={14} /> Upload File
        </button>
        <button className="htw-action-btn htw-action-btn--sample" onClick={loadSample}>
          ✦ Sample
        </button>
        <button className="htw-action-btn htw-action-btn--html" onClick={downloadHtml}>
          <Download size={14} /> HTML
        </button>
        <button className="htw-action-btn htw-action-btn--copy" onClick={copyHtml}>
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy HTML</>}
        </button>
        <button className="htw-action-btn htw-action-btn--docx" onClick={downloadDocx}>
          <Download size={14} /> Docx
        </button>
      </div>
    </div>
  );
}
