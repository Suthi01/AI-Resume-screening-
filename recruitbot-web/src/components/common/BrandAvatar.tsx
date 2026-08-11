import StatusDot from './StatusDot';

export function BrandAvatar() {
  return (
    <div className="flex items-center gap-3">
      {/* Circular Avatar with Indigo -> Pink gradient */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="url(#brand-gradient)" />
          <defs>
            <linearGradient id="brand-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <text
            x="50%"
            y="55%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="15"
            fontWeight="bold"
            fontFamily="Inter, system-ui, sans-serif"
          >
            RB
          </text>
        </svg>
      </div>

      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-text-primary text-sm tracking-tight leading-tight">
          RecruitBot
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <StatusDot />
          <span className="text-[10px] text-text-muted font-semibold tracking-wider uppercase">
            Online
          </span>
        </div>
      </div>
    </div>
  );
}

export default BrandAvatar;
