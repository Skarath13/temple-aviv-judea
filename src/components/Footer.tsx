import { MapPin, Phone, Mail, Navigation, Info, Calendar, User, Users, CalendarDays, Heart, Video, Facebook, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('/assets/images/jerusalem-bg-hq.jpg')] bg-cover bg-center"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-foreground/10 rounded-xl ring-2 ring-jewish-gold/30">
                  <img src="/assets/images/logo-hq.png" alt="Temple Aviv Judea" className="h-10 w-10 rounded-full" />
                </div>
                <div>
                  <h3 className="text-2xl font-elegant font-bold tracking-tight">Temple Aviv Judea</h3>
                  <p className="text-xs text-primary-foreground/70 font-medium">Messianic Jewish Congregation</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href="https://maps.google.com/?q=704+E+Commonwealth+Ave+Fullerton+CA+92831"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start space-x-3 p-4 bg-primary-foreground/5 hover:bg-primary-foreground/10 rounded-xl border border-primary-foreground/10 hover:border-jewish-gold/30 transition-all duration-300"
              >
                <MapPin className="w-5 h-5 mt-0.5 text-jewish-gold flex-shrink-0" />
                <div className="text-sm flex-1">
                  <div className="font-semibold text-primary-foreground">704 E Commonwealth Ave</div>
                  <div className="text-primary-foreground/70">Fullerton, CA 92831</div>
                </div>
                <ExternalLink className="w-3 h-3 text-primary-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              <a
                href="tel:7147484504"
                className="group flex items-center space-x-3 p-4 bg-primary-foreground/5 hover:bg-primary-foreground/10 rounded-xl border border-primary-foreground/10 hover:border-jewish-gold/30 transition-all duration-300"
              >
                <Phone className="w-5 h-5 text-jewish-gold" />
                <span className="text-sm font-medium">(714) 748-4504</span>
              </a>

              <a
                href="mailto:info@avivjudea.org"
                className="group flex items-center space-x-3 p-4 bg-primary-foreground/5 hover:bg-primary-foreground/10 rounded-xl border border-primary-foreground/10 hover:border-jewish-gold/30 transition-all duration-300"
              >
                <Mail className="w-5 h-5 text-jewish-gold" />
                <span className="text-sm font-medium">info@avivjudea.org</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-jewish-gold flex items-center">
              <Navigation className="w-5 h-5 mr-2" />
              Quick Links
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <Link
                to="/about"
                className="flex items-center justify-between space-x-2 px-4 py-3 rounded-lg hover:bg-primary-foreground/10 border border-transparent hover:border-primary-foreground/10 transition-all duration-300 group"
              >
                <div className="flex items-center space-x-3">
                  <Info className="w-4 h-4 text-jewish-gold" />
                  <span className="text-sm font-medium group-hover:text-jewish-gold transition-colors">About Us</span>
                </div>
                <ExternalLink className="w-3 h-3 text-primary-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <a
                href="#services"
                className="flex items-center justify-between space-x-2 px-4 py-3 rounded-lg hover:bg-primary-foreground/10 border border-transparent hover:border-primary-foreground/10 transition-all duration-300 group"
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-jewish-gold" />
                  <span className="text-sm font-medium group-hover:text-jewish-gold transition-colors">Shabbat Services</span>
                </div>
                <ExternalLink className="w-3 h-3 text-primary-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              <a
                href="#rabbi"
                className="flex items-center justify-between space-x-2 px-4 py-3 rounded-lg hover:bg-primary-foreground/10 border border-transparent hover:border-primary-foreground/10 transition-all duration-300 group"
              >
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-jewish-gold" />
                  <span className="text-sm font-medium group-hover:text-jewish-gold transition-colors">Our Rabbi</span>
                </div>
                <ExternalLink className="w-3 h-3 text-primary-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              <a
                href="#ministries"
                className="flex items-center justify-between space-x-2 px-4 py-3 rounded-lg hover:bg-primary-foreground/10 border border-transparent hover:border-primary-foreground/10 transition-all duration-300 group"
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-jewish-gold" />
                  <span className="text-sm font-medium group-hover:text-jewish-gold transition-colors">Ministries</span>
                </div>
                <ExternalLink className="w-3 h-3 text-primary-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              <a
                href="#events"
                className="flex items-center justify-between space-x-2 px-4 py-3 rounded-lg hover:bg-primary-foreground/10 border border-transparent hover:border-primary-foreground/10 transition-all duration-300 group"
              >
                <div className="flex items-center space-x-3">
                  <CalendarDays className="w-4 h-4 text-jewish-gold" />
                  <span className="text-sm font-medium group-hover:text-jewish-gold transition-colors">Events</span>
                </div>
                <ExternalLink className="w-3 h-3 text-primary-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

          {/* Connect */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-jewish-gold flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              Connect With Us
            </h4>
            <div className="space-y-4">
              <div className="p-4 bg-primary-foreground/5 rounded-xl border border-primary-foreground/10">
                <div className="text-sm font-semibold text-jewish-gold mb-2">Mailing Address</div>
                <div className="text-sm text-primary-foreground/80 leading-relaxed">P.O. Box 7331<br />Fullerton, CA 92834</div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-jewish-gold">Follow Our Services</div>
                <div className="grid grid-cols-1 gap-2">
                  <a
                    href="https://youtube.com/live/YwyfCisYfEI?feature=share"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-2">
                      <Video className="w-5 h-5" />
                      <span className="text-sm font-semibold">Watch on YouTube</span>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>

                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-2">
                      <Facebook className="w-5 h-5" />
                      <span className="text-sm font-semibold">Follow on Facebook</span>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-center md:text-left">
            <p className="text-sm text-primary-foreground/70">
              &copy; 2025 Temple Aviv Judea. All rights reserved.
            </p>
            <div className="flex items-center space-x-2 text-sm text-primary-foreground/60">
              <span>Built with</span>
              <Heart className="w-4 h-4 text-red-400 fill-red-400 animate-pulse" />
              <span>and</span>
              <a
                href="https://ui.shadcn.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-jewish-gold hover:text-jewish-gold/80 font-semibold transition-colors"
              >
                shadcn/ui
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
