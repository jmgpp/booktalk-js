import React from 'react';

interface ReadingProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  circleColor?: string;
  progressColor?: string;
  textColor?: string;
  showPercentage?: boolean;
}

export function ReadingProgress({
  percentage,
  size = 120,
  strokeWidth = 10,
  circleColor = '#383150',
  progressColor = '#ED4B86',
  textColor = '#F8F5EB',
  showPercentage = true
}: ReadingProgressProps) {
  // Ensure percentage is between 0 and 100
  const normalizedPercentage = Math.min(100, Math.max(0, percentage));
  
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedPercentage / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={circleColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Percentage text */}
      {showPercentage && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ color: textColor }}
        >
          <span className="text-2xl font-bold">{Math.round(normalizedPercentage)}%</span>
          <span className="text-xs opacity-80">Complete</span>
        </div>
      )}
    </div>
  );
} 