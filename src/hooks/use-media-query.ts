"use client"

import { useEffect, useState } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const media = window.matchMedia(query)
    
    // Update the state initially
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    
    // Define a listener function
    const listener = () => {
      setMatches(media.matches)
    }
    
    // Add the listener
    media.addEventListener("change", listener)
    
    // Clean up
    return () => {
      media.removeEventListener("change", listener)
    }
  }, [matches, query])
  
  return matches
} 