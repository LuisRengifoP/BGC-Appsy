export function MapWatermark() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.03]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="map-grid"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="#2563EB"
              strokeWidth="0.5"
            />
          </pattern>
          <pattern
            id="map-dots"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="1" fill="#2563EB" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#map-grid)" />
        <rect width="100%" height="100%" fill="url(#map-dots)" />
        <path
          d="M 100 400 Q 200 350 350 380 T 600 360 T 850 390 T 1100 350 T 1400 370"
          fill="none"
          stroke="#16A34A"
          strokeWidth="1.5"
          strokeDasharray="8 6"
          opacity="0.5"
        />
        <path
          d="M 0 500 Q 150 460 300 490 T 550 470 T 800 500 T 1050 460 T 1300 480"
          fill="none"
          stroke="#2563EB"
          strokeWidth="1"
          strokeDasharray="6 4"
          opacity="0.4"
        />
        <circle cx="350" cy="380" r="4" fill="#2563EB" opacity="0.3" />
        <circle cx="600" cy="360" r="3" fill="#16A34A" opacity="0.3" />
        <circle cx="850" cy="390" r="5" fill="#2563EB" opacity="0.25" />
        <circle cx="1100" cy="350" r="3" fill="#16A34A" opacity="0.3" />
      </svg>
    </div>
  );
}
