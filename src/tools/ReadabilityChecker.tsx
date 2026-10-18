import React, { useState } from 'react';
import { BookOpen, Sparkles, Clock } from 'lucide-react';
import './tools.css';

const SAMPLE_TEXT = `ToolSathi provides a rich suite of online browser utilities designed for maximum speed and privacy. Users can convert media, optimize documents, inspect metadata, and playback video streams directly inside their web browser without unnecessary server uploads. The clean architecture ensures complete data isolation.`;

export default function ReadabilityChecker() {
  const [text, setText] = useState<string>(SAMPLE_TEXT);

  const countSyllables = (word: string): number => {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  };

  const analyzeReadability = (content: string) => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    const wordCount = words.length;
    const sentenceCount = Math.max(1, sentences.length);

    let syllableCount = 0;
    words.forEach(w => {
      syllableCount += countSyllables(w);
    });

    if (wordCount === 0) {
      return { words: 0, sentences: 0, syllables: 0, readingEase: 0, gradeLevel: 0, readingTimeMin: 0 };
    }

    // Flesch Reading Ease: 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    const readingEase = Math.round(
      206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)
    );

    // Flesch-Kincaid Grade Level: 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
    const gradeLevel = Math.max(
      1,
      parseFloat((0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59).toFixed(1))
    );

    const readingTimeMin = Math.ceil(wordCount / 200);

    return {
      words: wordCount,
      sentences: sentenceCount,
      syllables: syllableCount,
      readingEase: Math.max(0, Math.min(100, readingEase)),
      gradeLevel,
      readingTimeMin,
    };
  };

  const stats = analyzeReadability(text);

  const getEaseInterpretation = (score: number) => {
    if (score >= 90) return { label: 'Very Easy (5th grade)', color: '#10b981' };
    if (score >= 70) return { label: 'Fairly Easy (7th grade)', color: '#34d399' };
    if (score >= 60) return { label: 'Standard / Conversational', color: '#60a5fa' };
    if (score >= 50) return { label: 'Fairly Difficult (High school)', color: '#f59e0b' };
    if (score >= 30) return { label: 'Difficult (College level)', color: '#f97316' };
    return { label: 'Very Confusing / Academic', color: '#ef4444' };
  };

  const easeInfo = getEaseInterpretation(stats.readingEase);

  return (
    <div className="tool-container">
      <div className="tool-card-panel">
        <label className="tool-label" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
          Article or Copywriting Text
        </label>
        <textarea
          className="tool-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste paragraphs of text to calculate readability..."
          style={{ height: '160px', marginBottom: 'var(--space-xl)' }}
        />

        <div className="tool-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="tool-stat-card">
            <div className="tool-stat-value" style={{ color: easeInfo.color }}>{stats.readingEase}</div>
            <div className="tool-stat-label">Flesch Reading Ease</div>
            <span style={{ fontSize: '0.75rem', color: easeInfo.color, fontWeight: 600 }}>{easeInfo.label}</span>
          </div>

          <div className="tool-stat-card">
            <div className="tool-stat-value">Grade {stats.gradeLevel}</div>
            <div className="tool-stat-label">US Grade Level</div>
          </div>

          <div className="tool-stat-card">
            <div className="tool-stat-value">{stats.words}</div>
            <div className="tool-stat-label">Total Words</div>
          </div>

          <div className="tool-stat-card">
            <div className="tool-stat-value">~{stats.readingTimeMin} min</div>
            <div className="tool-stat-label">Reading Time</div>
          </div>
        </div>

        <div style={{ background: 'var(--color-bg)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-md)', fontSize: '0.9rem' }}>
          <div>Sentences: <strong>{stats.sentences}</strong></div>
          <div>Avg Words/Sentence: <strong>{(stats.words / Math.max(1, stats.sentences)).toFixed(1)}</strong></div>
          <div>Total Syllables: <strong>{stats.syllables}</strong></div>
          <div>Avg Syllables/Word: <strong>{(stats.syllables / Math.max(1, stats.words)).toFixed(2)}</strong></div>
        </div>
      </div>
    </div>
  );
}
