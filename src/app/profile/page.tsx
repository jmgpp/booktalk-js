"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Loader2, Edit2, User, Mail, AtSign, FileText, BookOpen, Bookmark, BookMarked, Clock, Calendar, BookText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AvatarUpload } from '@/components/avatar-upload'
import { StatsCard } from '@/components/stats-card'
import { ReadingProgress } from '@/components/reading-progress'
import { RecentBooks } from '@/components/recent-books'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'
import { getUserReadingStats, getUserRecentBooks, type ReadingStats, type RecentBook } from '@/lib/reading-stats'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ProfilePage() {
  const { user, profile, loading, profileLoading, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    email: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [localLoading, setLocalLoading] = useState(true)
  const [readingStats, setReadingStats] = useState<ReadingStats | null>(null)
  const [recentBooks, setRecentBooks] = useState<RecentBook[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [booksLoading, setBooksLoading] = useState(true)

  // Load profile data when available or fetch it if missing
  useEffect(() => {
    const loadProfileData = async () => {
      setLocalLoading(true)
      
      try {
        if (profile) {
          setFormData({
            username: profile.username || '',
            full_name: profile.full_name || '',
            bio: profile.bio || '',
            email: user?.email || ''
          })
          setLocalLoading(false)
          return
        }
        
        // If we don't have profile data but have a user, fetch it manually
        if (user && !profile && refreshProfile) {
          console.log('Manually fetching profile data')
          await refreshProfile()
          
          // If we still don't have a profile after refreshing, create a default form data
          if (!profile) {
            setFormData({
              username: user?.email?.split('@')[0] || '',
              full_name: '',
              bio: '',
              email: user?.email || ''
            })
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error)
      } finally {
        setLocalLoading(false)
      }
    }
    
    loadProfileData()
    
    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      setLocalLoading(false)
    }, 3000)
    
    return () => clearTimeout(safetyTimeout)
  }, [profile, user, refreshProfile])
  
  // Load reading statistics when user is available
  useEffect(() => {
    const loadReadingStats = async () => {
      if (!user) return
      
      setStatsLoading(true)
      setBooksLoading(true)
      
      try {
        // Fetch reading stats
        const stats = await getUserReadingStats(user.id)
        setReadingStats(stats)
        
        // Fetch recent books
        const books = await getUserRecentBooks(user.id, 5)
        setRecentBooks(books)
      } catch (error) {
        console.error('Error loading reading data:', error)
      } finally {
        setStatsLoading(false)
        setBooksLoading(false)
      }
    }
    
    loadReadingStats()
  }, [user])
  
  // Function to handle profile picture update
  const handleAvatarUpdated = () => {
    setSuccess('Profile picture updated successfully!')
    refreshProfile && refreshProfile()
  }

  // Fixed error handler with proper type
  const handleAvatarError = (errorMessage: string) => {
    setError(errorMessage);
  }

  if (loading || localLoading) {
    return (
      <div className="min-h-screen bg-palette-darkPurple text-palette-textLight">
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-[70vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-palette-pink" />
              <p className="text-xl">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('Updating profile with data:', formData)
      
      // Create update data without email (which is not in the profiles table)
      const updateData = {
        username: formData.username,
        full_name: formData.full_name,
        bio: formData.bio,
        updated_at: new Date().toISOString()
      }
      
      console.log('Submitting update to Supabase:', updateData)
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) {
        console.error('Supabase error updating profile:', error)
        throw error
      }

      console.log('Profile updated successfully, refreshing data')
      
      // Refresh the profile data
      if (refreshProfile) {
        await refreshProfile()
      }

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setError('Error updating profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const displayName = formData.username || user?.email?.split('@')[0] || 'User'
  const fullName = formData.full_name || 'Book Enthusiast'
  
  // Calculate reading progress percentage
  const readingProgressPercentage = readingStats && readingStats.totalPages > 0 
    ? Math.round((readingStats.pagesRead / readingStats.totalPages) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-palette-darkPurple to-palette-purple/90 text-palette-textLight">
      <div className="container mx-auto py-8 px-4">
        {/* Header with navigation */}
        <div className="flex items-center mb-8">
          <Link href="/" className="mr-4 flex items-center text-palette-textLight hover:text-palette-pink transition">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-2xl font-bold">Your Profile</h1>
        </div>

        {/* Main content */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-palette-purple/30 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden">
            {/* Profile header with avatar */}
            <div className="relative bg-gradient-to-r from-palette-pink/20 to-palette-purple/20 p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                  {profileLoading ? (
                    <Skeleton className="h-32 w-32 rounded-full" />
                  ) : (
                    <AvatarUpload 
                      userId={user.id}
                      currentAvatarUrl={profile?.avatar_url}
                      onAvatarUpdated={handleAvatarUpdated}
                      onError={handleAvatarError}
                    />
                  )}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold mb-2">
                    {displayName}
                  </h2>
                  <p className="text-palette-textLight/70 mb-4">
                    {fullName}
                  </p>
                  {!isEditing && (
                    <Button 
                      onClick={() => setIsEditing(true)} 
                      className="bg-palette-pink hover:bg-palette-pink/90"
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile content */}
            <div className="p-8">
              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-6 bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}

              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="mb-8 bg-palette-darkPurple/50">
                  <TabsTrigger value="profile">Profile Info</TabsTrigger>
                  <TabsTrigger value="stats">Reading Stats</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="full_name" className="flex items-center gap-2 text-sm font-medium mb-2">
                              <User className="h-4 w-4" /> Full Name
                            </label>
                            <Input
                              id="full_name"
                              name="full_name"
                              value={formData.full_name}
                              onChange={handleInputChange}
                              className="bg-palette-darkPurple/70 text-white border-palette-purple border-opacity-50"
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div>
                            <label htmlFor="username" className="flex items-center gap-2 text-sm font-medium mb-2">
                              <AtSign className="h-4 w-4" /> Username
                            </label>
                            <Input
                              id="username"
                              name="username"
                              value={formData.username}
                              onChange={handleInputChange}
                              className="bg-palette-darkPurple/70 text-white border-palette-purple border-opacity-50"
                              placeholder="Enter your username"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium mb-2">
                            <Mail className="h-4 w-4" /> Email Address
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            disabled
                            className="bg-palette-darkPurple/70 text-white border-palette-purple border-opacity-50 opacity-70"
                          />
                          <p className="text-xs mt-1 text-palette-textLight/70">
                            Your email cannot be changed.
                          </p>
                        </div>
                        
                        <div>
                          <label htmlFor="bio" className="flex items-center gap-2 text-sm font-medium mb-2">
                            <FileText className="h-4 w-4" /> Bio
                          </label>
                          <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio ?? ''}
                            onChange={handleInputChange}
                            className="w-full bg-palette-darkPurple/70 text-white border border-palette-purple border-opacity-50 rounded-md p-2.5 h-24 resize-none"
                            placeholder="Tell others about yourself..."
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-4">
                        <Button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="bg-palette-purple/50 hover:bg-palette-purple/70"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          className="bg-palette-pink hover:bg-palette-pink/90"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>Save Changes</>
                          )}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h3 className="text-lg font-medium mb-2">About</h3>
                          <div className="bg-palette-darkPurple/30 p-4 rounded-lg">
                            {formData.bio ? (
                              <p className="text-palette-textLight/90">{formData.bio}</p>
                            ) : (
                              <p className="text-palette-textLight/50 italic">No bio added yet.</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">Contact</h3>
                          <div className="bg-palette-darkPurple/30 p-4 rounded-lg space-y-3">
                            <div className="flex items-start gap-3">
                              <Mail className="h-5 w-5 text-palette-pink mt-0.5" />
                              <div>
                                <p className="text-sm text-palette-textLight/70">Email</p>
                                <p>{formData.email}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <User className="h-5 w-5 text-palette-pink mt-0.5" />
                              <div>
                                <p className="text-sm text-palette-textLight/70">Full Name</p>
                                <p>{formData.full_name || 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <AtSign className="h-5 w-5 text-palette-pink mt-0.5" />
                              <div>
                                <p className="text-sm text-palette-textLight/70">Username</p>
                                <p>{formData.username}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="stats">
                  {statsLoading ? (
                    <div className="animate-pulse space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-32 bg-palette-purple/30 rounded-xl"></div>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-48 bg-palette-purple/30 rounded-xl"></div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Books statistics */}
                      <div>
                        <h3 className="text-xl font-medium mb-4">Reading Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <StatsCard 
                            icon={<BookOpen className="h-5 w-5" />}
                            label="Total Books"
                            value={readingStats?.totalBooks || 0}
                            variant="pink"
                          />
                          <StatsCard 
                            icon={<BookMarked className="h-5 w-5" />}
                            label="Books Read"
                            value={readingStats?.booksRead || 0}
                            variant="teal"
                          />
                          <StatsCard 
                            icon={<BookOpen className="h-5 w-5" />}
                            label="Currently Reading"
                            value={readingStats?.booksReading || 0}
                            variant="blue"
                          />
                          <StatsCard 
                            icon={<Bookmark className="h-5 w-5" />}
                            label="Want to Read"
                            value={readingStats?.booksWantToRead || 0}
                            variant="orange"
                          />
                        </div>
                      </div>
                      
                      {/* Reading progress and habits */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-palette-darkPurple/20 rounded-xl p-6 flex flex-col items-center justify-center">
                          <h3 className="text-lg font-medium mb-4 text-center">Overall Progress</h3>
                          <ReadingProgress percentage={readingProgressPercentage} />
                          <div className="mt-4 text-center">
                            <p className="text-palette-textLight/70 text-sm">
                              {readingStats?.pagesRead || 0} of {readingStats?.totalPages || 0} pages
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-palette-darkPurple/20 rounded-xl p-6">
                          <h3 className="text-lg font-medium mb-4">Reading Habits</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-palette-yellow" />
                                <span>Avg. Days to Finish</span>
                              </div>
                              <span className="font-bold">
                                {readingStats?.readingHabits.averageDaysToFinish || 0} days
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-palette-blue" />
                                <span>Books Last Month</span>
                              </div>
                              <span className="font-bold">
                                {readingStats?.readingHabits.booksLastMonth || 0}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <BookText className="h-5 w-5 text-palette-pink" />
                                <span>Pages Last Month</span>
                              </div>
                              <span className="font-bold">
                                {readingStats?.readingHabits.pagesLastMonth || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-palette-darkPurple/20 rounded-xl p-6">
                          <h3 className="text-lg font-medium mb-4">Library Composition</h3>
                          {readingStats && readingStats.totalBooks > 0 ? (
                            <div className="space-y-4">
                              <div>
                                <p className="flex items-center justify-between mb-1">
                                  <span className="text-palette-teal">Read</span>
                                  <span>{Math.round((readingStats.booksRead / readingStats.totalBooks) * 100)}%</span>
                                </p>
                                <div className="w-full h-2 bg-palette-darkPurple rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-palette-teal rounded-full"
                                    style={{ width: `${(readingStats.booksRead / readingStats.totalBooks) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div>
                                <p className="flex items-center justify-between mb-1">
                                  <span className="text-palette-blue">Reading</span>
                                  <span>{Math.round((readingStats.booksReading / readingStats.totalBooks) * 100)}%</span>
                                </p>
                                <div className="w-full h-2 bg-palette-darkPurple rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-palette-blue rounded-full"
                                    style={{ width: `${(readingStats.booksReading / readingStats.totalBooks) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div>
                                <p className="flex items-center justify-between mb-1">
                                  <span className="text-palette-orange">Want to Read</span>
                                  <span>{Math.round((readingStats.booksWantToRead / readingStats.totalBooks) * 100)}%</span>
                                </p>
                                <div className="w-full h-2 bg-palette-darkPurple rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-palette-orange rounded-full"
                                    style={{ width: `${(readingStats.booksWantToRead / readingStats.totalBooks) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-palette-textLight/70 text-center">No books in your library yet.</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Recent books */}
                      <div>
                        <h3 className="text-xl font-medium mb-4">Recent Books</h3>
                        <RecentBooks books={recentBooks} loading={booksLoading} />
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 