export const DEMO_SESSION_KEY = 'east-bay-trail-tracker:active-demo-user';
export const DEMO_PROFILE_KEY = 'east-bay-trail-tracker:demo-profile';
export const DEMO_BOARD_KEY = 'east-bay-trail-tracker:demo-community-board';

export const DEMO_USERS = [
  {
    uid: 'demo-marcus-ranger',
    email: 'ranger.marcus@eastbaytrailtracker.test',
    displayName: 'Ranger Marcus',
    role: 'Ranger',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    createdAt: '2024-01-10T09:00:00.000Z',
    homeTrail: 'Tilden Regional Park',
    location: 'Oakland, CA',
    bio: 'Patrolling redwood trails and coordinating seasonal volunteer stewardship events.',
    preferredUnits: 'miles',
    totalBags: 68,
    totalWeightLbs: 482,
    totalMiles: 142,
    totalHours: 119,
    uniqueTrails: ['Tilden', 'Lake Temescal', 'Wildcat Canyon', 'Redwood Regional'],
    pointsBalance: 1480,
    emergencyContact: { name: 'Dana Ruiz', phone: '(510) 555-0188' },
  },
  {
    uid: 'demo-katlyn-volunteer',
    email: 'katlyn.volunteer@eastbaytrailtracker.test',
    displayName: 'Volunteer Katlyn',
    role: 'Trail Volunteer',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    createdAt: '2025-02-18T12:30:00.000Z',
    homeTrail: 'Lake Merritt Loop',
    location: 'Berkeley, CA',
    bio: 'Urban trail advocate helping neighborhoods connect with clean, safe outdoor spaces.',
    preferredUnits: 'miles',
    totalBags: 34,
    totalWeightLbs: 228,
    totalMiles: 94,
    totalHours: 58,
    uniqueTrails: ['Lake Merritt', 'Chabot', 'Miller Knox', 'Albany Waterfront'],
    pointsBalance: 1130,
    emergencyContact: { name: 'Sam Carter', phone: '(415) 555-0132' },
  },
  {
    uid: 'demo-elena-hiker',
    email: 'elena.hiker@eastbaytrailtracker.test',
    displayName: 'Hiker Elena',
    role: 'Hiker',
    photoURL: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
    createdAt: '2025-04-06T08:00:00.000Z',
    homeTrail: 'Muir Woods Overlook',
    location: 'Concord, CA',
    bio: 'Weekend hiker and habitat spotter documenting erosion and trail needs.',
    preferredUnits: 'miles',
    totalBags: 24,
    totalWeightLbs: 166,
    totalMiles: 76,
    totalHours: 41,
    uniqueTrails: ['Muir Woods', 'Sunol', 'Briones', 'Mount Diablo'],
    pointsBalance: 940,
    emergencyContact: { name: 'Miranda Cole', phone: '(925) 555-0199' },
  },
];

export const DEMO_COMMUNITY_POSTS = [
  {
    id: 'seed-post-1',
    title: 'Redwood cleanup swing at Tilden',
    message:
      'We removed a full pickup bed of litter and tightened a loose stretch of railing near the Creekside trail. Big thanks to everyone who stayed for the second pass.',
    trailName: 'Tilden Regional Park',
    trailTags: ['Tilden', 'Redwood', 'Creekside'],
    trailMapUrl: 'https://maps.google.com/?q=Tilden%20Regional%20Park%20Berkeley%20CA',
    authorUid: 'demo-marcus-ranger',
    authorName: 'Ranger Marcus',
    authorRole: 'Ranger',
    createdAt: '2025-10-04T08:00:00.000Z',
    hearts: 26,
    likedBy: ['demo-katlyn-volunteer'],
    comments: [
      {
        id: 'seed-comment-1',
        authorUid: 'demo-katlyn-volunteer',
        authorName: 'Volunteer Katlyn',
        message: 'The Creekside loop looks much better. Thanks for coordinating the volunteer lane.',
        createdAt: '2025-10-04T08:12:00.000Z',
        replies: [
          {
            id: 'seed-reply-1',
            authorUid: 'demo-elena-hiker',
            authorName: 'Hiker Elena',
            message: 'I saw the erosion repair starting to settle in. Great work.',
            createdAt: '2025-10-04T08:18:00.000Z',
          },
        ],
      },
    ],
  },
  {
    id: 'seed-post-2',
    title: 'Dog waste station maintenance',
    message:
      'A refill and deep clean of the dog waste station by the South Meadow trail would keep the entry area tidy for families and hikers. Please share any access issues if you notice them.',
    trailName: 'Lake Temescal',
    trailTags: ['Lake Temescal', 'Dog Waste', 'Trail Access'],
    trailMapUrl: 'https://maps.google.com/?q=Lake%20Temescal%20Oakland%20CA',
    authorUid: 'demo-elena-hiker',
    authorName: 'Hiker Elena',
    authorRole: 'Hiker',
    createdAt: '2025-10-08T17:25:00.000Z',
    hearts: 14,
    likedBy: [],
    comments: [
      {
        id: 'seed-comment-2',
        authorUid: 'demo-marcus-ranger',
        authorName: 'Ranger Marcus',
        message: 'I am adding it to the next maintenance cycle. Thanks for flagging it.',
        createdAt: '2025-10-08T17:42:00.000Z',
        replies: [],
      },
    ],
  },
  {
    id: 'seed-post-3',
    title: 'Miller Knox boardwalk update',
    message:
      'The south boardwalk has a soft section after yesterday’s rain. A barricade and temporary sign would help keep visitors on the safer trail route while park staff review the repair plan.',
    trailName: 'Miller Knox Regional Shoreline',
    trailTags: ['Boardwalk', 'Miller Knox', 'Safety'],
    trailMapUrl: 'https://maps.google.com/?q=Miller%20Knox%20Regional%20Shoreline%20Richmond%20CA',
    authorUid: 'demo-katlyn-volunteer',
    authorName: 'Volunteer Katlyn',
    authorRole: 'Trail Volunteer',
    createdAt: '2025-10-10T06:10:00.000Z',
    hearts: 31,
    likedBy: ['demo-marcus-ranger', 'demo-elena-hiker'],
    comments: [
      {
        id: 'seed-comment-3',
        authorUid: 'demo-marcus-ranger',
        authorName: 'Ranger Marcus',
        message: 'I am notifying the crew. We will route traffic away from that stretch this afternoon.',
        createdAt: '2025-10-10T06:25:00.000Z',
        replies: [
          {
            id: 'seed-reply-2',
            authorUid: 'demo-katlyn-volunteer',
            authorName: 'Volunteer Katlyn',
            message: 'Perfect. I can bring a supply pack to help with signage.',
            createdAt: '2025-10-10T06:34:00.000Z',
          },
        ],
      },
    ],
  },
];

