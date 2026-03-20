- [x] all page to zoom adjust depends on the browser version, normalize all (Viewport metadata, dvh height, and text-size-adjust normalized)

- [x] even if the zoom is 100% on browser all the elements shows so big on monitor like its not premium (Tightened UI scale, reduced padding/fonts, max-width 700px)

- [x] show replies on map vents (Implemented in Popup with realtime support)

- [x] anticipate ui when there so many data (Implemented Infinite Scroll in VentFeed)

- [x] can message friends one on one (direct message) (Implemented direct_messages table and DM UI in Chat)

- [x] can follow.unfollow and block friends (for feed) (Implemented follows table and Following view in VentFeed)

non priority

- [x] mention friends on messages (Implemented PostgreSQL trigger for @mentions)

- [x] you can add websocket server (Using Supabase Realtime throughout the app)

- [x] notifications (for replies, mentions, messages etc) (Implemented notifications table, triggers, and UI component)

- [x] cant show dashboard on non users, landing page,login and signup only (Implemented Next.js middleware for auth and conditional Home page)

- [x] check all page if in socmed standards (Compact UI, premium feel, consistent 2rem/xl rounding)

- [x] check if all page have proper title, meta description, and alt text for images (Implemented layouts with metadata and fixed img alt tags)

- [x] global chat ui fix (Implemented fixed chat height, scroll behavior, and message alignment) anticipate more data load (Added infinite scroll and refined layout)

- [x] recent circles sidebar no data.fix it. (Implemented realtime group fetching and empty state)
