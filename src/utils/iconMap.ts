import React from 'react';
import {
  Play, FileText, Image, Film, Music, ArrowLeftRight, Captions,
  Wand2, Search, Zap, MonitorPlay, Info, Maximize2, Ruler,
  ImageDown, Gauge, Scissors, FileDown, FileImage, FileUp,
  FileSearch, RotateCcw, Scaling, ArrowRightLeft, Crop, RotateCw,
  FlipHorizontal, ScanSearch, Binary, Globe, FileJson,
  FileSpreadsheet, Braces, CheckCircle, FileCode, Link, Hash,
  FileQuestion, Clock, QrCode, ScanLine, Share2, Eye, Bot, Map,
  Link2, List, BookOpen, Type, CaseSensitive, ListMinus,
  GitCompare, ArrowUpDown, AlignLeft, KeyRound, Fingerprint,
  Palette, Paintbrush, Percent, BadgePercent, Calendar,
  CalendarRange, Combine, Eraser
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as RealIcons from '../components/RealToolIcons';

export type IconComponentType = React.ComponentType<{
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}>;

/* Fallback Lucide Icon Map */
const iconMap: Record<string, LucideIcon> = {
  Play, FileText, Image, Film, Music, ArrowLeftRight, Captions,
  Wand2, Search, Zap, MonitorPlay, Info, Maximize2, Ruler,
  ImageDown, Gauge, Scissors, FileDown, FileImage, FileUp,
  FileSearch, RotateCcw, Scaling, ArrowRightLeft, Crop, RotateCw,
  FlipHorizontal, ScanSearch, Binary, Globe, FileJson,
  FileSpreadsheet, Braces, CheckCircle, FileCode, Link, Hash,
  FileQuestion, Clock, QrCode, ScanLine, Share2, Eye, Bot, Map,
  Link2, List, BookOpen, Type, CaseSensitive, ListMinus,
  GitCompare, ArrowUpDown, AlignLeft, KeyRound, Fingerprint,
  Palette, Paintbrush, Percent, BadgePercent, Calendar,
  CalendarRange, Combine, Eraser,
  RulerIcon: Ruler,
  Dice5: Zap,
};

/* Authentic High-Fidelity Brand & Tool Icons Map */
const realToolMap: Record<string, IconComponentType> = {
  // Video & Downloaders
  'youtube-video-downloader': RealIcons.YouTubeIcon,
  'youtube': RealIcons.YouTubeIcon,
  'YouTube': RealIcons.YouTubeIcon,

  'instagram-reels-downloader': RealIcons.InstagramIcon,
  'instagram': RealIcons.InstagramIcon,
  'Instagram': RealIcons.InstagramIcon,

  'pinterest-image-downloader': RealIcons.PinterestIcon,
  'pinterest': RealIcons.PinterestIcon,
  'Pinterest': RealIcons.PinterestIcon,

  'terabox-video-player': RealIcons.TeraBoxIcon,
  'terabox': RealIcons.TeraBoxIcon,
  'TeraBox': RealIcons.TeraBoxIcon,

  'diskwala-video-player': RealIcons.DiskwalaIcon,
  'diskwala': RealIcons.DiskwalaIcon,
  'Diskwala': RealIcons.DiskwalaIcon,

  'video-player': RealIcons.VideoPlayerIcon,
  'direct-video-player': RealIcons.VideoPlayerIcon,
  'video-thumbnail-extractor': RealIcons.VideoPlayerIcon,
  'video-playback-speed-controller': RealIcons.VideoPlayerIcon,
  'video-metadata-viewer': RealIcons.VideoPlayerIcon,
  'VideoPlayer': RealIcons.VideoPlayerIcon,

  'video-aspect-ratio-calculator': RealIcons.AspectRatioIcon,
  'video-resolution-calculator': RealIcons.AspectRatioIcon,
  'image-dimensions-checker': RealIcons.AspectRatioIcon,
  'AspectRatio': RealIcons.AspectRatioIcon,

  // PDF Family
  'pdf-merger': RealIcons.PdfMergeIcon,
  'PdfMerge': RealIcons.PdfMergeIcon,
  'pdf-splitter': RealIcons.PdfSplitIcon,
  'PdfSplit': RealIcons.PdfSplitIcon,
  'pdf-compressor': RealIcons.PdfCompressIcon,
  'PdfCompress': RealIcons.PdfCompressIcon,
  'pdf-to-jpg': RealIcons.PdfToJpgIcon,
  'PdfToJpg': RealIcons.PdfToJpgIcon,
  'jpg-to-pdf': RealIcons.JpgToPdfIcon,
  'JpgToPdf': RealIcons.JpgToPdfIcon,
  'pdf-metadata-viewer': RealIcons.PdfIcon,
  'pdf-rotation-tool': RealIcons.PdfIcon,
  'pdf': RealIcons.PdfIcon,
  'Pdf': RealIcons.PdfIcon,

  // Image Family
  'image-compressor': RealIcons.ImageCompressIcon,
  'image-size-reducer': RealIcons.ImageCompressIcon,
  'ImageCompress': RealIcons.ImageCompressIcon,

  'webp-converter': RealIcons.WebpIcon,
  'jpg-to-webp': RealIcons.WebpIcon,
  'png-to-webp': RealIcons.WebpIcon,
  'webp-to-jpg': RealIcons.WebpIcon,
  'Webp': RealIcons.WebpIcon,

  'image-resizer': RealIcons.ImageResizeIcon,
  'jpg-to-png': RealIcons.ImageResizeIcon,
  'png-to-jpg': RealIcons.ImageResizeIcon,
  'image-rotator': RealIcons.ImageResizeIcon,
  'image-flipper': RealIcons.ImageResizeIcon,
  'image-metadata-viewer': RealIcons.ImageResizeIcon,
  'social-media-image-resizer': RealIcons.ImageResizeIcon,
  'ImageResize': RealIcons.ImageResizeIcon,

  'image-cropper': RealIcons.ImageCropIcon,
  'ImageCrop': RealIcons.ImageCropIcon,

  'background-remover': RealIcons.BackgroundRemoverIcon,
  'BackgroundRemover': RealIcons.BackgroundRemoverIcon,

  'favicon-generator': RealIcons.FaviconIcon,
  'Favicon': RealIcons.FaviconIcon,

  'image-to-base64': RealIcons.Base64Icon,
  'base64-to-image': RealIcons.Base64Icon,
  'base64-encoder-decoder': RealIcons.Base64Icon,
  'Base64': RealIcons.Base64Icon,

  // Documents & Data
  'html-to-word': RealIcons.WordIcon,
  'Word': RealIcons.WordIcon,

  'csv-to-json': RealIcons.ExcelIcon,
  'json-to-csv': RealIcons.ExcelIcon,
  'Excel': RealIcons.ExcelIcon,

  'json-formatter': RealIcons.JsonIcon,
  'json-validator': RealIcons.JsonIcon,
  'yaml-to-json': RealIcons.JsonIcon,
  'json-ld-generator': RealIcons.JsonIcon,
  'Json': RealIcons.JsonIcon,

  'markdown-to-html': RealIcons.MarkdownIcon,
  'html-to-text': RealIcons.MarkdownIcon,
  'Markdown': RealIcons.MarkdownIcon,

  // QR Code
  'qr-code-generator': RealIcons.QrCodeRealIcon,
  'qr-code-reader': RealIcons.QrCodeRealIcon,
  'QrCode': RealIcons.QrCodeRealIcon,

  // Subtitles
  'srt-to-vtt': RealIcons.SubtitleIcon,
  'vtt-to-srt': RealIcons.SubtitleIcon,
  'subtitle-timestamp-shifter': RealIcons.SubtitleIcon,
  'Subtitle': RealIcons.SubtitleIcon,

  // Security & Passwords
  'password-generator': RealIcons.PasswordIcon,
  'file-hash-generator': RealIcons.PasswordIcon,
  'Password': RealIcons.PasswordIcon,

  'uuid-generator': RealIcons.UuidIcon,
  'Uuid': RealIcons.UuidIcon,

  // Color Tools
  'color-picker': RealIcons.ColorPickerIcon,
  'color-converter': RealIcons.ColorPickerIcon,
  'ColorPicker': RealIcons.ColorPickerIcon,

  // Math & Calculators
  'percentage-calculator': RealIcons.PercentageIcon,
  'discount-calculator': RealIcons.PercentageIcon,
  'random-number-generator': RealIcons.PercentageIcon,
  'Percentage': RealIcons.PercentageIcon,

  'age-calculator': RealIcons.AgeCalculatorIcon,
  'Age': RealIcons.AgeCalculatorIcon,

  'date-difference-calculator': RealIcons.DateDiffIcon,
  'DateDiff': RealIcons.DateDiffIcon,

  'number-base-converter': RealIcons.Base64Icon,

  // Text & SEO
  'robots-txt-generator': RealIcons.RobotsTxtIcon,
  'RobotsTxt': RealIcons.RobotsTxtIcon,

  'xml-sitemap-generator': RealIcons.SitemapIcon,
  'Sitemap': RealIcons.SitemapIcon,

  'open-graph-preview': RealIcons.SeoSearchIcon,
  'meta-title-preview': RealIcons.SeoSearchIcon,
  'serp-preview': RealIcons.SeoSearchIcon,
  'url-slug-generator': RealIcons.SeoSearchIcon,
  'utm-builder': RealIcons.SeoSearchIcon,
  'open-graph-tag-generator': RealIcons.SeoSearchIcon,
  'SeoSearch': RealIcons.SeoSearchIcon,

  'heading-structure-analyzer': RealIcons.WordCounterIcon,
  'readability-checker': RealIcons.WordCounterIcon,
  'word-counter': RealIcons.WordCounterIcon,
  'character-counter': RealIcons.WordCounterIcon,
  'case-converter': RealIcons.WordCounterIcon,
  'lorem-ipsum-generator': RealIcons.WordCounterIcon,
  'mime-type-checker': RealIcons.WordCounterIcon,
  'url-encoder-decoder': RealIcons.WordCounterIcon,
  'WordCounter': RealIcons.WordCounterIcon,

  'remove-duplicate-lines': RealIcons.TextDiffIcon,
  'text-diff-checker': RealIcons.TextDiffIcon,
  'text-sorter': RealIcons.TextDiffIcon,
  'TextDiff': RealIcons.TextDiffIcon,
};

export function getIconComponent(name?: string, toolId?: string): IconComponentType {
  // 1. Try toolId match
  if (toolId && realToolMap[toolId]) {
    return realToolMap[toolId];
  }
  // 2. Try exact name match in realToolMap
  if (name && realToolMap[name]) {
    return realToolMap[name];
  }
  // 3. Try lowercase matching
  if (toolId && realToolMap[toolId.toLowerCase()]) {
    return realToolMap[toolId.toLowerCase()];
  }
  if (name && realToolMap[name.toLowerCase()]) {
    return realToolMap[name.toLowerCase()];
  }
  // 4. Try Lucide icon map
  if (name && iconMap[name]) {
    return iconMap[name];
  }
  return Zap;
}
