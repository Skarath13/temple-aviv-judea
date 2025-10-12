import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Mail, Calendar, BookOpen, Heart, Users, Building2, Sparkles } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/assets/images/jerusalem-bg-hq.jpg')] bg-cover bg-center opacity-[0.03]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background"></div>

        <div className="relative z-10 container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="outline" className="mb-4 px-6 py-2 text-sm">
              <BookOpen className="w-4 h-4 mr-2" />
              Our Story
            </Badge>

            <h1 className="text-5xl md:text-6xl font-elegant font-bold text-primary tracking-tight leading-tight">
              Our History
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              The story of faith, fellowship, and G-d's faithfulness through the years
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* The Beginning - 1974 */}
            <Card className="mb-8 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="grid md:grid-cols-[200px_1fr] gap-6">
                <div className="bg-gradient-to-br from-primary to-primary/80 p-6 flex flex-col items-center justify-center text-primary-foreground">
                  <div className="text-5xl font-bold font-elegant">1974</div>
                  <div className="text-sm mt-2 font-medium">The Beginning</div>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="w-5 h-5 text-jewish-gold" />
                    <h3 className="text-2xl font-bold text-primary font-elegant">A Divine Meeting</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Mike Davis and I met in Fullerton, California. A Jewish Believer shared the Good News to each of
                    us separately. In time, when we both believed, he brought us together. Mike's parents and his 83-year old
                    grandmother became believers shortly after. Two doors down on Flatbush Avenue in Norwalk, California,
                    lived a non-Jewish family that loved the L-rd. They gently discipled Mike's parents and grandmother by
                    having informal Bible studies on Friday evenings.
                  </p>
                </div>
              </div>
            </Card>

            {/* Starting the Congregation - 1977 */}
            <Card className="mb-8 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="grid md:grid-cols-[200px_1fr] gap-6">
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 flex flex-col items-center justify-center text-white">
                  <div className="text-5xl font-bold font-elegant">1977</div>
                  <div className="text-sm mt-2 font-medium">A Calling</div>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h3 className="text-2xl font-bold text-primary font-elegant">First Services</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    In 1977, Mike suggested that we start a Messianic congregation. We were young and inexperienced, but we
                    had a calling. We began holding services in Mike's parents' home in Norwalk. As the congregation grew, we
                    moved to a community center, then to various rented facilities.
                  </p>
                </div>
              </div>
            </Card>

            {/* Building Purchase - 1995 */}
            <Card className="mb-8 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="grid md:grid-cols-[200px_1fr] gap-6">
                <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-6 flex flex-col items-center justify-center text-white">
                  <div className="text-5xl font-bold font-elegant">1995</div>
                  <div className="text-sm mt-2 font-medium">A Miracle</div>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    <h3 className="text-2xl font-bold text-primary font-elegant">Our Permanent Home</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Through the years, G-d has been faithful to provide for our needs. In 1995, we were blessed to purchase
                    our current building in Fullerton. This has allowed us to establish roots in the community and continue
                    growing in our faith together.
                  </p>
                </div>
              </div>
            </Card>

            {/* Our Mission */}
            <Card className="mb-8 overflow-hidden bg-gradient-to-br from-card to-accent/5 border-2 border-primary/20 shadow-xl">
              <div className="p-8 space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Heart className="w-6 h-6 text-red-600" />
                  <h3 className="text-3xl font-bold text-primary font-elegant">Our Mission & Values</h3>
                </div>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  Temple Aviv Judea has always been committed to sharing the Good News with both Jewish and non-Jewish
                  people, while maintaining our Jewish identity and traditions. We celebrate the biblical feasts, observe
                  Shabbat, and study Torah, all while recognizing Yeshua (Jesus) as our Messiah.
                </p>

                <div className="grid md:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <Calendar className="w-8 h-8 text-primary mb-2" />
                    <h4 className="font-semibold mb-1">Biblical Feasts</h4>
                    <p className="text-sm text-muted-foreground">Celebrating G-d's appointed times</p>
                  </div>
                  <div className="p-4 bg-purple-600/5 rounded-lg border border-purple-600/10">
                    <BookOpen className="w-8 h-8 text-purple-600 mb-2" />
                    <h4 className="font-semibold mb-1">Torah Study</h4>
                    <p className="text-sm text-muted-foreground">Growing in knowledge and wisdom</p>
                  </div>
                  <div className="p-4 bg-amber-600/5 rounded-lg border border-amber-600/10">
                    <Users className="w-8 h-8 text-amber-600 mb-2" />
                    <h4 className="font-semibold mb-1">Community</h4>
                    <p className="text-sm text-muted-foreground">Jewish & non-Jewish believers united</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Today */}
            <Card className="overflow-hidden shadow-xl">
              <div className="p-8 bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="space-y-4">
                  <Badge variant="default" className="mb-2">Today</Badge>
                  <h3 className="text-3xl font-bold text-primary font-elegant">Looking Forward</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Today, our congregation continues to be a place where Jewish and non-Jewish believers can come together to
                    worship, learn, and grow in their faith. We are grateful for G-d's faithfulness throughout our history and
                    look forward to what He has in store for our future.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto p-12 text-center shadow-2xl bg-gradient-to-br from-card to-card/50">
            <h3 className="text-3xl md:text-4xl font-elegant font-bold text-primary mb-4">
              Join Us This Shabbat
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the warmth of our congregation and the richness of Messianic Jewish worship
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://youtube.com/live/YwyfCisYfEI?feature=share" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="px-8 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Watch Live Stream
                </Button>
              </a>
              <Button size="lg" variant="outline" className="px-8 hover:scale-105 transition-all">
                <Mail className="w-5 h-5 mr-2" />
                Contact Us
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
