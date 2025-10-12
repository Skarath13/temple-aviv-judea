import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Video } from 'lucide-react';

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top section with logo, contact info, and live/donate */}
        <div className="flex justify-between items-center py-5 border-b border-border/50">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="relative">
              <img
                src="/assets/images/logo-hq.png"
                alt="Temple Aviv Judea"
                className="h-16 w-16 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary font-elegant tracking-tight group-hover:text-primary/90 transition-colors">
                Temple Aviv Judea
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Messianic Jewish Congregation</p>
            </div>
          </Link>

          {/* Contact Info */}
          <div className="hidden lg:block">
            <div className="flex items-start space-x-6">
              <div className="flex items-start space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">704 E Commonwealth Ave</p>
                  <p className="text-muted-foreground">Fullerton, CA 92831</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 text-sm">
                <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">Contact Us</p>
                  <p className="text-muted-foreground">Saturdays @ 11 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            {/* Live Indicator */}
            <a
              href="https://youtube.com/live/YwyfCisYfEI?feature=share"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-red-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center shadow-lg hover:shadow-xl hover:bg-red-700 transition-all duration-300 hover:scale-105"
            >
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></div>
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              <Video className="w-4 h-4 mr-2" />
              <span>WATCH LIVE</span>
            </a>

            {/* Donate Button */}
            <Button className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-jewish-gold text-black hover:bg-amber-400 font-semibold px-6 py-2.5">
              <img src="/assets/images/paypal-donate-hq.gif" alt="Donate" className="h-4 mr-2" />
              <span>Donate</span>
            </Button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex justify-center space-x-2 py-4">
          <Link to="/">
            <Button
              variant={isActive('/') ? 'default' : 'ghost'}
              className={`font-semibold text-sm px-6 transition-all duration-300 ${
                isActive('/')
                  ? 'shadow-md'
                  : 'hover:bg-accent hover:scale-105'
              }`}
            >
              HOME
            </Button>
          </Link>
          <Link to="/about">
            <Button
              variant={isActive('/about') ? 'default' : 'ghost'}
              className={`font-semibold text-sm px-6 transition-all duration-300 ${
                isActive('/about')
                  ? 'shadow-md'
                  : 'hover:bg-accent hover:scale-105'
              }`}
            >
              ABOUT
            </Button>
          </Link>
          <Link to="/give">
            <Button
              variant={isActive('/give') ? 'default' : 'ghost'}
              className={`font-semibold text-sm px-6 transition-all duration-300 ${
                isActive('/give')
                  ? 'shadow-md'
                  : 'hover:bg-accent hover:scale-105'
              }`}
            >
              GIVE
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
