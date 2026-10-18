import React, { useState } from 'react';
import { Upload, Hash, Copy, Check } from 'lucide-react';
import './tools.css';

interface FileHashes {
  name: string;
  size: number;
  sha1: string;
  sha256: string;
  sha384: string;
  sha512: string;
}

export default function FileHashGenerator() {
  const [hashes, setHashes] = useState<FileHashes | null>(null);
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const calculateHash = async (algorithm: string, buffer: ArrayBuffer): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsHashing(true);
    try {
      const buffer = await file.arrayBuffer();
      const [sha1, sha256, sha384, sha512] = await Promise.all([
        calculateHash('SHA-1', buffer),
        calculateHash('SHA-256', buffer),
        calculateHash('SHA-384', buffer),
        calculateHash('SHA-512', buffer),
      ]);

      setHashes({
        name: file.name,
        size: file.size,
        sha1,
        sha256,
        sha384,
        sha512,
      });
    } catch (err) {
      alert('Error calculating hashes: ' + (err as Error).message);
    } finally {
      setIsHashing(false);
    }
  };

  const copyHash = (hash: string, type: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-dropzone">
          <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
          <div className="tool-dropzone-icon">
            <Hash size={24} />
          </div>
          <span className="tool-dropzone-text">Upload Any File to Generate Cryptographic Hashes</span>
          <span className="tool-dropzone-hint">Calculates SHA-1, SHA-256, SHA-384, and SHA-512 locally in browser</span>
        </label>
      </div>

      {isHashing && (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
          <div className="loading-ring" style={{ margin: '0 auto 12px' }}></div>
          <p style={{ color: 'var(--color-text-muted)' }}>Computing cryptographic checksums...</p>
        </div>
      )}

      {hashes && (
        <div className="tool-card-panel">
          <div className="tool-result-header" style={{ marginBottom: 'var(--space-lg)' }}>
            <div>
              <strong style={{ fontSize: '1.05rem', display: 'block' }}>{hashes.name}</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {formatBytes(hashes.size)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {[
              { label: 'SHA-256 (Recommended)', val: hashes.sha256, key: 'sha256' },
              { label: 'SHA-1', val: hashes.sha1, key: 'sha1' },
              { label: 'SHA-512', val: hashes.sha512, key: 'sha512' },
              { label: 'SHA-384', val: hashes.sha384, key: 'sha384' },
            ].map(item => (
              <div key={item.key} style={{ background: 'var(--color-bg)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>{item.label}</span>
                  <button
                    type="button"
                    onClick={() => copyHash(item.val, item.key)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedType === item.key ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    {copiedType === item.key ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <code style={{ fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--color-primary)' }}>
                  {item.val}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
