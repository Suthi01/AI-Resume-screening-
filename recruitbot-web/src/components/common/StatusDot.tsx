export function StatusDot() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="animate-status-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
    </span>
  );
}

export default StatusDot;
