import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { getToolBySlug, getCategoryInfo, getToolsByCategory } from '../data/toolRegistry';
import type { Tool } from '../data/toolRegistry';
import { getIconComponent } from '../utils/iconMap';
import { lazy, Suspense } from 'react';
import AdPlaceholder from '../components/AdPlaceholder';
import './ToolPage.css';

/* Lazy-load tool implementations */
const toolComponents: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'video-player': lazy(() => import('../tools/VideoPlayer')),
  'diskwala-video-player': lazy(() => import('../tools/DiskwalaVideoPlayer')),
  'terabox-video-player': lazy(() => import('../tools/TeraboxVideoPlayer')),
  'direct-video-player': lazy(() => import('../tools/VideoPlayer')),
  'video-metadata-viewer': lazy(() => import('../tools/VideoMetadataViewer')),
  'video-aspect-ratio-calculator': lazy(() => import('../tools/AspectRatioCalculator')),
  'video-resolution-calculator': lazy(() => import('../tools/ResolutionCalculator')),
  'video-thumbnail-extractor': lazy(() => import('../tools/VideoThumbnailExtractor')),
  'video-playback-speed-controller': lazy(() => import('../tools/VideoPlayer')),
  'pdf-merger': lazy(() => import('../tools/PdfMerger')),
  'pdf-splitter': lazy(() => import('../tools/PdfSplitter')),
  'pdf-compressor': lazy(() => import('../tools/PdfCompressor')),
  'pdf-to-jpg': lazy(() => import('../tools/PdfToJpg')),
  'jpg-to-pdf': lazy(() => import('../tools/JpgToPdf')),
  'pdf-metadata-viewer': lazy(() => import('../tools/PdfMetadataViewer')),
  'pdf-rotation-tool': lazy(() => import('../tools/PdfRotation')),
  'image-compressor': lazy(() => import('../tools/ImageCompressor')),
  'image-size-reducer': lazy(() => import('../tools/ImageCompressor')),
  'image-resizer': lazy(() => import('../tools/ImageResizer')),
  'webp-converter': lazy(() => import('../tools/WebpConverter')),
  'jpg-to-png': lazy(() => import('../tools/ImageConverter')),
  'png-to-jpg': lazy(() => import('../tools/ImageConverter')),
  'jpg-to-webp': lazy(() => import('../tools/WebpConverter')),
  'png-to-webp': lazy(() => import('../tools/WebpConverter')),
  'webp-to-jpg': lazy(() => import('../tools/ImageConverter')),
  'image-cropper': lazy(() => import('../tools/ImageCropper')),
  'image-rotator': lazy(() => import('../tools/ImageRotator')),
  'image-flipper': lazy(() => import('../tools/ImageFlipper')),
  'image-metadata-viewer': lazy(() => import('../tools/ImageMetadataViewer')),
  'image-dimensions-checker': lazy(() => import('../tools/ImageMetadataViewer')),
  'image-to-base64': lazy(() => import('../tools/ImageToBase64')),
  'base64-to-image': lazy(() => import('../tools/Base64ToImage')),
  'favicon-generator': lazy(() => import('../tools/FaviconGenerator')),
  'csv-to-json': lazy(() => import('../tools/CsvToJson')),
  'json-to-csv': lazy(() => import('../tools/JsonToCsv')),
  'json-formatter': lazy(() => import('../tools/JsonFormatter')),
  'json-validator': lazy(() => import('../tools/JsonValidator')),
  'markdown-to-html': lazy(() => import('../tools/MarkdownToHtml')),
  'html-to-text': lazy(() => import('../tools/HtmlToText')),
  'yaml-to-json': lazy(() => import('../tools/YamlToJson')),
  'base64-encoder-decoder': lazy(() => import('../tools/Base64EncoderDecoder')),
  'url-encoder-decoder': lazy(() => import('../tools/UrlEncoderDecoder')),
  'file-hash-generator': lazy(() => import('../tools/FileHashGenerator')),
  'mime-type-checker': lazy(() => import('../tools/MimeTypeChecker')),
  'srt-to-vtt': lazy(() => import('../tools/SrtToVtt')),
  'vtt-to-srt': lazy(() => import('../tools/VttToSrt')),
  'subtitle-timestamp-shifter': lazy(() => import('../tools/SubtitleTimestampShifter')),
  'qr-code-generator': lazy(() => import('../tools/QrCodeGenerator')),
  'qr-code-reader': lazy(() => import('../tools/QrCodeReader')),
  'social-media-image-resizer': lazy(() => import('../tools/SocialMediaImageResizer')),
  'open-graph-preview': lazy(() => import('../tools/OpenGraphPreview')),
  'meta-title-preview': lazy(() => import('../tools/MetaTitlePreview')),
  'serp-preview': lazy(() => import('../tools/MetaTitlePreview')),
  'robots-txt-generator': lazy(() => import('../tools/RobotsTxtGenerator')),
  'xml-sitemap-generator': lazy(() => import('../tools/XmlSitemapGenerator')),
  'url-slug-generator': lazy(() => import('../tools/UrlSlugGenerator')),
  'utm-builder': lazy(() => import('../tools/UtmBuilder')),
  'json-ld-generator': lazy(() => import('../tools/JsonLdGenerator')),
  'open-graph-tag-generator': lazy(() => import('../tools/OpenGraphTagGenerator')),
  'heading-structure-analyzer': lazy(() => import('../tools/HeadingStructureAnalyzer')),
  'readability-checker': lazy(() => import('../tools/ReadabilityChecker')),
  'word-counter': lazy(() => import('../tools/WordCounter')),
  'character-counter': lazy(() => import('../tools/WordCounter')),
  'case-converter': lazy(() => import('../tools/CaseConverter')),
  'remove-duplicate-lines': lazy(() => import('../tools/RemoveDuplicateLines')),
  'text-diff-checker': lazy(() => import('../tools/TextDiffChecker')),
  'text-sorter': lazy(() => import('../tools/TextSorter')),
  'lorem-ipsum-generator': lazy(() => import('../tools/LoremIpsumGenerator')),
  'password-generator': lazy(() => import('../tools/PasswordGenerator')),
  'uuid-generator': lazy(() => import('../tools/UuidGenerator')),
  'color-picker': lazy(() => import('../tools/ColorPicker')),
  'color-converter': lazy(() => import('../tools/ColorPicker')),
  'percentage-calculator': lazy(() => import('../tools/PercentageCalculator')),
  'discount-calculator': lazy(() => import('../tools/DiscountCalculator')),
  'age-calculator': lazy(() => import('../tools/AgeCalculator')),
  'date-difference-calculator': lazy(() => import('../tools/DateDifferenceCalculator')),
  'number-base-converter': lazy(() => import('../tools/NumberBaseConverter')),
  'random-number-generator': lazy(() => import('../tools/RandomNumberGenerator')),
};

