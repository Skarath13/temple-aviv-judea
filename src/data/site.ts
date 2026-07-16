export const site = {
  name: 'Temple Aviv Judea',
  shortName: 'TAJ',
  description: 'A Messianic Jewish congregation in Fullerton, California.',
  address: {
    street: '704 E Commonwealth Ave',
    city: 'Fullerton, CA 92831',
    mailing: 'P.O. Box 7331, Fullerton, CA 92834',
    maps: 'https://www.google.com/maps/place/704+E+Commonwealth+Ave,+Fullerton,+CA+92831/@33.87013,-117.912405,15z',
    embed: 'https://www.google.com/maps?q=704+E+Commonwealth+Ave,+Fullerton,+CA+92831&output=embed',
  },
  phone: '(714) 748-4504',
  phoneHref: 'tel:+17147484504',
  email: 'info@avivjudea.org',
  youtube: 'https://www.youtube.com/@templeavivjudea1558/streams',
  facebook: 'https://www.facebook.com/templeavivjudea/',
  baruchDesignsEtsy: 'https://www.etsy.com/shop/BaruchDesignsStudio?etsrc=sdt#items',
  giving: 'https://www.paypal.com/donate/?business=avivjudea613%40gmail.com&no_recurring=0&item_name=Temple%20Aviv%20Judea&currency_code=USD',
  schedule: [
    { time: '11:00 AM', label: 'Shabbat Service', note: 'In person & livestream' },
    { time: '1:00 PM', label: 'Oneg / Lunch', note: 'Stay and share a meal' },
    { time: '2:30 PM', label: "Rabbi's Corner", note: 'Torah conversation & questions' },
  ],
} as const;

export const navItems = [
  { href: '/', label: 'Home' },
  { href: '/visit/', label: 'Visit' },
  { href: '/story/', label: 'Our Story' },
  { href: '/beliefs/', label: 'Beliefs' },
  { href: '/ministries/', label: 'Ministries' },
] as const;
