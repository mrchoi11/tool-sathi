/**
 * AdPlaceholder — Monetization-ready ad container.
 * Replace the children with your actual ad network script (AdSense, Mediavine, etc.)
 * when ready to monetize.
 */
interface AdPlaceholderProps {
  slot?: string;
  format?: 'banner' | 'sidebar' | 'inline';
  className?: string;
}

export default function AdPlaceholder({ slot = 'default', format = 'banner', className = '' }: AdPlaceholderProps) {
  const heightMap = { banner: '90px', sidebar: '250px', inline: '120px' };
  const labelMap = { banner: 'Advertisement', sidebar: 'Sponsored', inline: 'Ad' };

  return (
    <div
      className={`ad-placeholder ${className}`}
      data-ad-slot={slot}
      data-ad-format={format}
      style={{
        width: '100%',
        minHeight: heightMap[format],
        borderRadius: '0.5rem',
        border: '1px dashed rgba(99,102,241,0.15)',
        background: 'rgba(99,102,241,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        opacity: 0.5,
        margin: '1.5rem 0',
      }}
      aria-hidden="true"
    >
      {labelMap[format]}
    </div>
  );
}
