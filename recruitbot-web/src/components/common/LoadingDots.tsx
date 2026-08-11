export function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1" aria-label="Loading…">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-text-muted animate-dot-bounce"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

export default LoadingDots;
