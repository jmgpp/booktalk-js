import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'small' | 'medium' | 'large' | 'header'
  variant?: 'standard' | 'horizontal'
}

export function Logo({ className, size = 'medium', variant = 'standard' }: LogoProps) {
  // Size mappings for standard logo
  const sizes = {
    small: 32,
    medium: 48,
    large: 120, // 1.5x larger for loading/login screens
    header: 47  // Exact height for header logo
  }
  
  // Use horizontal logo for header
  const logoSrc = variant === 'horizontal' ? '/logo-h.png' : '/logo.png'
  
  // For horizontal variant, adjust dimensions
  let width = sizes[size]
  let height = width
  
  // Horizontal logo has fixed dimensions for header
  if (variant === 'horizontal' && size === 'header') {
    width = 200 // Fixed width for horizontal header logo
    height = 47 // Fixed height for horizontal header logo
  } else if (variant === 'horizontal') {
    // For other sizes of horizontal variant
    width = sizes[size] * 3
    height = sizes[size]
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <Image
        src={logoSrc}
        alt="BookTalk Logo"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
    </div>
  )
} 