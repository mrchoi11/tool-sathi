import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { getCategoryInfo, getToolsByCategory, categories } from '../data/toolRegistry';
import { getIconComponent } from '../utils/iconMap';
import './AllToolsPage.css';

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = categoryId ? getCategoryInfo(categoryId as any) : undefined;

  if (!category) return <Navigate to="/404" replace />;

  const tools = getToolsByCategory(category.id);
  const activeTools = tools.filter(t => t.status === 'active');

  return (
    <div className="all-tools-page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <Link to="/tools">All Tools</Link>
          <ChevronRight size={14} />
          <span>{category.name}</span>
        </nav>

        <div className="all-tools-header" style={{ marginTop: 'var(--space-md)' }}>
          <p className="section-label">{category.name}</p>
          <h1 className="section-title">{category.name}</h1>
          <p className="section-description">{category.description} — {activeTools.length} tool{activeTools.length !== 1 ? 's' : ''} available.</p>
        </div>

        <div className="all-tools-grid">
          {activeTools.map(tool => {
            const Icon = getIconComponent(tool.icon);
            return (
              <Link key={tool.id} to={`/tools/${tool.slug}`} className="card card-interactive tool-card">
                <div className="tool-card-icon" style={{ background: `${category.color}18` }}>
                  <Icon size={20} style={{ color: category.color }} />
                </div>
                <div className="tool-card-info">
                  <h3 className="tool-card-name">{tool.name}</h3>
                  <p className="tool-card-desc">{tool.description}</p>
                </div>
                <ArrowRight size={14} className="tool-card-arrow" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
