'use client'

interface DragicaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  xs: { wrapper: 'w-6 h-6', shadow: '1px 1px 0px' },
  sm: { wrapper: 'w-10 h-10', shadow: '2px 2px 0px' },
  md: { wrapper: 'w-14 h-14', shadow: '3px 3px 0px' },
  lg: { wrapper: 'w-20 h-20', shadow: '4px 4px 0px' },
  xl: { wrapper: 'w-24 h-24', shadow: '5px 5px 0px' },
}

export default function DragicaLogo({ size = 'md', className = '' }: DragicaLogoProps) {
  const { wrapper, shadow } = sizes[size]

  return (
    <div
      className={`${wrapper} rounded-xl bg-white border-3 border-[#1B4332] flex items-center justify-center overflow-hidden ${className}`}
      style={{ boxShadow: `${shadow} #1B4332` }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background */}
        <rect width="100" height="100" fill="#C5E8CB" />

        {/* Neck */}
        <path
          d="M40 85 L40 72 Q50 75 60 72 L60 85 L40 85"
          fill="#F5D0C5"
          stroke="#1B4332"
          strokeWidth="2"
        />

        {/* Face - oval shape */}
        <ellipse
          cx="50"
          cy="52"
          rx="22"
          ry="26"
          fill="#F5D0C5"
          stroke="#1B4332"
          strokeWidth="2.5"
        />

        {/* Hair - 50s bouffant/victory rolls style */}
        <path
          d="M25 45
             Q20 30 30 20
             Q40 10 50 12
             Q60 10 70 20
             Q80 30 75 45
             Q72 35 65 32
             Q55 28 50 30
             Q45 28 35 32
             Q28 35 25 45"
          fill="#1B4332"
          stroke="#1B4332"
          strokeWidth="1"
        />

        {/* Hair sides - curls */}
        <path
          d="M28 45 Q22 50 25 58 Q28 52 32 50 Q28 48 28 45"
          fill="#1B4332"
        />
        <path
          d="M72 45 Q78 50 75 58 Q72 52 68 50 Q72 48 72 45"
          fill="#1B4332"
        />

        {/* Eyebrows - arched 50s style */}
        <path
          d="M35 42 Q40 38 46 41"
          stroke="#1B4332"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M54 41 Q60 38 65 42"
          stroke="#1B4332"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Eyes - cat eye style */}
        <ellipse cx="40" cy="48" rx="5" ry="3.5" fill="white" stroke="#1B4332" strokeWidth="1.5" />
        <ellipse cx="60" cy="48" rx="5" ry="3.5" fill="white" stroke="#1B4332" strokeWidth="1.5" />

        {/* Pupils */}
        <circle cx="40" cy="48" r="2" fill="#1B4332" />
        <circle cx="60" cy="48" r="2" fill="#1B4332" />

        {/* Eye highlights */}
        <circle cx="41" cy="47" r="0.8" fill="white" />
        <circle cx="61" cy="47" r="0.8" fill="white" />

        {/* Cat-eye eyeliner wings */}
        <path
          d="M34 47 L32 45"
          stroke="#1B4332"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M66 47 L68 45"
          stroke="#1B4332"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Nose - simple */}
        <path
          d="M50 52 L48 60 Q50 62 52 60 L50 52"
          stroke="#1B4332"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Lips - 50s red lips */}
        <path
          d="M42 68 Q46 66 50 67 Q54 66 58 68 Q54 72 50 72 Q46 72 42 68"
          fill="#E76F51"
          stroke="#1B4332"
          strokeWidth="1.5"
        />

        {/* Upper lip detail - cupid's bow */}
        <path
          d="M44 68 Q47 66 50 67 Q53 66 56 68"
          stroke="#C5544A"
          strokeWidth="0.8"
          fill="none"
        />

        {/* Cheek blush */}
        <circle cx="33" cy="58" r="4" fill="#E8B4A8" opacity="0.6" />
        <circle cx="67" cy="58" r="4" fill="#E8B4A8" opacity="0.6" />

        {/* Beauty mark - classic 50s */}
        <circle cx="62" cy="63" r="1.2" fill="#1B4332" />

        {/* Pearl earrings */}
        <circle cx="27" cy="60" r="3" fill="white" stroke="#1B4332" strokeWidth="1" />
        <circle cx="73" cy="60" r="3" fill="white" stroke="#1B4332" strokeWidth="1" />
        <circle cx="26.5" cy="59" r="1" fill="#F5F5F5" opacity="0.8" />
        <circle cx="72.5" cy="59" r="1" fill="#F5F5F5" opacity="0.8" />

        {/* Hair shine highlights */}
        <path
          d="M35 22 Q40 18 45 22"
          stroke="#2D5A4A"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        <path
          d="M55 22 Q60 18 65 22"
          stroke="#2D5A4A"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
      </svg>
    </div>
  )
}
