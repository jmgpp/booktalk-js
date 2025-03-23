"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Users,
  BookMarked,
  BarChart3,
  BookText,
  Clock,
  Award,
  ChevronRight,
  Search,
  Bell,
  Menu,
  MoreHorizontal,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useMediaQuery } from "@/hooks/use-media-query"

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <div className="min-h-screen bg-palette-darkPurple text-palette-textLight">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-palette-purple/50 bg-palette-darkPurple/95 backdrop-blur supports-[backdrop-filter]:bg-palette-darkPurple/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-palette-pink" />
            <span className="text-xl font-bold text-palette-textLight">BookTalk</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <Link
                href="#"
                className="text-sm font-medium text-palette-textLight hover:text-palette-pink transition-colors"
              >
                Home
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
              <Avatar className="border-2 border-palette-pink">
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                <AvatarFallback className="bg-palette-purple text-palette-textLight">JD</AvatarFallback>
              </Avatar>
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
          <div className="container py-4 md:hidden bg-palette-darkPurple">
            <nav className="flex flex-col gap-4">
              <Link
                href="#"
                className="text-sm font-medium text-palette-textLight hover:text-palette-pink transition-colors"
              >
                Home
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
            <div className="flex items-center gap-4 mt-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-palette-textLight hover:bg-palette-purple/30 rounded-xl"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-palette-textLight hover:bg-palette-purple/30 rounded-xl"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="container py-6 md:py-10">
        <div className="flex flex-col gap-6">
          {/* Welcome section */}
          <section className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-palette-orange p-6 rounded-3xl shadow-lg">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 border-4 border-palette-yellow shadow-md">
              <AvatarImage src="/placeholder.svg?height=80&width=80" alt="User" />
              <AvatarFallback className="bg-palette-purple text-palette-textLight">JD</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-palette-textDark">Welcome back, Jane!</h1>
              <p className="text-palette-darkPurple">
                You have 2 books in progress and 3 upcoming book club meetings this week.
              </p>
            </div>
          </section>

          {/* Currently Reading */}
          <section className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-palette-textLight">
                <BookOpen className="h-5 w-5 text-palette-pink" />
                Currently Reading
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-palette-textLight hover:text-palette-pink hover:bg-palette-purple/30 rounded-xl"
              >
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CurrentlyReadingCard
                title="The Midnight Library"
                author="Matt Haig"
                coverUrl="/placeholder.svg?height=240&width=160"
                progress={65}
                lastRead="Today"
                color="#48C2F7" // Blue
                bgColor="#413960" // Purple
              />
              <CurrentlyReadingCard
                title="Project Hail Mary"
                author="Andy Weir"
                coverUrl="/placeholder.svg?height=240&width=160"
                progress={32}
                lastRead="Yesterday"
                color="#ED4B86" // Pink
                bgColor="#413960" // Purple
              />
            </div>
          </section>

          {/* Library Shelves */}
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-palette-textLight">
                <BookMarked className="h-5 w-5 text-palette-yellow" />
                My Library Shelves
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-palette-textLight hover:text-palette-yellow hover:bg-palette-purple/30 rounded-xl"
              >
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ShelfCard
                title="Want to Read"
                count={24}
                icon={<BookText className="h-5 w-5" />}
                color="#FCB62D"
                bgColor="#413960"
              />{" "}
              {/* Yellow */}
              <ShelfCard
                title="Currently Reading"
                count={2}
                icon={<BookOpen className="h-5 w-5" />}
                color="#8FD0C3"
                bgColor="#413960"
              />{" "}
              {/* Teal */}
              <ShelfCard
                title="Read"
                count={87}
                icon={<BookMarked className="h-5 w-5" />}
                color="#48C2F7"
                bgColor="#413960"
              />{" "}
              {/* Blue */}
              <ShelfCard
                title="Favorites"
                count={16}
                icon={<Award className="h-5 w-5" />}
                color="#ED4B86"
                bgColor="#413960"
              />{" "}
              {/* Pink */}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Book Groups */}
            <section className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-palette-textLight">
                  <Users className="h-5 w-5 text-palette-teal" />
                  My Book Groups
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-palette-textLight hover:text-palette-teal hover:bg-palette-purple/30 rounded-lg"
                >
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GroupCard
                  name="Science Fiction Lovers"
                  members={42}
                  currentBook="Dune"
                  nextMeeting="Tomorrow, 7 PM"
                  color="#48C2F7" // Blue
                  bgColor="#413960" // Purple
                />
                <GroupCard
                  name="Mystery Book Club"
                  members={28}
                  currentBook="The Silent Patient"
                  nextMeeting="Friday, 6 PM"
                  color="#ED4B86" // Pink
                  bgColor="#413960" // Purple
                />
                <GroupCard
                  name="Classic Literature"
                  members={35}
                  currentBook="Pride and Prejudice"
                  nextMeeting="Next Monday, 8 PM"
                  color="#8FD0C3" // Teal
                  bgColor="#413960" // Purple
                />
                <GroupCard
                  name="Fantasy Readers"
                  members={56}
                  currentBook="The Name of the Wind"
                  nextMeeting="Saturday, 5 PM"
                  color="#FCB62D" // Yellow
                  bgColor="#413960" // Purple
                />
              </div>
            </section>

            {/* Friends Activity */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-palette-textLight">
                  <Users className="h-5 w-5 text-palette-orange" />
                  Friends Activity
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-palette-textLight hover:text-palette-orange hover:bg-palette-purple/30 rounded-lg"
                >
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Card className="bg-palette-purple border-none rounded-3xl shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-palette-textLight flex justify-between items-center">
                    Recent Updates
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-palette-textLight hover:bg-palette-darkPurpleLight/30"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FriendActivity
                    name="Alex Chen"
                    avatar="/placeholder.svg?height=40&width=40"
                    action="started reading"
                    book="The Alchemist"
                    time="2h ago"
                    color="#8FD0C3" // Teal
                  />
                  <FriendActivity
                    name="Sarah Johnson"
                    avatar="/placeholder.svg?height=40&width=40"
                    action="finished"
                    book="Atomic Habits"
                    time="Yesterday"
                    color="#48C2F7" // Blue
                  />
                  <FriendActivity
                    name="Mike Peters"
                    avatar="/placeholder.svg?height=40&width=40"
                    action="rated 5 stars"
                    book="Project Hail Mary"
                    time="2d ago"
                    color="#FCB62D" // Yellow
                  />
                  <FriendActivity
                    name="Emma Wilson"
                    avatar="/placeholder.svg?height=40&width=40"
                    action="joined group"
                    book="Fantasy Readers"
                    time="3d ago"
                    color="#ED4B86" // Pink
                  />
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-palette-orange hover:bg-palette-orangeDark text-palette-textDark font-medium rounded-xl">
                    Find Friends
                  </Button>
                </CardFooter>
              </Card>
            </section>
          </div>

          {/* Reading Stats */}
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-palette-textLight">
                <BarChart3 className="h-5 w-5 text-palette-blue" />
                Reading Stats
              </h2>
            </div>
            <Card className="bg-palette-orange border-none rounded-3xl p-4 shadow-lg">
              <Tabs defaultValue="year" className="w-full">
                <TabsList className="mb-4 bg-palette-darkPurple/20 rounded-xl">
                  <TabsTrigger
                    value="month"
                    className="rounded-lg data-[state=active]:bg-palette-darkPurple data-[state=active]:text-palette-textLight text-palette-textDark"
                  >
                    This Month
                  </TabsTrigger>
                  <TabsTrigger
                    value="year"
                    className="rounded-lg data-[state=active]:bg-palette-darkPurple data-[state=active]:text-palette-textLight text-palette-textDark"
                  >
                    This Year
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="rounded-lg data-[state=active]:bg-palette-darkPurple data-[state=active]:text-palette-textLight text-palette-textDark"
                  >
                    All Time
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="month" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                      title="Books Read"
                      value="3"
                      icon={<BookMarked className="h-5 w-5" />}
                      color="#ED4B86"
                      bgColor="#413960"
                    />{" "}
                    {/* Pink */}
                    <StatCard
                      title="Pages Read"
                      value="876"
                      icon={<BookText className="h-5 w-5" />}
                      color="#8FD0C3"
                      bgColor="#413960"
                    />{" "}
                    {/* Teal */}
                    <StatCard
                      title="Reading Time"
                      value="32h"
                      icon={<Clock className="h-5 w-5" />}
                      color="#FCB62D"
                      bgColor="#413960"
                    />{" "}
                    {/* Yellow */}
                  </div>
                  <Card className="bg-palette-purple border-none rounded-2xl shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-palette-textLight text-lg">Reading Goal Progress</CardTitle>
                      <CardDescription className="text-palette-textLight/70">
                        5 of 8 books read this month
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-palette-textLight bg-palette-darkPurple/50">
                              Progress
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-palette-textLight">62.5%</span>
                          </div>
                        </div>
                        <div className="flex h-2 mb-4 overflow-hidden rounded-xl bg-palette-darkPurple/50">
                          <div style={{ width: "62.5%" }} className="bg-palette-blue"></div>
                        </div>
                        <div className="flex justify-between">
                          {[0, 25, 50, 75, 100].map((percent, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <div
                                className={`w-3 h-3 rounded-full ${percent <= 62.5 ? "bg-palette-blue" : "bg-palette-darkPurple/50"}`}
                              ></div>
                              <span className="text-xs text-palette-textLight/70 mt-1">{percent}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-palette-textLight/70 mt-4">
                        You're on track to reach your monthly goal!
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="year" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                      title="Books Read"
                      value="24"
                      icon={<BookMarked className="h-5 w-5" />}
                      color="#ED4B86"
                      bgColor="#413960"
                    />{" "}
                    {/* Pink */}
                    <StatCard
                      title="Pages Read"
                      value="7,842"
                      icon={<BookText className="h-5 w-5" />}
                      color="#8FD0C3"
                      bgColor="#413960"
                    />{" "}
                    {/* Teal */}
                    <StatCard
                      title="Reading Time"
                      value="287h"
                      icon={<Clock className="h-5 w-5" />}
                      color="#FCB62D"
                      bgColor="#413960"
                    />{" "}
                    {/* Yellow */}
                  </div>
                  <Card className="bg-palette-purple border-none rounded-2xl shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-palette-textLight text-lg">Reading Goal Progress</CardTitle>
                      <CardDescription className="text-palette-textLight/70">
                        24 of 50 books read this year
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-palette-textLight bg-palette-darkPurple/50">
                              Progress
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-palette-textLight">48%</span>
                          </div>
                        </div>
                        <div className="flex h-2 mb-4 overflow-hidden rounded-xl bg-palette-darkPurple/50">
                          <div style={{ width: "48%" }} className="bg-palette-blue"></div>
                        </div>
                        <div className="flex justify-between">
                          {[0, 25, 50, 75, 100].map((percent, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <div
                                className={`w-3 h-3 rounded-full ${percent <= 48 ? "bg-palette-blue" : "bg-palette-darkPurple/50"}`}
                              ></div>
                              <span className="text-xs text-palette-textLight/70 mt-1">{percent}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-palette-textLight/70 mt-4">
                        You're on track to reach your yearly goal!
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="all" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                      title="Books Read"
                      value="87"
                      icon={<BookMarked className="h-5 w-5" />}
                      color="#ED4B86"
                      bgColor="#413960"
                    />{" "}
                    {/* Pink */}
                    <StatCard
                      title="Pages Read"
                      value="28,651"
                      icon={<BookText className="h-5 w-5" />}
                      color="#8FD0C3"
                      bgColor="#413960"
                    />{" "}
                    {/* Teal */}
                    <StatCard
                      title="Reading Time"
                      value="1,245h"
                      icon={<Clock className="h-5 w-5" />}
                      color="#FCB62D"
                      bgColor="#413960"
                    />{" "}
                    {/* Yellow */}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}

// Component for currently reading books
function CurrentlyReadingCard({ title, author, coverUrl, progress, lastRead, color, bgColor }) {
  return (
    <Card className={`bg-[${bgColor}] rounded-3xl overflow-hidden shadow-lg border-none`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative h-[140px] w-[90px] flex-shrink-0 overflow-hidden rounded-xl shadow-md">
            <Image src={coverUrl || "/placeholder.svg"} alt={title} fill className="object-cover" />
          </div>
          <div className="flex flex-col justify-between text-palette-textLight">
            <div>
              <h3 className="font-semibold line-clamp-2">{title}</h3>
              <p className="text-sm text-palette-textLight/70">{author}</p>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{progress}% complete</span>
                  <span className="font-medium">Page 156/240</span>
                </div>
                <div className="relative pt-1">
                  <div className="flex h-2 mb-1 overflow-hidden rounded bg-palette-darkPurple/50">
                    <div style={{ width: `${progress}%` }} className={`bg-[${color}]`}></div>
                  </div>
                  <div className="flex justify-between">
                    {[0, 25, 50, 75, 100].map((percent, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div
                          className={`w-2 h-2 rounded-full ${percent <= progress ? `bg-[${color}]` : "bg-palette-darkPurple/50"}`}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-palette-textLight/80 font-medium">Last read: {lastRead}</p>
              <Button
                size="sm"
                className={`w-full mt-1 bg-[${color}] hover:bg-[${color}]/90 text-palette-textDark rounded-xl`}
              >
                Continue Reading
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Component for library shelves
function ShelfCard({ title, count, icon, color, bgColor }) {
  return (
    <Card
      className={`bg-[${bgColor}] rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group border-none`}
    >
      <CardContent className="p-6 flex flex-col items-center text-center">
        <div
          className={`h-12 w-12 rounded-full bg-palette-darkPurple/50 flex items-center justify-center mb-4 group-hover:bg-palette-darkPurple/70 transition-colors`}
        >
          <div className={`text-[${color}]`}>{icon}</div>
        </div>
        <h3 className="font-semibold text-palette-textLight">{title}</h3>
        <p className={`text-3xl font-bold mt-2 text-[${color}]`}>{count}</p>
        <p className="text-sm text-palette-textLight/80 font-medium">books</p>
      </CardContent>
    </Card>
  )
}

// Component for book groups
function GroupCard({ name, members, currentBook, nextMeeting, color, bgColor }) {
  return (
    <Card className={`bg-[${bgColor}] border-none rounded-3xl shadow-lg`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-lg text-palette-textLight flex items-center gap-2`}>
          <div className={`w-3 h-3 rounded-full bg-[${color}]`}></div>
          {name}
        </CardTitle>
        <CardDescription className="text-palette-textLight/70">{members} members</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-palette-textLight">
        <div>
          <p className="text-sm font-medium">Currently Reading:</p>
          <p className="text-sm text-palette-textLight/70">{currentBook}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Next Meeting:</p>
          <p className="text-sm text-palette-textLight/70">{nextMeeting}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button className={`w-full bg-[${color}] hover:bg-[${color}]/90 text-palette-textDark font-medium rounded-xl`}>
          View Group
        </Button>
      </CardFooter>
    </Card>
  )
}

// Component for friend activity
function FriendActivity({ name, avatar, action, book, time, color }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar className={`h-8 w-8 border-2 border-[${color}]`}>
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className={`bg-[${color}]/20 text-palette-textLight`}>{name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <p className="text-sm text-palette-textLight">
          <span className="font-medium">{name}</span> {action}{" "}
          <span className={`font-medium text-[${color}]`}>{book}</span>
        </p>
        <p className="text-xs text-palette-textLight/70">{time}</p>
      </div>
    </div>
  )
}

// Component for stats cards
function StatCard({ title, value, icon, color, bgColor }) {
  return (
    <Card
      className={`bg-[${bgColor}] border-none rounded-2xl group hover:bg-palette-darkPurpleLight transition-colors shadow-md`}
    >
      <CardContent className="p-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-palette-textLight/80 font-medium">{title}</p>
          <p className={`text-3xl font-bold text-[${color}]`}>{value}</p>
        </div>
        <div
          className={`h-12 w-12 rounded-full bg-palette-darkPurple/50 flex items-center justify-center group-hover:bg-palette-darkPurple/70 transition-colors`}
        >
          <div className={`text-[${color}]`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

