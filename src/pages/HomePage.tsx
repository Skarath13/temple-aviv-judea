import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Calendar, MapPin, CalendarPlus, Baby, Users, BookHeart, Navigation as NavigationIcon, Clock, Video } from 'lucide-react';

export function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Improved */}
      <section className="relative w-full max-w-full h-screen overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img
            src="/heroimg.avif"
            alt="Temple Aviv Judea"
            className="w-full h-full object-cover object-top"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto text-center space-y-8">
              {/* Live Badge */}
              <div className="flex justify-center">
                <Badge variant="destructive" className="px-6 py-3 text-sm font-semibold rounded-full shadow-lg animate-pulse">
                  <div className="w-2.5 h-2.5 bg-white rounded-full mr-3 animate-ping absolute"></div>
                  <div className="w-2.5 h-2.5 bg-white rounded-full mr-3"></div>
                  <Video className="w-4 h-4 mr-2" />
                  LIVE NOW • Saturdays at 11:00 AM PST
                </Badge>
              </div>

              {/* Main Heading */}
              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-elegant font-bold text-primary tracking-tight leading-tight drop-shadow-lg">
                  Welcome to<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                    Temple Aviv Judea
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-foreground/90 max-w-3xl mx-auto leading-relaxed drop-shadow-md font-medium">
                  A vibrant Messianic Jewish congregation in Fullerton, CA — where faith, tradition, and community come together
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <a href="https://youtube.com/live/YwyfCisYfEI?feature=share" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="text-base px-8 py-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    Watch Live Stream
                  </Button>
                </a>

                <Button variant="outline" size="lg" className="text-base px-8 py-6 bg-white/95 hover:bg-white hover:scale-105 transition-all shadow-lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  View Schedule
                </Button>
              </div>

              {/* Info Badge */}
              <div className="pt-6">
                <div className="inline-flex items-center space-x-4 bg-white/95 border rounded-full px-8 py-4 shadow-xl backdrop-blur-sm">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">Fullerton, California</span>
                  </div>
                  <div className="h-4 w-px bg-border"></div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">Every Saturday 11 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Times Section - New */}
      <section className="py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 shadow-xl">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg">Shabbat Service</h3>
                  <p className="text-2xl font-bold text-primary">11:00 AM</p>
                  <p className="text-sm text-muted-foreground">Worship & Teaching</p>
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-jewish-gold/10 text-jewish-gold mb-2">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg">Oneg & Lunch</h3>
                  <p className="text-2xl font-bold text-jewish-gold">1:00 PM</p>
                  <p className="text-sm text-muted-foreground">Fellowship Meal</p>
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-600/10 text-purple-600 mb-2">
                    <BookHeart className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg">Rabbi's Corner</h3>
                  <p className="text-2xl font-bold text-purple-600">2:30 PM</p>
                  <p className="text-sm text-muted-foreground">Q&A Discussion</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Section - Redesigned */}
      <section className="py-20 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="mb-4">Our Community</Badge>
            <h2 className="text-4xl md:text-5xl font-elegant font-bold text-primary">
              Experience Faith Together
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the various ways our congregation comes together to worship, learn, and grow in faith
            </p>
          </div>

          {/* Cards Grid - Improved */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Shabbat Services Card */}
            <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative h-56 overflow-hidden">
                <img
                  src="/assets/images/rabbi-corey.jpg"
                  alt="Rabbi Corey"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-xl mb-1">Shabbat Services</h3>
                  <p className="text-white/90 text-sm">Led by Rabbi Corey</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-muted-foreground text-sm">
                  Join us every Saturday for inspiring worship, Torah teaching, and spiritual growth
                </p>
                <Button className="w-full group-hover:bg-primary group-hover:scale-105 transition-all">
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Add to Calendar
                </Button>
              </div>
            </Card>

            {/* Children's Ministry Card */}
            <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative h-56 overflow-hidden">
                <img
                  src="/assets/images/shabbat-school.jpg"
                  alt="Children's Ministry"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-purple-900/40 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-xl mb-1">Children's Ministry</h3>
                  <p className="text-white/90 text-sm">Ages 3-17</p>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Baby className="w-4 h-4 text-purple-600" />
                    <span>Nursery & Children's Program</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>Teen & Young Adult Groups</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <BookHeart className="w-4 h-4 text-purple-600" />
                    <span>Shabbat School Classes</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Our Building Card */}
            <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative h-56 overflow-hidden">
                <img
                  src="/assets/images/building-screenshot.png"
                  alt="Our Building"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/80 via-amber-900/40 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-xl mb-1">Our Miracle</h3>
                  <p className="text-white/90 text-sm">God's Provision</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-muted-foreground text-sm">
                  G-d blessed us with our own building in Fullerton
                </p>
                <div className="flex items-start space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">704 E Commonwealth Ave</p>
                    <p className="text-muted-foreground">Fullerton, CA 92831</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full group-hover:border-primary group-hover:text-primary">
                  <NavigationIcon className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
              </div>
            </Card>

            {/* Online Ministry Card */}
            <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-red-200 dark:border-red-900">
              <div className="relative h-56 overflow-hidden">
                <img
                  src="/assets/images/youtube-taj-pic.png"
                  alt="Online Ministry"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-red-900/80 via-red-900/40 to-transparent"></div>
                <Badge className="absolute top-4 left-4 bg-red-600 hover:bg-red-700 animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full mr-1.5"></div>
                  LIVE
                </Badge>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-xl mb-1">Online Ministry</h3>
                  <p className="text-white/90 text-sm">Watch from Anywhere</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center py-3">
                  <div>
                    <p className="text-2xl font-bold text-red-600">500+</p>
                    <p className="text-xs text-muted-foreground">Weekly Viewers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">Live</p>
                    <p className="text-xs text-muted-foreground">Every Saturday</p>
                  </div>
                </div>
                <a href="https://youtube.com/live/YwyfCisYfEI?feature=share" target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full bg-red-600 hover:bg-red-700 group-hover:scale-105 transition-all shadow-lg">
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Watch Live
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section - New */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto p-12 text-center shadow-2xl bg-gradient-to-br from-card to-card/50">
            <h2 className="text-3xl md:text-4xl font-elegant font-bold text-primary mb-4">
              You're Always Welcome Here
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Whether you're Jewish, non-Jewish, or simply curious, we invite you to experience the joy of Messianic worship
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8">
                Plan Your Visit
              </Button>
              <Button size="lg" variant="outline" className="px-8">
                Contact Us
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
