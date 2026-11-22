import { PLANTS, type PlantId } from '../../shared/game';

type PlantArtProps = {
  plant: PlantId;
  /** Pixel size of the square SVG. */
  size?: number;
  className?: string;
};

/**
 * Hand-drawn SVG art for each plant species. Kept deliberately simple and
 * chunky so it reads at 32px on a phone screen.
 */
export const PlantArt = ({ plant, size = 40, className }: PlantArtProps) => {
  const info = PLANTS[plant];
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 48 48',
    role: 'img',
    'aria-label': info.name,
    className,
  };

  switch (plant) {
    case 'sunflower':
      return (
        <svg {...common}>
          <line x1="24" y1="26" x2="24" y2="42" stroke="#2f6b3a" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 36 Q14 34 12 26 Q22 26 24 36" fill="#4d9e57" />
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i * Math.PI) / 4;
            const x = 24 + Math.cos(angle) * 11;
            const y = 18 + Math.sin(angle) * 11;
            return (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx="5"
                ry="3.4"
                fill="#f5b301"
                transform={`rotate(${(i * 45).toString()} ${x.toString()} ${y.toString()})`}
              />
            );
          })}
          <circle cx="24" cy="18" r="7" fill="#7a4a00" />
          <circle cx="22" cy="16" r="1.2" fill="#a9711f" />
          <circle cx="26" cy="19" r="1.2" fill="#a9711f" />
          <circle cx="24" cy="21" r="1" fill="#a9711f" />
        </svg>
      );
    case 'rose':
      return (
        <svg {...common}>
          <line x1="24" y1="24" x2="24" y2="42" stroke="#2f6b3a" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 34 Q34 32 36 24 Q26 24 24 34" fill="#4d9e57" />
          <circle cx="24" cy="16" r="10" fill="#e5484d" />
          <circle cx="20" cy="13" r="5" fill="#f2555a" />
          <circle cx="28" cy="18" r="4.5" fill="#c62f34" />
          <circle cx="24" cy="16" r="3" fill="#7f1d1d" />
          <path d="M20 12 Q24 8 28 12" stroke="#fda4af" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'mushroom':
      return (
        <svg {...common}>
          <rect x="19" y="24" width="10" height="16" rx="4" fill="#e8e0d0" />
          <path d="M8 26 Q8 10 24 10 Q40 10 40 26 Q32 30 24 30 Q16 30 8 26" fill="#b3402e" />
          <circle cx="17" cy="19" r="2.4" fill="#fdf6ec" />
          <circle cx="28" cy="15" r="2" fill="#fdf6ec" />
          <circle cx="33" cy="22" r="1.6" fill="#fdf6ec" />
          <ellipse cx="24" cy="41" rx="9" ry="2" fill="#c9a876" opacity="0.7" />
        </svg>
      );
    case 'cactus':
      return (
        <svg {...common}>
          <rect x="20" y="10" width="9" height="32" rx="4.5" fill="#4d9e57" />
          <path d="M20 26 L12 26 Q10 26 10 22 L10 18 Q10 14 14 14 Q18 14 18 18 L18 22 L20 22" fill="#4d9e57" />
          <path d="M29 30 L37 30 Q39 30 39 26 L39 22 Q39 18 35 18 Q31 18 31 22 L31 26 L29 26" fill="#4d9e57" />
          <line x1="24" y1="15" x2="24" y2="37" stroke="#2c5f33" strokeWidth="1.4" strokeDasharray="2 3" />
          <ellipse cx="24" cy="43" rx="12" ry="2" fill="#c9a876" opacity="0.7" />
        </svg>
      );
    case 'fern':
      return (
        <svg {...common}>
          <line x1="24" y1="18" x2="24" y2="42" stroke="#2f6b3a" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M24 26 Q10 22 8 10 Q20 12 24 26" fill="#5aa469" />
          <path d="M24 26 Q38 22 40 10 Q28 12 24 26" fill="#5aa469" />
          <path d="M24 32 Q14 30 12 20 Q22 22 24 32" fill="#6fb57e" />
          <path d="M24 32 Q34 30 36 20 Q26 22 24 32" fill="#6fb57e" />
          <path d="M24 20 Q18 14 20 6 Q26 12 24 20" fill="#7cc489" />
          <path d="M24 20 Q30 14 28 6 Q22 12 24 20" fill="#7cc489" />
        </svg>
      );
    case 'tulip':
      return (
        <svg {...common}>
          <line x1="24" y1="26" x2="24" y2="42" stroke="#2f6b3a" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 36 Q14 34 12 26 Q22 26 24 36" fill="#4d9e57" />
          <path d="M15 12 L18 28 Q18 33 24 33 Q30 33 30 28 L33 12 L28 17 L24 12 L20 17 Z" fill="#f472b6" />
          <path d="M20 17 L24 12 L24 30 Q20 28 20 17" fill="#ec4899" />
          <path d="M24 12 L28 17 L28 28 Q28 30 24 30 Z" fill="#f9a8d4" />
        </svg>
      );
    case 'berry':
      return (
        <svg {...common}>
          <line x1="24" y1="22" x2="24" y2="42" stroke="#2f6b3a" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 34 Q14 32 12 24 Q22 24 24 34" fill="#4d9e57" />
          <path d="M24 30 Q34 28 36 20 Q26 20 24 30" fill="#4d9e57" />
          <circle cx="18" cy="16" r="6.5" fill="#6d5bd0" />
          <circle cx="29" cy="13" r="6.5" fill="#7c6cd8" />
          <circle cx="26" cy="23" r="6" fill="#5b4cc4" />
          <circle cx="16" cy="14" r="1.8" fill="#c4b5fd" />
          <circle cx="27" cy="11" r="1.8" fill="#c4b5fd" />
          <circle cx="24" cy="21" r="1.5" fill="#c4b5fd" />
        </svg>
      );
    case 'mint':
      return (
        <svg {...common}>
          <line x1="24" y1="14" x2="24" y2="42" stroke="#065f46" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M24 24 Q12 22 10 12 Q22 12 24 24" fill="#34d399" />
          <path d="M24 24 Q36 22 38 12 Q26 12 24 24" fill="#34d399" />
          <path d="M24 32 Q15 30 13 22 Q22 22 24 32" fill="#6ee7b7" />
          <path d="M24 32 Q33 30 35 22 Q26 22 24 32" fill="#6ee7b7" />
          <path d="M24 16 Q20 8 24 5 Q28 8 24 16" fill="#a7f3d0" />
        </svg>
      );
  }
};