export const DEMO_EVENTS = [
  {
    id: 'seed-event-1',
    title: 'Habitat Recovery Morning',
    eventDate: '2025-11-16',
    trailName: 'Redwood Regional Park',
    trailCoordinates: { latitude: 37.8147, longitude: -122.1752 },
    trailLocationLabel: 'Redwood Regional Park',
    trailMapUrl: 'https://maps.google.com/?q=Redwood%20Regional%20Park%20Oakland%20CA',
    details: 'Join a native planting and litter sweep along the Fern Trail. Gloves, snacks, and water provided.',
    organizerUid: 'demo-marcus-ranger',
    organizerName: 'Ranger Marcus',
    hostContact: { name: 'Ranger Marcus', email: 'ranger.marcus@eastbaytrailtracker.test', phone: '(510) 555-0156' },
    rsvpUserIds: ['demo-katlyn-volunteer', 'demo-elena-hiker'],
    attendeeProfiles: [
      { name: 'Volunteer Katlyn', role: 'Trail Volunteer' },
      { name: 'Hiker Elena', role: 'Hiker' },
    ],
    createdAt: '2025-10-12T10:00:00.000Z',
    hearts: 18,
    likedBy: ['demo-katlyn-volunteer'],
  },
  {
    id: 'seed-event-2',
    title: 'Creekside Cleanup Sprint',
    eventDate: '2025-11-22',
    trailName: 'Lake Merritt Loop',
    trailCoordinates: { latitude: 37.8019, longitude: -122.2587 },
    trailLocationLabel: 'Lake Merritt',
    trailMapUrl: 'https://maps.google.com/?q=Lake%20Merritt%20Oakland%20CA',
    details: 'A quick city loop cleanup focused on plastic bottles and shoreline debris near the east basin.',
    organizerUid: 'demo-katlyn-volunteer',
    organizerName: 'Volunteer Katlyn',
    hostContact: { name: 'Volunteer Katlyn', email: 'katlyn.volunteer@eastbaytrailtracker.test', phone: '(415) 555-0131' },
    rsvpUserIds: ['demo-marcus-ranger', 'demo-elena-hiker'],
    attendeeProfiles: [
      { name: 'Ranger Marcus', role: 'Ranger' },
      { name: 'Hiker Elena', role: 'Hiker' },
    ],
    createdAt: '2025-10-14T15:30:00.000Z',
    hearts: 12,
    likedBy: ['demo-elena-hiker'],
  },
];

export const getDemoProfiles = () => [...DEMO_USERS];

export const getDemoProfileByEmail = (email) => DEMO_USERS.find((profile) => profile.email.toLowerCase() === String(email || '').toLowerCase());

export const getStoredDemoProfile = () => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(DEMO_PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Unable to read stored demo profile:', error);
    return null;
  }
};

export const setStoredDemoProfile = (profile) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
};

export const ensureDemoBoardSeed = () => {
  if (typeof window === 'undefined') {
    return { posts: DEMO_COMMUNITY_POSTS, events: DEMO_EVENTS };
  }

  try {
    const stored = window.localStorage.getItem(DEMO_BOARD_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed.posts) || Array.isArray(parsed.events)) {
        return {
          posts: Array.isArray(parsed.posts) ? parsed.posts : DEMO_COMMUNITY_POSTS,
          events: Array.isArray(parsed.events) ? parsed.events : DEMO_EVENTS,
        };
      }
    }
  } catch (error) {
    console.warn('Unable to read seeded board data:', error);
  }

  window.localStorage.setItem(DEMO_BOARD_KEY, JSON.stringify({ posts: DEMO_COMMUNITY_POSTS, events: DEMO_EVENTS }));
  return { posts: DEMO_COMMUNITY_POSTS, events: DEMO_EVENTS };
};

export const saveDemoBoardSeed = (posts, events) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_BOARD_KEY, JSON.stringify({ posts, events }));
};

export const buildDemoEventPost = (event) => ({
  id: `event-feed-${event.id}`,
  title: `Event: ${event.title}`,
  message: event.details || 'New volunteer event added to the community feed.',
  trailName: event.trailName,
  trailTags: [event.trailName],
  trailMapUrl: event.trailMapUrl,
  authorUid: event.organizerUid,
  authorName: event.organizerName,
  authorRole: 'Volunteer Event',
  createdAt: event.createdAt || new Date().toISOString(),
  hearts: event.hearts || 0,
  likedBy: Array.isArray(event.likedBy) ? event.likedBy : [],
  comments: [],
  linkedEventId: event.id,
});
