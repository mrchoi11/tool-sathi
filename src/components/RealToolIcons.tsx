import React from 'react';

export interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/* 1. Official YouTube Icon */
export const YouTubeIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <rect width="24" height="24" rx="5.5" fill="#FF0000" />
    <path d="M9.5 7.5L16.5 12L9.5 16.5V7.5Z" fill="#FFFFFF" />
  </svg>
);

/* 2. Official Instagram Icon */
export const InstagramIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="ig-grad" cx="20%" cy="105%" r="115%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="15%" stopColor="#fdf497" />
        <stop offset="45%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="90%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6.5" fill="url(#ig-grad)" />
    <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="3.6" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
    <circle cx="16.5" cy="7.5" r="1.1" fill="#FFFFFF" />
  </svg>
);

/* 3. Official Pinterest Icon */
export const PinterestIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="12" fill="#E60023" />
    <path
      d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.4 9.3-.09-.79-.17-2 .04-2.87.19-.8 1.25-5.3 1.25-5.3s-.32-.64-.32-1.58c0-1.48.86-2.58 1.93-2.58.91 0 1.35.68 1.35 1.5 0 .91-.58 2.28-.88 3.55-.25 1.06.53 1.93 1.58 1.93 1.89 0 3.35-2 3.35-4.88 0-2.55-1.83-4.33-4.45-4.33-3.03 0-4.81 2.27-4.81 4.62 0 .91.35 1.9.79 2.43.09.11.1.2.07.31-.08.33-.26 1.05-.29 1.2-.05.19-.16.23-.37.14-1.38-.64-2.24-2.65-2.24-4.27 0-3.48 2.53-6.68 7.3-6.68 3.83 0 6.81 2.73 6.81 6.38 0 3.81-2.4 6.87-5.73 6.87-1.12 0-2.17-.58-2.53-1.27l-.69 2.63c-.25.96-.92 2.16-1.37 2.89A10 10 0 1 0 12 2z"
      fill="#FFFFFF"
    />
  </svg>
);

/* 4. TeraBox Icon */
export const TeraBoxIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="tb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#29B6F6" />
        <stop offset="100%" stopColor="#0288D1" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#tb-grad)" />
    <path
      d="M18.5 13.5a3.5 3.5 0 0 0-3.4-3.2 5 5 0 0 0-9.2 1.7 4 4 0 0 0 .1 8h12.5a3.5 3.5 0 0 0 0-6.5z"
      fill="#FFFFFF"
      fillOpacity="0.35"
    />
    <path d="M7.5 7.5h9v2.5h-3.25v7.5h-2.5v-7.5H7.5V7.5z" fill="#FFFFFF" />
  </svg>
);

/* 5. Diskwala Icon */
export const DiskwalaIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="dw-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#4338CA" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#dw-grad)" />
    <circle cx="12" cy="12" r="7" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.4" />
    <circle cx="12" cy="12" r="4.5" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.7" />
    <polygon points="10.5,9.5 15,12 10.5,14.5" fill="#FFFFFF" />
  </svg>
);

/* 6. Video Player Icon */
export const VideoPlayerIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="vp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#vp-grad)" />
    <circle cx="12" cy="12" r="8" fill="#FFFFFF" fillOpacity="0.2" />
    <polygon points="10,8 16.5,12 10,16" fill="#FFFFFF" />
  </svg>
);

/* 7. PDF Adobe Document Icon */
export const PdfIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <path d="M4 4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" fill="#E5252A" />
    <path d="M14 2l6 6h-6V2z" fill="#B31B1F" />
    <rect x="3.5" y="11" width="17" height="8" rx="2" fill="#FFFFFF" />
    <text x="12" y="17" fill="#E5252A" fontSize="6" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">PDF</text>
  </svg>
);

/* 8. PDF Merge Icon */
export const PdfMergeIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <path d="M7 2h7l4 4v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#EF4444" fillOpacity="0.55" />
    <path d="M3 6a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" fill="#E5252A" />
    <path d="M12 4l5 5h-5V4z" fill="#B31B1F" />
    <path d="M6 14h6m-2-2.5l2.5 2.5-2.5 2.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

/* 9. PDF Compress Icon */
export const PdfCompressIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <path d="M4 3a2 2 0 0 1 2-2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V3z" fill="#E5252A" />
    <path d="M14 1l6 6h-6V1z" fill="#B31B1F" />
    <path d="M12 8v3m0 0l-2-2m2 2l2-2" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M12 18v-3m0 0l-2 2m2-2l2 2" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <line x1="8" y1="13" x2="16" y2="13" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/* 10. PDF Split Icon */
