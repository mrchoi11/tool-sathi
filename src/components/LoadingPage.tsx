import './LoadingPage.css';

export default function LoadingPage() {
  return (
    <div className="loading-page">
      <div className="loading-spinner" role="status" aria-label="Loading">
        <div className="loading-ring"></div>
      </div>
    </div>
  );
}
