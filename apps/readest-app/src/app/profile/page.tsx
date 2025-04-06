'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client'; // Use @ alias now
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext'; // Import auth context if using one
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa'; // Icons for editing
import AvatarCropperModal from './components/AvatarCropperModal'; // Import the modal

// Define a type for the profile data we expect
interface ProfileData {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const { user } = useAuth(); // Get user from Auth context (assuming it exists)
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  
  // State for avatar handling
  const [avatarFileToUpload, setAvatarFileToUpload] = useState<Blob | null>(null); // Stores the *cropped* blob for upload
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // Stores URL for display (original or blob URL)
  const [sourceImageForCropper, setSourceImageForCropper] = useState<string | null>(null); // Image passed to cropper
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !supabase) {
        setError(!supabase ? 'Supabase client not initialized. Check environment variables.' : 'User not logged in.');
        setLoading(false);
        return; 
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching profile:', fetchError);
          setError('Failed to load profile data.');
          if (fetchError.code === 'PGRST116') { // PGRST116: Row not found
             setError('Profile not found. It might still be creating after signup.');
          } else {
             setError(fetchError.message);
          }
        } else if (data) {
          setProfile(data);
          setUsername(data.username || '');
          setFullName(data.full_name || '');
          if (data.avatar_url) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.avatar_url);
            setAvatarPreview(urlData?.publicUrl || null);
          } else {
            setAvatarPreview(null); // Ensure preview is null if no avatar_url
          }
        }
      } catch (err) {
        console.error('Client-side error fetching profile:', err);
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]); // Re-fetch if user object changes

  const handleEditToggle = () => {
    if (isEditing && profile && supabase) {
      // Reset fields if cancelling edit
      setUsername(profile.username || '');
      setFullName(profile.full_name || '');
      setAvatarFileToUpload(null); // Clear staged upload blob
      // Reset preview to original
      setAvatarPreview(profile.avatar_url ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl : null);
    } else if (!isEditing && profile?.avatar_url && supabase) {
        // Ensure preview is current before entering edit mode
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(profile.avatar_url);
        setAvatarPreview(urlData?.publicUrl || null);
    }
    setIsEditing(!isEditing);
  };

  // When file input changes, store the source and open the cropper
  const handleAvatarInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImageForCropper(reader.result as string);
        setIsCropperOpen(true); // Open the modal
      };
      reader.readAsDataURL(file);
    }
    event.target.value = ''; 
  };

  // Called by the modal when cropping is done
  const handleCropComplete = (croppedImageBlob: Blob) => {
    setAvatarFileToUpload(croppedImageBlob); // Store the blob for upload
    setAvatarPreview(URL.createObjectURL(croppedImageBlob)); // Update preview with blob URL
    setIsCropperOpen(false); // Close modal
  };

  const triggerAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async () => {
    if (!user || !supabase) {
        setError(!supabase ? 'Supabase client not initialized.' : 'User not logged in.');
        return;
    }

    setUploading(true);
    setError(null);
    let newAvatarPath: string | null = profile?.avatar_url || null; // Start with current path
    let uploadedNewAvatar = false;

    try {
      // 1. Upload *cropped* blob if it exists
      if (avatarFileToUpload) {
        const fileExt = avatarFileToUpload.type.split('/')[1] || 'jpg'; // Default to jpg
        const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`; 
        const oldAvatarPath = profile?.avatar_url; // Get old path *before* potential update
        
        console.log('Uploading cropped avatar to:', filePath);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFileToUpload, { 
              upsert: true, 
              contentType: avatarFileToUpload.type 
          });

        if (uploadError) throw uploadError;
        
        newAvatarPath = filePath; // Update path to the newly uploaded file
        uploadedNewAvatar = true;
        console.log('Cropped avatar uploaded successfully to path:', newAvatarPath);

        // Delete old avatar *after* successful upload of new one
        if (oldAvatarPath && oldAvatarPath !== newAvatarPath) {
           console.log('Deleting old avatar:', oldAvatarPath);
           const { error: removeError } = await supabase.storage
              .from('avatars')
              .remove([oldAvatarPath]);
           if (removeError) {
               // Log error but don't block the profile update
               console.error('Failed to delete old avatar:', removeError);
           }
        }
      }

      // 2. Update profile table (only if name/username changed or new avatar uploaded)
      const profileUpdates: Partial<ProfileData> & { updated_at: string } = { updated_at: new Date().toISOString() };
      let needsUpdate = false;
      if (username !== profile?.username) {
          profileUpdates.username = username;
          needsUpdate = true;
      }
      if (fullName !== profile?.full_name) {
          profileUpdates.full_name = fullName;
          needsUpdate = true;
      }
      if (newAvatarPath !== profile?.avatar_url) {
          profileUpdates.avatar_url = newAvatarPath;
          needsUpdate = true;
      }

      if (needsUpdate) {
          console.log('Updating profile table with:', profileUpdates);
          const { error: updateError } = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', user.id);
    
          if (updateError) throw updateError;
          console.log('Profile table updated successfully.');
      } else {
          console.log('No changes to profile data detected.');
      }

      // Update local state after successful save
      setProfile((prev) => ({ 
          ...(prev || {}),
          username: username, 
          full_name: fullName, 
          avatar_url: newAvatarPath 
      }));
      // Preview is already updated if a new blob was cropped
      // If no new avatar was uploaded, ensure preview matches stored URL
      if (!uploadedNewAvatar && newAvatarPath) {
         const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(newAvatarPath);
         setAvatarPreview(urlData?.publicUrl || null);
      }
      
      setIsEditing(false);
      setAvatarFileToUpload(null); // Clear staged blob
      setSourceImageForCropper(null);

    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading Profile...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  if (!profile) {
    // This might happen briefly after signup before the trigger runs
    return <div className="container mx-auto p-4">Profile data not available yet. Please wait or try reloading.</div>;
  }

  return (
    <>
      <div className="container mx-auto max-w-4xl p-4 md:p-8">
        {/* Back Button - Positioned absolutely or within flow */}
        <div className="mb-4">
          <Link href="/home" className="btn btn-sm btn-ghost">
            &lt; Back to Home
          </Link>
        </div>

        <div className="rounded-lg bg-base-200 p-6 shadow-md">
          {/* Header with Edit Button */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold md:text-3xl">My Profile</h1>
            <button onClick={handleEditToggle} className="btn btn-ghost btn-sm p-2">
              {isEditing ? (
                <> <FaTimes className="mr-1" /> Cancel </> 
              ) : (
                 <> <FaEdit className="mr-1" /> Edit Profile </> 
              )}
            </button>
          </div>

          {/* Profile Info Section */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Avatar Section */}
            <div className="flex flex-col items-center md:items-start"> {/* Outer flex container */}
              {/* New Relative Wrapper for Avatar + Button */}
              <div className="relative mb-4"> {/* Add relative here */} 
                {/* Avatar Container - Needs relative for Image fill */}
                <div className="relative h-32 w-32 overflow-hidden rounded-full md:h-40 md:w-40"> {/* Add relative back here */} 
                  <Image
                    src={avatarPreview || '/default-avatar.png'} 
                    alt="Profile Avatar"
                    fill
                    sizes="(max-width: 768px) 8rem, 10rem"
                    className="object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }}
                  />
                </div>
                {/* Edit button positioned relative to the new wrapper div */}
                {isEditing && (
                  <button 
                    onClick={triggerAvatarUpload}
                    // Position relative to the new wrapper
                    className="absolute bottom-2 right-2 rounded-full bg-primary p-2 text-primary-content shadow-md hover:bg-primary-focus"
                    aria-label="Change Avatar"
                    disabled={uploading}
                  >
                    <FaEdit />
                  </button>
                )}
              </div> {/* End Relative Wrapper */} 
              
              {/* Hidden Input (can stay outside the relative wrapper if preferred) */}
              {isEditing && (
                 <input 
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleAvatarInputChange}
                    accept="image/png, image/jpeg, image/gif, image/webp" 
                  />
              )}
            </div>

            {/* User Details */}
            <div className="md:col-span-2">
              {/* Wrap Name/Username sections in divs with min-height */}
              <div className="mb-4 min-h-16"> {/* Adjust min-h as needed */} 
                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                {isEditing ? (
                  <input 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input input-bordered mt-1 w-full"
                    disabled={uploading}
                  />
                ) : (
                  <p className="mt-1 text-lg">{profile.full_name || '-'}</p>
                )}
              </div>
              <div className="mb-4 min-h-16"> {/* Adjust min-h as needed */} 
                <label className="block text-sm font-medium text-gray-500">Username</label>
                 {isEditing ? (
                  <input 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input input-bordered mt-1 w-full"
                     disabled={uploading}
                  />
                ) : (
                   <p className="mt-1 text-lg">{profile.username || '-'}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-lg text-gray-400">{user?.email || '-'}</p> {/* Email is not editable */}
              </div>
              {/* Container to reserve space for Save button and error */}
              <div className="mt-4 min-h-16"> {/* Adjust min-h as needed */} 
                 {isEditing && (
                    <button 
                      onClick={handleSaveProfile}
                      className={`btn btn-primary ${uploading ? 'loading' : ''}`}
                      disabled={uploading}
                    >
                       {uploading ? 'Saving...' : <><FaSave className="mr-1"/> Save Changes</>}
                    </button>
                )}
                 {/* Error message below button, within the reserved space */}
                 {error && <p className="mt-2 text-sm text-error">Error: {error}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Mockup Widgets Section */} 
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Friends Widget Placeholder */}
          <div className="rounded-lg bg-base-200 p-4 shadow-md">
            <h2 className="mb-3 text-xl font-semibold">Friends</h2>
            <p className="text-gray-500">Friends list will appear here...</p>
            {/* TODO: Add friend list items */}
          </div>

          {/* Stats Widget Placeholder */}
          <div className="rounded-lg bg-base-200 p-4 shadow-md">
            <h2 className="mb-3 text-xl font-semibold">Reading Stats</h2>
            <p className="text-gray-500">Reading statistics will appear here...</p>
            {/* TODO: Add stats display */}
          </div>
        </div>
      </div>

      {/* Render the Cropper Modal */}
      <AvatarCropperModal
        isOpen={isCropperOpen}
        imageSrc={sourceImageForCropper}
        onClose={() => {
            setIsCropperOpen(false);
            setSourceImageForCropper(null);
        }}
        onCropComplete={handleCropComplete}
      />
    </>
  );
} 