export const PdfSplitIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <path d="M4 3a2 2 0 0 1 2-2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V3z" fill="#E5252A" />
    <path d="M14 1l6 6h-6V1z" fill="#B31B1F" />
    <circle cx="8" cy="16" r="1.5" fill="none" stroke="#FFFFFF" strokeWidth="1.4" />
    <circle cx="8" cy="11" r="1.5" fill="none" stroke="#FFFFFF" strokeWidth="1.4" />
    <path d="M9.5 12l6 4M9.5 15l6-4" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* 11. PDF to Image / Image to PDF */
export const PdfToJpgIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <path d="M3 4a1.5 1.5 0 0 1 1.5-1.5H9l3 3v9a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3 14.5V4z" fill="#E5252A" />
    <text x="7" y="11" fill="#FFFFFF" fontSize="4.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">PDF</text>
    <path d="M11 11h3m-1-1.5l1.5 1.5-1.5 1.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="13" y="7" width="8" height="11" rx="1.5" fill="#0284C7" />
    <circle cx="15.5" cy="10" r="1" fill="#FDE047" />
    <path d="M14 16l2-2.5 1.5 1 2-2.5v4h-5.5z" fill="#FFFFFF" fillOpacity="0.8" />
  </svg>
);

export const JpgToPdfIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <rect x="3" y="7" width="8" height="11" rx="1.5" fill="#0284C7" />
    <circle cx="5.5" cy="10" r="1" fill="#FDE047" />
    <path d="M4 16l2-2.5 1.5 1 2-2.5v4H4z" fill="#FFFFFF" fillOpacity="0.8" />
    <path d="M11 11h3m-1-1.5l1.5 1.5-1.5 1.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M13 4a1.5 1.5 0 0 1 1.5-1.5h4.5l3 3v9a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 13 14.5V4z" fill="#E5252A" />
    <text x="17" y="11" fill="#FFFFFF" fontSize="4.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">PDF</text>
  </svg>
);

/* 12. Microsoft Word Icon */
export const WordIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="word-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#185ABD" />
        <stop offset="100%" stopColor="#0C3B84" />
      </linearGradient>
    </defs>
    <rect x="2" y="3" width="20" height="18" rx="3.5" fill="url(#word-grad)" />
    <path d="M6 7.5L8.5 16.5H10.5L12 11.5L13.5 16.5H15.5L18 7.5H16L14.5 13.5L13 8.5H11L9.5 13.5L8 7.5H6Z" fill="#FFFFFF" />
  </svg>
);

/* 13. Microsoft Excel Icon */
export const ExcelIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="excel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#107C41" />
        <stop offset="100%" stopColor="#0B552C" />
      </linearGradient>
    </defs>
    <rect x="2" y="3" width="20" height="18" rx="3.5" fill="url(#excel-grad)" />
    <path d="M7 7.5L10.5 12L7 16.5H9.5L12 13.2L14.5 16.5H17L13.5 12L17 7.5H14.5L12 10.8L9.5 7.5H7Z" fill="#FFFFFF" />
  </svg>
);

/* 14. JSON Icon */
export const JsonIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="json-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#json-grad)" />
    <text x="12" y="16.5" fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="monospace">&#123; &#125;</text>
  </svg>
);

/* 15. QR Code Icon */
export const QrCodeRealIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="qr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#qr-grad)" />
    <rect x="4" y="4" width="6" height="6" rx="1.5" fill="#FFFFFF" />
    <rect x="5.5" y="5.5" width="3" height="3" fill="#0284C7" />
    <rect x="14" y="4" width="6" height="6" rx="1.5" fill="#FFFFFF" />
    <rect x="15.5" y="5.5" width="3" height="3" fill="#0284C7" />
    <rect x="4" y="14" width="6" height="6" rx="1.5" fill="#FFFFFF" />
    <rect x="5.5" y="15.5" width="3" height="3" fill="#0284C7" />
    <rect x="12" y="12" width="2" height="2" fill="#FFFFFF" />
    <rect x="15" y="12" width="2.5" height="2" fill="#FFFFFF" />
    <rect x="12" y="15" width="2" height="3" fill="#FFFFFF" />
    <rect x="16" y="16" width="3" height="3" fill="#FFFFFF" />
  </svg>
);

/* 16. Image Compress Icon */
export const ImageCompressIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="ic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#14B8A6" />
        <stop offset="100%" stopColor="#0F766E" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ic-grad)" />
    <rect x="4" y="4" width="16" height="12" rx="2" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
    <circle cx="8" cy="8" r="1.5" fill="#FDE047" />
    <path d="M5 14l4-4 3 3 3-4 4 5H5z" fill="#FFFFFF" fillOpacity="0.4" />
    <circle cx="17.5" cy="17.5" r="4.5" fill="#0F766E" stroke="#FFFFFF" strokeWidth="1.5" />
    <path d="M17.5 15v4m-1.5-1.5l1.5 1.5 1.5-1.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

