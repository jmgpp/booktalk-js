"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  BookOpen,
  Users,
  Search,
  Bell,
  Menu,
  ChevronRight,
  BookMarked,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"

export default function HomePage() {
  const { user, profile, loading, profileLoading, signOut } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth")
    }
  }, [loading, user, router])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-palette-darkPurple flex items-center justify-center">
        <div className="text-center text-palette-textLight">
          <div className="animate-pulse mb-4">
            <Logo size="large" className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Loading BookTalk...</h1>
          <p className="text-palette-textLight/70">Please wait while we get things ready</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-palette-darkPurple text-palette-textLight">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-palette-purple/50 bg-palette-darkPurple/95 backdrop-blur supports-[backdrop-filter]:bg-palette-darkPurple/60">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Logo size="header" variant="horizontal" />
          </div>

          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <Link
                href="/books/reader"
                className="text-sm font-medium text-palette-textLight hover:text-palette-blue transition-colors"
              >
                Reader
              </Link>
              <Link
                href="/"
                className="text-sm font-medium text-palette-textLight hover:text-palette-blue transition-colors"
              >
                Home
              </Link>
              <Link
                href="/clubs"
                className="text-sm font-medium text-palette-textLight hover:text-palette-blue transition-colors"
              >
                Book Clubs
              </Link>
              <Link
                href="#"
                className="text-sm font-medium text-palette-textLight hover:text-palette-orange transition-colors"
              >
                Discover
              </Link>
              <Link
                href="#"
                className="text-sm font-medium text-palette-textLight hover:text-palette-yellow transition-colors"
              >
                My Library
              </Link>
              <Link
                href="#"
                className="text-sm font-medium text-palette-textLight hover:text-palette-teal transition-colors"
              >
                Groups
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-palette-textLight hover:bg-palette-purple/30 rounded-2xl"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-palette-textLight hover:bg-palette-purple/30 rounded-2xl"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Link href="/profile">
                <Avatar className="border-2 border-palette-pink hover:border-palette-pink/70 transition-colors cursor-pointer">
                  <AvatarImage src={profile?.avatar_url || `/api/avatar?name=${encodeURIComponent(profile?.username || user?.email?.substring(0, 2) || "U")}`} alt="User" />
                  <AvatarFallback className="bg-palette-purple text-white">
                    {profile?.username?.substring(0, 2) || user?.email?.substring(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-palette-textLight hover:bg-palette-purple/30 rounded-2xl"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && isMobile && (
          <div className="md:hidden border-t border-palette-purple/50">
            <div className="container py-4">
              <nav className="flex flex-col space-y-4">
                <Link
                  href="/books/reader"
                  className="flex items-center text-sm font-medium text-palette-textLight hover:text-palette-blue transition-colors"
                >
                  Reader
                </Link>
                <Link
                  href="/"
                  className="flex items-center text-sm font-medium text-palette-textLight hover:text-palette-blue transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/clubs"
                  className="flex items-center text-sm font-medium text-palette-textLight hover:text-palette-blue transition-colors"
                >
                  Book Clubs
                </Link>
                <Link
                  href="#"
                  className="flex items-center text-sm font-medium text-palette-textLight hover:text-palette-pink transition-colors"
                >
                  Discover
                </Link>
                <Link
                  href="#"
                  className="flex items-center text-sm font-medium text-palette-textLight hover:text-palette-yellow transition-colors"
                >
                  My Library
                </Link>
                <Link
                  href="#"
                  className="flex items-center text-sm font-medium text-palette-textLight hover:text-palette-teal transition-colors"
                >
                  Groups
                </Link>
                <div className="pt-2 flex justify-between">
                  <Button 
                    onClick={signOut} 
                    variant="ghost" 
                    className="text-palette-textLight hover:text-palette-pink hover:bg-palette-purple/30"
                  >
                    Sign Out
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-palette-textLight hover:bg-palette-purple/30 rounded-2xl"
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-palette-textLight hover:bg-palette-purple/30 rounded-2xl"
                    >
                      <Bell className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>

      {profileLoading && (
        <div className="bg-palette-yellow/60 border-l-4 border-palette-yellow text-palette-textDark p-3">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-palette-yellow rounded-full animate-pulse mr-2"></div>
            <p className="text-sm">Refreshing your profile data...</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="container py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card className="overflow-hidden bg-palette-darkPurpleLight border-palette-purple">
            <CardHeader className="bg-gradient-to-r from-palette-darkPurple to-palette-purple pb-8 pt-6">
              <div className="flex justify-center mb-3">
                <Avatar className="h-20 w-20 border-4 border-palette-pink shadow-xl">
                  <AvatarImage src={profile?.avatar_url || `/api/avatar?name=${encodeURIComponent(profile?.username || user?.email?.substring(0, 2) || "U")}`} alt="User" />
                  <AvatarFallback className="text-2xl bg-palette-purple text-white">
                    {profile?.username?.substring(0, 2) || user?.email?.substring(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-center text-palette-textLight">{profile?.username || user?.email}</CardTitle>
              <CardDescription className="text-center text-palette-textLight/70">Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'recently'}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 p-4">
              <Button 
                onClick={signOut} 
                variant="ghost" 
                className="text-palette-textLight hover:bg-palette-purple/30 hover:text-white justify-start"
              >
                Sign Out
              </Button>
              <Link 
                href="/profile"
                className="flex items-center text-sm font-medium text-palette-textLight hover:text-palette-pink transition-colors p-2"
              >
                View Profile <ChevronRight className="ml-auto h-4 w-4" />
              </Link>
              <Link 
                href="/settings"
                className="flex items-center text-sm font-medium text-palette-textLight hover:text-palette-pink transition-colors p-2"
              >
                Settings <ChevronRight className="ml-auto h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-palette-darkPurpleLight border-palette-purple">
            <CardHeader>
              <CardTitle className="text-palette-textLight flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-palette-orange" />
                Reading Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-palette-textLight/70">Books Read</span>
                <span className="font-bold text-palette-textLight">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-palette-textLight/70">Currently Reading</span>
                <span className="font-bold text-palette-textLight">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-palette-textLight/70">Want to Read</span>
                <span className="font-bold text-palette-textLight">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-palette-textLight/70">Reviews Written</span>
                <span className="font-bold text-palette-textLight">8</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="w-full bg-palette-darkPurpleLight text-palette-textLight">
              <TabsTrigger 
                value="current" 
                className="flex-1 data-[state=active]:bg-palette-purple data-[state=active]:text-palette-textLight"
              >
                Currently Reading
              </TabsTrigger>
              <TabsTrigger 
                value="recent" 
                className="flex-1 data-[state=active]:bg-palette-purple data-[state=active]:text-palette-textLight"
              >
                Recent Activity
              </TabsTrigger>
              <TabsTrigger 
                value="recommended" 
                className="flex-1 data-[state=active]:bg-palette-purple data-[state=active]:text-palette-textLight"
              >
                Recommended
              </TabsTrigger>
            </TabsList>
            <TabsContent value="current" className="space-y-4 mt-4">
              <Card className="bg-palette-darkPurpleLight border-palette-purple">
                <CardHeader className="pb-3">
                  <CardTitle className="text-palette-textLight flex items-center gap-2">
                    <Clock className="h-5 w-5 text-palette-yellow" />
                    Currently Reading
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-16 bg-palette-purple/50 rounded-md flex items-center justify-center text-palette-textLight">
                      Book
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-palette-textLight">The Great Gatsby</h3>
                      <p className="text-sm text-palette-textLight/70">F. Scott Fitzgerald</p>
                      <div className="w-full bg-palette-purple/30 h-2 rounded-full mt-2">
                        <div className="bg-palette-pink h-2 rounded-full w-[65%]"></div>
                      </div>
                      <p className="text-xs text-palette-textLight/70 mt-1">65% complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="recent" className="space-y-4 mt-4">
              <Card className="bg-palette-darkPurpleLight border-palette-purple">
                <CardHeader className="pb-3">
                  <CardTitle className="text-palette-textLight">Your Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-palette-textLight/70">Your recent activity will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="recommended" className="space-y-4 mt-4">
              <Card className="bg-palette-darkPurpleLight border-palette-purple">
                <CardHeader className="pb-3">
                  <CardTitle className="text-palette-textLight">Recommended for You</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-palette-textLight/70">Book recommendations based on your reading history will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="bg-palette-darkPurpleLight border-palette-purple">
            <CardHeader>
              <CardTitle className="text-palette-textLight flex items-center gap-2">
                <Users className="h-5 w-5 text-palette-teal" />
                Book Clubs
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="p-4 rounded-md bg-gradient-to-r from-palette-darkPurple to-palette-purple">
                <h3 className="font-medium text-palette-textLight">Science Fiction Enthusiasts</h3>
                <p className="text-sm text-palette-textLight/70">Currently reading: "Project Hail Mary" by Andy Weir</p>
                <p className="text-xs text-palette-textLight/70 mt-2">Next meeting: Friday, 7:00 PM</p>
                <Button className="mt-3 w-full bg-palette-teal text-palette-textDark hover:bg-palette-tealDark">
                  View Group
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-palette-purple/50 bg-palette-darkPurple">
        <div className="container py-6 text-center text-sm text-palette-textLight/70">
          <p>© 2023 BookTalk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
