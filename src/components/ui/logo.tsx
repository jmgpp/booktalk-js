import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
}

export function Logo({ className, size = 'medium' }: LogoProps) {
  // Size mappings
  const sizes = {
    small: 24,
    medium: 36,
    large: 64
  }
  
  const width = sizes[size]
  const height = width * 1.25 // Maintain aspect ratio
  
  return (
    <div className={cn('relative', className)}>
      <Image
        src="/logo.png"
        alt="BookTalk Logo"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
    </div>
  )
} 