/* 17. Image Resize Icon */
export const ImageResizeIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="ir-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0E7490" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ir-grad)" />
    <rect x="4" y="4" width="10" height="10" rx="1.5" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="2 1" />
    <rect x="7" y="7" width="13" height="13" rx="2" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
    <path d="M12 12l6 6m0-4v4h-4" stroke="#FDE047" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

/* 18. Image Crop Icon */
export const ImageCropIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="crop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#crop-grad)" />
    <path d="M6 3v13a2 2 0 0 0 2 2h13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M18 21V8a2 2 0 0 0-2-2H3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

/* 19. WebP Converter Icon */
export const WebpIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="webp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0891B2" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#webp-grad)" />
    <text x="12" y="15" fill="#FFFFFF" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">WEBP</text>
  </svg>
);

/* 20. Background Remover Icon */
export const BackgroundRemoverIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#9333EA" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#bg-grad)" />
    <rect x="5" y="11" width="3.5" height="3.5" fill="#FFFFFF" fillOpacity="0.4" />
    <rect x="8.5" y="14.5" width="3.5" height="3.5" fill="#FFFFFF" fillOpacity="0.4" />
    <rect x="5" y="14.5" width="3.5" height="3.5" fill="#FFFFFF" fillOpacity="0.1" />
    <rect x="8.5" y="11" width="3.5" height="3.5" fill="#FFFFFF" fillOpacity="0.1" />
    <path d="M18.5 5.5l-8 8 1 1 8-8z" fill="#FFFFFF" />
    <path d="M19.5 4.5l-2 2 1 1 2-2z" fill="#FDE047" />
    <path d="M6 6l.5 1.5L8 8l-1.5.5L6 10l-.5-1.5L4 8l1.5-.5z" fill="#FDE047" />
  </svg>
);

/* 21. Favicon Generator Icon */
export const FaviconIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="fav-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#fav-grad)" />
    <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
    <line x1="4" y1="9" x2="20" y2="9" stroke="#FFFFFF" strokeWidth="1.5" />
    <polygon points="7,7 7.5,8 8.5,8 7.7,8.6 8,9.5 7,9 6,9.5 6.3,8.6 5.5,8 6.5,8" fill="#FBBF24" />
  </svg>
);

/* 22. Password Generator Icon */
export const PasswordIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="pwd-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#pwd-grad)" />
    <path d="M12 4.5L6 7v5c0 4.2 2.6 8.1 6 9.5 3.4-1.4 6-5.3 6-9.5V7l-6-2.5z" fill="#FFFFFF" fillOpacity="0.25" />
    <circle cx="10" cy="11.5" r="2.2" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
    <path d="M12 12.5l4 4m-1-1l1.5-1.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/* 23. Color Palette Icon */
export const ColorPickerIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="pal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#pal-grad)" />
    <path d="M12 4a8 8 0 0 0-8 8c0 3.3 2.7 6 6 6h1.2a2 2 0 0 0 2-2 1.5 1.5 0 0 1 1.5-1.5h1.3a6 6 0 0 0 6-6c0-4.4-3.6-8-8-8z" fill="#FFFFFF" />
    <circle cx="8" cy="10" r="1.3" fill="#EF4444" />
    <circle cx="11.5" cy="8" r="1.3" fill="#F59E0B" />
    <circle cx="15" cy="10" r="1.3" fill="#10B981" />
    <circle cx="15.5" cy="14" r="1.3" fill="#3B82F6" />
  </svg>
);

/* 24. Percentage / Discount Icon */
export const PercentageIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="pct-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#pct-grad)" />
    <line x1="17" y1="7" x2="7" y2="17" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="8.5" cy="8.5" r="2" fill="none" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="15.5" cy="15.5" r="2" fill="none" stroke="#FFFFFF" strokeWidth="2" />
  </svg>
);

/* 25. Age Calculator Icon */
export const AgeCalculatorIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="age-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#DB2777" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#age-grad)" />
    <rect x="6" y="13" width="12" height="7" rx="1.5" fill="#FFFFFF" />
    <rect x="8" y="10" width="8" height="3" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
    <line x1="12" y1="10" x2="12" y2="7.5" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="6" r="1.2" fill="#F59E0B" />
  </svg>
);

/* 26. Date Difference Icon */
export const DateDiffIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="date-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#date-grad)" />
    <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
    <line x1="4" y1="9.5" x2="20" y2="9.5" stroke="#FFFFFF" strokeWidth="1.5" />
    <line x1="8" y1="3" x2="8" y2="6" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="16" y1="3" x2="16" y2="6" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 14h8m-2-2l2 2-2 2" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