export default function ToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const tool = slug ? getToolBySlug(slug) : undefined;

  if (!tool) return <Navigate to="/404" replace />;

  const category = getCategoryInfo(tool.category);
  const ToolComponent = slug ? toolComponents[slug] : undefined;
  const relatedTools = tool.relatedTools
    ?.map(id => getToolsByCategory(tool.category).find(t => t.id === id))
    .filter(Boolean) as Tool[] | undefined;

  return (
    <div className="tool-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          {category && (
            <>
              <Link to={`/category/${category.id}`}>{category.name}</Link>
              <ChevronRight size={14} />
            </>
          )}
          <span>{tool.name}</span>
        </nav>

        {/* Tool header */}
        <div className="tool-page-header">
          <Link to={category ? `/category/${category.id}` : '/tools'} className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="tool-page-title-row">
            <div className="tool-page-icon" style={{ background: `${category?.color || '#6366f1'}18` }}>
              {(() => { const Icon = getIconComponent(tool.icon); return <Icon size={28} style={{ color: category?.color }} />; })()}
            </div>
            <div>
              <h1 className="tool-page-title">{tool.name}</h1>
              <p className="tool-page-desc">{tool.description}</p>
            </div>
          </div>
        </div>

        {/* Tool content */}
        <div className="tool-page-content">
          {ToolComponent ? (
            <Suspense fallback={
              <div className="tool-loading">
                <div className="loading-ring"></div>
                <p>Loading tool...</p>
              </div>
            }>
              <ToolComponent />
            </Suspense>
          ) : (
            <div className="tool-unavailable glass">
              <p>This tool is currently being implemented. Check back soon!</p>
            </div>
          )}
        </div>

        {/* Ad placement below tool */}
        <AdPlaceholder slot="tool-below" format="banner" />

        {/* SEO content */}
        <div className="tool-page-seo">
          <section className="tool-info-section">
            <h2>What does this tool do?</h2>
            <p>{tool.description} This tool processes your data directly in your browser when possible, keeping your files private and secure.</p>
          </section>

          {tool.inputFormats && tool.inputFormats.length > 0 && (
            <section className="tool-info-section">
              <h2>Supported formats</h2>
              <div className="format-tags">
                {tool.inputFormats.map(f => <span key={f} className="format-tag">.{f}</span>)}
                {tool.outputFormats?.map(f => <span key={`out-${f}`} className="format-tag format-tag-output">.{f}</span>)}
              </div>
            </section>
          )}
        </div>

        {/* Related tools */}
        {relatedTools && relatedTools.length > 0 && (
          <section className="related-tools">
            <h2 className="section-title" style={{ fontSize: '1.25rem' }}>Related tools</h2>
            <div className="related-tools-grid">
              {relatedTools.map(rt => {
                const Icon = getIconComponent(rt.icon);
                return (
                  <Link key={rt.id} to={`/tools/${rt.slug}`} className="card card-interactive tool-card">
                    <div className="tool-card-icon" style={{ background: `${category?.color || '#6366f1'}18` }}>
                      <Icon size={18} style={{ color: category?.color }} />
                    </div>
                    <div className="tool-card-info">
                      <h3 className="tool-card-name">{rt.name}</h3>
                      <p className="tool-card-desc">{rt.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
