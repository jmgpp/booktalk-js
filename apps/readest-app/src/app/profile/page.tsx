'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client'; // Use @ alias now
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext'; // Import auth context if using one
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa'; // Icons for editing

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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
        const { data, error } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setError('Failed to load profile data.');
          if (error.code === 'PGRST116') { // PGRST116: Row not found
             setError('Profile not found. It might still be creating after signup.');
          } else {
             setError(error.message);
          }
        } else if (data) {
          setProfile(data);
          setUsername(data.username || '');
          setFullName(data.full_name || '');
          if (data.avatar_url) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.avatar_url);
            setAvatarPreview(urlData?.publicUrl || null);
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
      setUsername(profile.username || '');
      setFullName(profile.full_name || '');
      setAvatarFile(null);
      setAvatarPreview(profile.avatar_url ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl : null);
    }
    setIsEditing(!isEditing);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset input value so the same file can be re-selected
    event.target.value = ''; 
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
    let newAvatarPath: string | null = profile?.avatar_url || null;

    try {
      // 1. Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`; // Unique path within user's folder
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { 
              upsert: true, // Overwrite if file exists (useful for replacing avatar)
              cacheControl: '3600' // Cache for 1 hour
          });

        if (uploadError) {
          throw uploadError;
        }
        newAvatarPath = filePath; // Store the path, not the full URL initially
        console.log('Avatar uploaded successfully to path:', newAvatarPath);
        // Note: We might need to remove the old avatar if the path changes significantly
      }

      // 2. Update profile table
      const updates = {
        username: username,
        full_name: fullName,
        avatar_url: newAvatarPath, // Store the path
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state after successful save
      setProfile({ 
          username: username, 
          full_name: fullName, 
          avatar_url: newAvatarPath 
      });
      if (newAvatarPath) {
          // Regenerate preview URL from the potentially new path
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(newAvatarPath);
          setAvatarPreview(urlData?.publicUrl || null);
      } else {
          setAvatarPreview(null); // Clear preview if avatar was removed (though we don't support removal yet)
      }
      setIsEditing(false);
      setAvatarFile(null); // Clear staged file

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
          {/* Avatar */}
          <div className="flex flex-col items-center md:items-start">
            <div className="relative mb-4 h-32 w-32 md:h-40 md:w-40">
              <Image
                src={avatarPreview || '/default-avatar.png'} // Use preview, fallback to default
                alt="Profile Avatar"
                width={160}
                height={160}
                className="rounded-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }} // Fallback on image error
              />
              {isEditing && (
                <button 
                  onClick={triggerAvatarUpload}
                  className="absolute bottom-1 right-1 rounded-full bg-primary p-2 text-primary-content shadow-md hover:bg-primary-focus"
                  aria-label="Change Avatar"
                  disabled={uploading}
                >
                  <FaEdit />
                </button>
              )}
            </div>
            {isEditing && (
                 <input 
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                    accept="image/png, image/jpeg, image/gif, image/webp" 
                  />
            )}
          </div>

          {/* User Details */}
          <div className="md:col-span-2">
            <div className="mb-4">
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
            <div className="mb-4">
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
             {isEditing && (
                <button 
                  onClick={handleSaveProfile}
                  className={`btn btn-primary mt-4 ${uploading ? 'loading' : ''}`}
                  disabled={uploading}
                >
                   {uploading ? 'Saving...' : <><FaSave className="mr-1"/> Save Changes</>}
                </button>
            )}
             {error && <p className="mt-4 text-sm text-error">Error: {error}</p>}
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
  );
} 