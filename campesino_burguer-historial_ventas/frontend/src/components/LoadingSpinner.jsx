export default function LoadingSpinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div
        className="w-6 h-6 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
        style={{ animation: 'spin 0.6s linear infinite' }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
