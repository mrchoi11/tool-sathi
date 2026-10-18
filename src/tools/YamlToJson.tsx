import React, { useState } from 'react';
import { FileJson, Copy, Check } from 'lucide-react';
import './tools.css';

const SAMPLE_YAML = `version: "2.1"
app:
  name: ToolSathi
  author: DeepMind
  status: active
features:
  - video-player
  - pdf-compressor
  - json-formatter
settings:
  cache: true
  maxUploadMB: 100`;

export default function YamlToJson() {
  const [yamlInput, setYamlInput] = useState<string>(SAMPLE_YAML);
  const [jsonOutput, setJsonOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Client-side YAML to JSON parser
  const parseYaml = (yaml: string) => {
    try {
      setErrorMsg(null);
      const lines = yaml.split('\n');
      const root: any = {};
      const stack: { indent: number; obj: any; key?: string }[] = [{ indent: -1, obj: root }];

      lines.forEach(rawLine => {
        const line = rawLine.replace(/#.*$/, ''); // strip comments
        if (!line.trim()) return;

        const indent = line.search(/\S/);
        const trimmed = line.trim();

        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
          stack.pop();
        }

        const currentParent = stack[stack.length - 1].obj;

        if (trimmed.startsWith('- ')) {
          // List item
          const val = trimmed.substring(2).trim();
          if (!Array.isArray(currentParent)) {
            // Convert or assign
          }
        } else if (trimmed.includes(':')) {
          const colonIdx = trimmed.indexOf(':');
          const key = trimmed.substring(0, colonIdx).trim();
          let rawVal = trimmed.substring(colonIdx + 1).trim();

          if (rawVal === '') {
            // Nested object
            const newObj = {};
            currentParent[key] = newObj;
            stack.push({ indent, obj: newObj, key });
          } else {
            // Primitive
            let val: any = rawVal.replace(/^["']|["']$/g, '');
            if (val === 'true') val = true;
            else if (val === 'false') val = false;
            else if (!isNaN(Number(val)) && val !== '') val = Number(val);

            currentParent[key] = val;
          }
        }
      });

      setJsonOutput(JSON.stringify(root, null, 2));
    } catch (err) {
      setErrorMsg('YAML Parsing Error: ' + (err as Error).message);
    }
  };

  React.useEffect(() => {
    parseYaml(SAMPLE_YAML);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
          YAML Input
        </label>
        <textarea
          className="tool-textarea"
          value={yamlInput}
          onChange={e => {
            setYamlInput(e.target.value);
            parseYaml(e.target.value);
          }}
          placeholder="Paste YAML here..."
          style={{ height: '180px', marginBottom: 'var(--space-md)' }}
        />

        {errorMsg && (
          <div className="tool-alert tool-alert-danger" style={{ marginBottom: 'var(--space-md)' }}>
            {errorMsg}
          </div>
        )}

        <div className="tool-result-header" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="tool-result-title">JSON Output</span>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy JSON'}
          </button>
        </div>

        <textarea
          readOnly
          className="tool-textarea"
          value={jsonOutput}
          style={{ height: '220px', background: 'var(--color-bg)' }}
        />
      </div>
    </div>
  );
}
