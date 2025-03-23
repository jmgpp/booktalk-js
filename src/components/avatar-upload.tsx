"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { Camera, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl?: string | null
  onAvatarUpdated: () => void
  onError: (error: string) => void
}

export function AvatarUpload({ userId, currentAvatarUrl, onAvatarUpdated, onError }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  
  // Generate default avatar URL or use provided one
  useEffect(() => {
    if (currentAvatarUrl) {
      setAvatarUrl(currentAvatarUrl)
    }
  }, [currentAvatarUrl])
  
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }
      
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${uuidv4()}.${fileExt}`
      
      // Check if file is an image and not too large
      if (!file.type.match(/image\/(jpeg|png|jpg|gif)/)) {
        throw new Error('File must be an image (JPEG, PNG, GIF).')
      }
      
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image size must be less than 2MB.')
      }
      
      // Upload the file to Supabase storage (assuming 'avatars' bucket already exists)
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })
        
      if (uploadError) {
        console.error('Error uploading avatar:', uploadError)
        throw new Error(`Error uploading image: ${uploadError.message}`)
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(fileName)
        
      const newAvatarUrl = publicUrlData.publicUrl
      
      // Update the user's profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl, updated_at: new Date().toISOString() })
        .eq('id', userId)
        
      if (updateError) {
        console.error('Error updating profile with avatar URL:', updateError)
        throw new Error(`Error saving profile: ${updateError.message}`)
      }
      
      // Try to delete the old avatar if it exists
      if (avatarUrl && avatarUrl.includes('avatars')) {
        try {
          const oldFileName = avatarUrl.split('/').pop()
          if (oldFileName && oldFileName.startsWith(userId)) {
            const { error: deleteError } = await supabase
              .storage
              .from('avatars')
              .remove([oldFileName])
              
            if (deleteError) {
              console.error('Error deleting old avatar:', deleteError)
            }
          }
        } catch (error) {
          // Silently fail if we can't delete the old avatar
          console.error('Error deleting old avatar:', error)
        }
      }
      
      // Update the local avatar URL state
      setAvatarUrl(newAvatarUrl)
      
      // Notify parent component
      onAvatarUpdated()
      
    } catch (error) {
      console.error('Error uploading avatar:', error)
      onError(error instanceof Error ? error.message : 'Error uploading avatar')
    } finally {
      setUploading(false)
    }
  }
  
  // Generate default avatar for display when no custom avatar is available
  const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${userId.substring(0, 2)}&background=random&color=fff&size=256`
  
  return (
    <div className="relative group">
      <div className="h-32 w-32 rounded-full overflow-hidden bg-palette-darkPurple border-4 border-palette-purple/30 relative">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Profile Avatar"
            width={128}
            height={128}
            className="rounded-full object-cover"
          />
        ) : (
          <Image
            src={defaultAvatarUrl}
            alt="Default Avatar"
            width={128}
            height={128}
            className="rounded-full object-cover"
          />
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-palette-darkPurple/80 flex items-center justify-center rounded-full">
            <Loader2 className="h-8 w-8 text-palette-pink animate-spin" />
          </div>
        )}
      </div>
      
      <label 
        htmlFor="avatar-upload" 
        className="absolute bottom-0 right-0 bg-palette-pink hover:bg-palette-pink/90 text-white p-2 rounded-full cursor-pointer shadow-lg transition-opacity opacity-0 group-hover:opacity-100"
        title="Upload new avatar"
      >
        <Camera className="h-5 w-5" />
        <span className="sr-only">Upload Avatar</span>
      </label>
      
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={uploadAvatar}
        className="hidden"
        disabled={uploading}
      />
    </div>
  )
} 