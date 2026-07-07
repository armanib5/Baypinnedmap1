/* Place + pin data for the BayPinned / Pinned SJ interactive map.
   Coordinates are real-world lat/lng (WGS84) for San Jose, CA — this
   replaces the old hand-drawn SVG's fictional 0-1100/0-720 mx/my grid.
   Coordinates for named downtown landmarks (Plaza de Cesar Chavez,
   Diridon Station, San Pedro Square Market, SoFA Market, MLK Library,
   Circle of Palms) were cross-checked against public map listings.
   Neighborhood sample pins (Japantown/Santana Row/Willow Glen/Alum
   Rock/East San Jose) are placeholder locations for that area, not
   confirmed single-business addresses — swap in real data before launch. */

var CATS = {
  market:    { l: "Markets",         c: "#3d6b42", icon: "leaf" },
  foodhall:  { l: "Food & Drinks",   c: "#b8860b", icon: "fork" },
  bars:      { l: "Bars & Restaurants", c: "#6b1e3c", icon: "cup" },
  artwalk:   { l: "Arts",            c: "#2c5f8a", icon: "palette" },
  cityart:   { l: "Community Art",   c: "#6a4e7a", icon: "art" },
  venue:     { l: "Theaters",        c: "#7a5230", icon: "mask" },
  holiday:   { l: "Holiday",         c: "#8B0000", icon: "star" },
  shop:      { l: "Shops",           c: "#c0392b", icon: "bag" },
  parking:   { l: "Parking",         c: "#2c5f8a", icon: "P" },
  restrooms: { l: "Restrooms",       c: "#64748b", icon: "restroom" },
  transit:   { l: "Transit",         c: "#1f8a4c", icon: "train" },
  schools:   { l: "Schools",         c: "#0ea5e9", icon: "school" },
  hospitals: { l: "Hospitals",       c: "#dc2626", icon: "hospital" },
  churches:  { l: "Churches",        c: "#7c3aed", icon: "church" }
};

/* Order controls the category filter row. */
var CAT_ORDER = ["market","foodhall","bars","artwalk","cityart","venue","holiday","shop","parking","restrooms","transit","schools","hospitals","churches"];

var HOODS = [
  { id: "downtown",  l: "Downtown San Jose",       lat: 37.3382, lng: -121.8863, zoom: 15 },
  { id: "japantown", l: "Japantown",                lat: 37.3497, lng: -121.8917, zoom: 16 },
  { id: "santana",   l: "Santana Row & Valley Fair", lat: 37.3199, lng: -121.9492, zoom: 15 },
  { id: "willow",    l: "Willow Glen",               lat: 37.3066, lng: -121.8897, zoom: 15 },
  { id: "alum",      l: "Alum Rock",                 lat: 37.3563, lng: -121.8248, zoom: 15 },
  { id: "east",      l: "East San Jose",             lat: 37.3444, lng: -121.8394, zoom: 14 }
];