/* 27. UUID Generator Icon */
export const UuidIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="uuid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#uuid-grad)" />
    <circle cx="8" cy="8" r="2.5" fill="#FFFFFF" />
    <circle cx="16" cy="8" r="2.5" fill="#FFFFFF" />
    <circle cx="8" cy="16" r="2.5" fill="#FFFFFF" />
    <circle cx="16" cy="16" r="2.5" fill="#38BDF8" />
    <path d="M8 10.5v3M16 10.5v3M10.5 8h3M10.5 16h3" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.6" />
  </svg>
);

/* 28. Aspect Ratio Icon */
export const AspectRatioIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="ar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#4F46E5" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ar-grad)" />
    <rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
    <text x="12" y="14" fill="#FFFFFF" fontSize="6.5" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">16:9</text>
  </svg>
);

/* 29. Text Diff Icon */
export const TextDiffIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="td-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#1E293B" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#td-grad)" />
    <rect x="4" y="5" width="7" height="14" rx="1.5" fill="#EF4444" fillOpacity="0.3" stroke="#EF4444" strokeWidth="1" />
    <line x1="6" y1="8" x2="9" y2="8" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="6" y1="12" x2="9" y2="12" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="13" y="5" width="7" height="14" rx="1.5" fill="#10B981" fillOpacity="0.3" stroke="#10B981" strokeWidth="1" />
    <line x1="15" y1="8" x2="18" y2="8" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="15" y1="12" x2="18" y2="12" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* 30. Word Counter / Typography Icon */
export const WordCounterIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="wc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#wc-grad)" />
    <path d="M5 4h10l4 4v12H5V4z" fill="#FFFFFF" fillOpacity="0.2" />
    <path d="M15 4v4h4" fill="#FFFFFF" fillOpacity="0.4" />
    <text x="11.5" y="16.5" fill="#FFFFFF" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">123</text>
  </svg>
);

/* 31. Robots.txt Icon */
export const RobotsTxtIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="bot-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#4338CA" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#bot-grad)" />
    <line x1="12" y1="4" x2="12" y2="7" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="3.5" r="1" fill="#FDE047" />
    <rect x="5" y="7" width="14" height="12" rx="3" fill="#FFFFFF" />
    <circle cx="9" cy="11.5" r="1.6" fill="#3B82F6" />
    <circle cx="15" cy="11.5" r="1.6" fill="#3B82F6" />
    <line x1="9" y1="15.5" x2="15" y2="15.5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* 32. Sitemap Icon */
export const SitemapIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="sm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#sm-grad)" />
    <rect x="9.5" y="4" width="5" height="4" rx="1" fill="#FFFFFF" />
    <path d="M12 8v3M6 11h12m-12 0v3m6-3v3m6-3v3" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    <rect x="3.5" y="14" width="5" height="4" rx="1" fill="#FFFFFF" />
    <rect x="9.5" y="14" width="5" height="4" rx="1" fill="#FFFFFF" />
    <rect x="15.5" y="14" width="5" height="4" rx="1" fill="#FFFFFF" />
  </svg>
);

/* 33. SEO Search Icon */
export const SeoSearchIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="seo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#seo-grad)" />
    <circle cx="10.5" cy="10.5" r="5" fill="none" stroke="#FFFFFF" strokeWidth="2" />
    <line x1="14.5" y1="14.5" x2="19" y2="19" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M8 12l2-2.5 2 1.5 2-3" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

/* 34. Markdown Icon */
export const MarkdownIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="md-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#md-grad)" />
    <path d="M4.5 15.5V8.5h2.2l2.3 3 2.3-3h2.2v7h-1.8v-4.2l-2 2.6h-1.4l-2-2.6v4.2H4.5z" fill="#FFFFFF" />
    <path d="M17.5 12.5V8.5h1.8v4h1.8L18.4 16l-2.7-3.5h1.8z" fill="#38BDF8" />
  </svg>
);

/* 35. Subtitle Icon */
export const SubtitleIcon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="sub-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#14B8A6" />
        <stop offset="100%" stopColor="#0D9488" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#sub-grad)" />
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
    <line x1="7" y1="12" x2="11" y2="12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    <line x1="13" y1="12" x2="17" y2="12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="15" x2="16" y2="15" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* 36. Base64 / Binary Icon */
export const Base64Icon: React.FC<IconProps> = ({ size = 24, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="b64-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#4338CA" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#b64-grad)" />
    <text x="12" y="16" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="monospace">64</text>
  </svg>
);
