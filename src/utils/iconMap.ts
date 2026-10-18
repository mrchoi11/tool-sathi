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
  CalendarRange, Combine
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
  CalendarRange, Combine,
  // Aliases
  RulerIcon: Ruler,
  Dice5: Zap,
};

export function getIconComponent(name: string): LucideIcon {
  return iconMap[name] || Zap;
}