var PLACES = [
  {
    id: "fm", cat: "market", hood: "downtown",
    t: "Downtown SJ Farmers Market", w: "Wednesdays 9:00am - 1:30pm", d: "wed",
    a: "Paseo de San Antonio (near 2nd St), San Jose, CA 95113",
    lat: 37.3356, lng: -121.8843,
    ds: "Over 20 local farms and vendors every Wednesday on Paseo de San Antonio.",
    pk: "ParkSJ garage 90 min free. Entrances on 2nd and 3rd Street.",
    tr: "VTA Light Rail Convention Center stop, 5 min walk.",
    wb: "https://downtownsanjosefarmersmarket.com"
  },
  {
    id: "sm", cat: "foodhall", hood: "downtown",
    t: "SoFA Market", w: "Open Daily 11am - 9pm", d: "daily",
    a: "387 S 1st St, San Jose, CA 95113",
    lat: 37.3302, lng: -121.8864,
    ds: "A permanent downtown food hall with multiple restaurants and a craft cocktail bar.",
    pk: "Street parking on 1st and 2nd. ParkSJ on 2nd Street.",
    tr: "VTA Route 65/68 on 1st Street.",
    wb: "https://sofamarketsj.com"
  },
  {
    id: "wc", cat: "holiday", hood: "downtown",
    t: "Soccer Celebration - World Cup Watch Party", w: "June 11 - July 19, all matches live", d: "today", ed: "2026-07-19",
    a: "San Pedro Square Market, 87 N San Pedro St, San Jose, CA 95110",
    lat: 37.3365, lng: -121.8943,
    ds: "Bay Area's largest free World Cup watch party on multiple jumbo screens.",
    pk: "San Pedro Street garage nearby.",
    tr: "VTA Route 522 on Santa Clara St.",
    wb: "https://sanpedrosquaremarket.com"
  },
  {
    id: "aw", cat: "artwalk", hood: "downtown",
    t: "South First Fridays ArtWalk", w: "First Friday Monthly, 5pm - 9pm", d: "monthly",
    a: "South 1st Street, SoFA District, San Jose, CA",
    lat: 37.3305, lng: -121.8867,
    ds: "Free self-guided evening art walk through downtown galleries, museums, and pop-up installations.",
    pk: "Street parking on S 1st/2nd/3rd. Free after 6pm in many garages.",
    tr: "VTA Route 65/68. Walk south from Convention Center light rail.",
    wb: "https://southfirstfridays.com"
  },
  {
    id: "gs", cat: "cityart", hood: "downtown",
    t: "Gaiascope at Circle of Palms", w: "May 22 - Aug 18, always open",
    a: "Circle of Palms Plaza, 127 S Market St, San Jose, CA 95113",
    lat: 37.3334, lng: -121.8896,
    ds: "Three suspended kaleidoscope sculptures by artist Brooke Einbender.",
    pk: "Market Street garage one block north.",
    tr: "VTA Convention Center stop, 2 min walk.",
    wb: "https://www.sanjoseca.gov"
  },
  {
    id: "ht", cat: "venue", hood: "downtown",
    t: "Hammer Theatre Center", w: "Box office hours vary",
    a: "101 Paseo de San Antonio, San Jose, CA 95113",
    lat: 37.3349, lng: -121.8857,
    ds: "Premier performing arts venue on Paseo de San Antonio, part of SJSU.",
    pk: "ParkSJ garages on 2nd and 3rd Street.",
    tr: "VTA light rail Convention Center stop, 5 min walk.",
    wb: "https://www.hammertheatre.com"
  },
  {
    id: "ct", cat: "venue", hood: "downtown",
    t: "California Theatre", w: "Box office hours vary",
    a: "345 S 1st St, San Jose, CA 95113",
    lat: 37.3311, lng: -121.8878,
    ds: "Restored 1927 Spanish Colonial Revival theater. Home to Opera San Jose and Symphony Silicon Valley.",
    pk: "Street parking on 1st and 2nd.",
    tr: "VTA Route 65/68 on 1st Street.",
    wb: "https://www.sanjosetheaters.org"
  },
  {
    id: "cp", cat: "venue", hood: "downtown",
    t: "Center for the Performing Arts", w: "Box office hours vary",
    a: "255 Almaden Blvd, San Jose, CA 95113",
    lat: 37.3300, lng: -121.8912,
    ds: "Major performing arts center hosting Broadway shows, concerts, and dance.",
    pk: "Adjacent garages. Convention Center garage nearby.",
    tr: "VTA Convention Center light rail stop, 5 min walk.",
    wb: "https://www.sanjosetheaters.org"
  },

  /* Parking */
  { id: "pk1", cat: "parking", hood: "downtown", t: "ParkSJ 2nd Street Garage", a: "2nd St, San Jose, CA", lat: 37.3361, lng: -121.8856, ds: "City parking garage, 2nd Street entrance." },
  { id: "pk2", cat: "parking", hood: "downtown", t: "ParkSJ 3rd Street Garage", a: "3rd St, San Jose, CA", lat: 37.3361, lng: -121.8834, ds: "City parking garage, 3rd Street entrance." },
  { id: "pk3", cat: "parking", hood: "downtown", t: "San Pedro Square Garage", a: "San Pedro St, San Jose, CA", lat: 37.3374, lng: -121.8936, ds: "Garage adjacent to San Pedro Square Market." },
  { id: "pk4", cat: "parking", hood: "downtown", t: "Convention Center Parking", a: "Convention Center, San Jose, CA", lat: 37.3305, lng: -121.8888, ds: "Parking at the San Jose Convention Center." },

  /* Restrooms */
  { id: "rr1", cat: "restrooms", hood: "downtown", t: "Plaza de Cesar Chavez Restrooms", a: "Plaza de Cesar Chavez, San Jose, CA", lat: 37.3325, lng: -121.8900, ds: "Public restrooms in the park." },
  { id: "rr2", cat: "restrooms", hood: "downtown", t: "San Pedro Square Market Restrooms", a: "87 N San Pedro St, San Jose, CA", lat: 37.3369, lng: -121.8949, ds: "Restrooms inside the market." },
  { id: "rr3", cat: "restrooms", hood: "downtown", t: "SoFA Market Restrooms", a: "387 S 1st St, San Jose, CA", lat: 37.3298, lng: -121.8859, ds: "Restrooms inside the food hall." },
  { id: "rr4", cat: "restrooms", hood: "downtown", t: "Convention Center Public Restrooms", a: "150 W San Carlos St, San Jose, CA", lat: 37.3304, lng: -121.8892, ds: "Public restrooms at the Convention Center." },
  { id: "rr5", cat: "restrooms", hood: "downtown", t: "MLK Library Restrooms", a: "150 E San Fernando St, San Jose, CA", lat: 37.3355, lng: -121.8850, ds: "Restrooms inside the Dr. Martin Luther King Jr. Library." },

  /* Transit */
  { id: "tr1", cat: "transit", hood: "downtown", t: "Diridon Station", a: "65 Cahill St, San Jose, CA", lat: 37.3306, lng: -121.9023, ds: "Caltrain, ACE, Amtrak and future BART/HSR hub." },
  { id: "tr2", cat: "transit", hood: "downtown", t: "Convention Center VTA Stop", a: "1st St, San Jose, CA", lat: 37.3300, lng: -121.8891, ds: "VTA Light Rail stop near the Convention Center." },
  { id: "tr3", cat: "transit", hood: "downtown", t: "St James VTA Stop", a: "N 1st St, San Jose, CA", lat: 37.3418, lng: -121.8905, ds: "VTA Light Rail stop near St James Park." },

  /* Schools / Hospitals / Churches - often host city-sponsored events */
  { id: "sc1", cat: "schools", hood: "downtown", t: "San Jose State University", a: "1 Washington Sq, San Jose, CA 95192", lat: 37.3352, lng: -121.8811, ds: "Public university anchoring the east edge of downtown; frequent public events and lectures." },
  { id: "ch1", cat: "churches", hood: "downtown", t: "Cathedral Basilica of St. Joseph", a: "80 S Market St, San Jose, CA 95113", lat: 37.3358, lng: -121.8912, ds: "Historic Catholic cathedral in the heart of downtown; hosts community and holiday services." },
  { id: "ho1", cat: "hospitals", hood: "east", t: "Regional Medical Center of San Jose", a: "225 N Jackson Ave, San Jose, CA 95116", lat: 37.3559, lng: -121.8656, ds: "Full-service hospital serving east San Jose." },

  /* Japantown sample pins */
  { id: "jt1", cat: "foodhall", hood: "japantown", t: "Japantown Food Row", a: "Jackson St, San Jose, CA", lat: 37.3494, lng: -121.8925, ds: "Historic strip of Japanese restaurants and cafes." },
  { id: "jt2", cat: "shop", hood: "japantown", t: "Nichi Bei Bussan", a: "140 Jackson St, San Jose, CA", lat: 37.3496, lng: -121.8920, ds: "Longtime Japanese import and gift shop." },
  { id: "jt3", cat: "parking", hood: "japantown", t: "Japantown Public Parking", a: "Jackson St, San Jose, CA", lat: 37.3500, lng: -121.8912, ds: "Public lot serving Japantown businesses." },

  /* Santana Row sample pins */
  { id: "sr1", cat: "shop", hood: "santana", t: "Santana Row Shops", a: "377 Santana Row, San Jose, CA", lat: 37.3212, lng: -121.9480, ds: "Upscale open-air shopping and dining district." },
  { id: "sr2", cat: "bars", hood: "santana", t: "Santana Row Dining", a: "355 Santana Row, San Jose, CA", lat: 37.3205, lng: -121.9487, ds: "Restaurants and rooftop bars along the row." },
  { id: "sr3", cat: "parking", hood: "santana", t: "Santana Row Garage", a: "Santana Row, San Jose, CA", lat: 37.3199, lng: -121.9495, ds: "Structured parking serving Santana Row." },

  /* Willow Glen sample pins */
  { id: "wg1", cat: "shop", hood: "willow", t: "Lincoln Ave Shops", a: "Lincoln Ave, San Jose, CA", lat: 37.3066, lng: -121.8897, ds: "Boutique shopping strip along Lincoln Avenue." },
  { id: "wg2", cat: "foodhall", hood: "willow", t: "Willow Glen Cafes", a: "Lincoln Ave, San Jose, CA", lat: 37.3070, lng: -121.8905, ds: "Cafes and casual dining on Lincoln Avenue." },

  /* Alum Rock sample pins */
  { id: "ar1", cat: "market", hood: "alum", t: "Alum Rock Village Market", a: "Alum Rock Ave, San Jose, CA", lat: 37.3563, lng: -121.8248, ds: "Neighborhood market and produce stalls." },
  { id: "ar2", cat: "cityart", hood: "alum", t: "Alum Rock Park Trailhead Art", a: "Penitencia Creek Rd, San Jose, CA", lat: 37.3798, lng: -121.7995, ds: "Public art near the Alum Rock Park entrance." },

  /* East San Jose sample pins */
  { id: "es1", cat: "market", hood: "east", t: "Story Road Market", a: "Story Rd, San Jose, CA", lat: 37.3444, lng: -121.8394, ds: "Community market along Story Road." },
  { id: "es2", cat: "cityart", hood: "east", t: "East Side Community Mural", a: "King Rd, San Jose, CA", lat: 37.3465, lng: -121.8362, ds: "Community mural celebrating East San Jose." }
];
