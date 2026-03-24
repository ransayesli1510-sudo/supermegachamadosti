/**
 * BrandLogo - renders inline SVG logos for known brands.
 * No external HTTP request needed — always visible.
 */

interface BrandLogoProps {
    brand: string;
    size?: number;
}

const BRAND_COLORS: Record<string, { bg: string; text: string }> = {
    'Toyota': { bg: '#EB0A1E', text: '#FFFFFF' },
    'Honda': { bg: '#CC0000', text: '#FFFFFF' },
    'Volkswagen': { bg: '#001E50', text: '#FFFFFF' },
    'BYD': { bg: '#1DB9D5', text: '#FFFFFF' },
    'Chevrolet': { bg: '#D4A017', text: '#000000' },
    'Fiat': { bg: '#000000', text: '#FFFFFF' },
    'Jeep': { bg: '#3A5F0B', text: '#FFFFFF' },
    'Hyundai': { bg: '#002C5F', text: '#FFFFFF' },
    'Ford': { bg: '#003478', text: '#FFFFFF' },
    'Nissan': { bg: '#C3002F', text: '#FFFFFF' },
    'Renault': { bg: '#FFCC00', text: '#000000' },
};

export function BrandLogo({ brand, size = 28 }: BrandLogoProps) {
    const colors = BRAND_COLORS[brand] || { bg: '#555555', text: '#FFFFFF' };
    const initials = brand.substring(0, 3).toUpperCase();
    const fontSize = size * 0.36;
    const radius = size * 0.22;

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0 }}
        >
            <rect width={size} height={size} rx={radius} ry={radius} fill={colors.bg} />
            <text
                x="50%"
                y="54%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill={colors.text}
                fontSize={fontSize}
                fontFamily="Arial, sans-serif"
                fontWeight="bold"
                letterSpacing="0.5"
            >
                {initials}
            </text>
        </svg>
    );
}
