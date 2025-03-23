"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { Camera, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Cropper, { Area } from 'react-easy-crop'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl?: string | null
  onAvatarUpdated: () => void
  onError: (error: string) => void
}

// Helper function to create an image from a file
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error: Event) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

// Function to get cropped canvas
const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Set canvas size to the desired output size (200x200)
  canvas.width = 200
  canvas.height = 200

  // Draw the cropped image to the canvas, scaling it to 200x200
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    200,
    200
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'))
        return
      }
      resolve(blob)
    }, 'image/jpeg', 0.95)
  })
}

export function AvatarUpload({ userId, currentAvatarUrl, onAvatarUpdated, onError }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  
  // Generate default avatar URL or use provided one
  useEffect(() => {
    if (currentAvatarUrl) {
      setAvatarUrl(currentAvatarUrl)
    }
  }, [currentAvatarUrl])

  const onCropComplete = useCallback((_: any, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return
    }
    
    const file = event.target.files[0]
    
    // Check if file is an image and not too large
    if (!file.type.match(/image\/(jpeg|png|jpg|gif)/)) {
      onError('File must be an image (JPEG, PNG, GIF).')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      onError('File size must be less than 5MB.')
      return
    }
    
    setImageFile(file)
    
    // Create a preview
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      const result = reader.result
      if (typeof result === 'string') {
        setImageSrc(result)
        setCropModalOpen(true)
      }
    })
    reader.readAsDataURL(file)
  }
  
  const handleCropCancel = () => {
    setCropModalOpen(false)
    setImageSrc(null)
    setImageFile(null)
  }
  
  const handleCropComplete = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels || !imageFile) {
        return
      }
      
      setUploading(true)
      
      // Generate cropped image blob
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
      
      // Create a file from the blob
      const fileExt = imageFile.name.split('.').pop() || 'jpg'
      const fileName = `${userId}-${uuidv4()}.${fileExt}`
      
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(fileName, croppedImage, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${fileExt}`
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
      
      // Close the modal
      setCropModalOpen(false)
      setImageSrc(null)
      setImageFile(null)
      
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
    <>
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
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
      </div>
      
      {/* Crop Modal */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="max-w-md bg-palette-darkPurple border-palette-purple text-palette-textLight">
          <DialogTitle className="text-lg font-medium mb-4">Crop Your Profile Picture</DialogTitle>
          
          <div className="relative aspect-square w-full bg-black rounded-md mb-4 overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                objectFit="contain"
              />
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="zoom" className="block text-sm mb-1">Zoom</label>
            <input
              id="zoom"
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              onClick={handleCropCancel} 
              className="bg-palette-purple/50 hover:bg-palette-purple/70"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleCropComplete} 
              className="bg-palette-pink hover:bg-palette-pink/90"
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 