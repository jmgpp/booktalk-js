import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
}

export function Logo({ className, size = 'medium' }: LogoProps) {
  // Size mappings
  const sizes = {
    small: 32,
    medium: 48,
    large: 80
  }
  
  const width = sizes[size]
  const height = width // Logo is approximately square

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
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