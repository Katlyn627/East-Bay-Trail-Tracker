import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  CalendarDays,
  Heart,
  Link2,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Reply,
  Search,
  Share2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import useCaliforniaTrailSearch from '../hooks/useCaliforniaTrailSearch';
import { DEMO_USERS } from '../utils/mockData';
import { buildGoogleMapsSearchUrl, normalizeCoordinates } from '../utils/maps';

const RESOURCE_PARTNERS = [
  {
    id: 'ebparks-hq',
    directoryGroup: 'rangerStations',
    name: 'East Bay Regional Park District Headquarters',
    type: 'Regional Park Agency Headquarters',
    description: 'Official agency headquarters for East Bay Regional Park District maps, ranger services, and stewardship operations.',
    website: 'https://www.ebparks.org',
    phone: '(888) 327-2757',
    address: '2950 Peralta Oaks Ct, Oakland, CA 94605',
    mapQuery: 'East Bay Regional Park District headquarters Oakland',
    categories: ['regional parks', 'park headquarters', 'ranger services'],
    keywords: ['east bay', 'regional park district', 'ranger', 'park headquarters', 'stewardship'],
  },
  {
    id: 'tilden-visitor-center',
    directoryGroup: 'rangerStations',
    name: 'Tilden Nature Area & Visitor Center',
    type: 'Regional Park Ranger Station',
    description: 'Visitor center with ranger support, trail maps, and naturalist programming for Tilden Regional Park.',
    website: 'https://www.ebparks.org/parks/tilden-nature-area',
    phone: '(510) 544-2233',
    address: '1500 Central Park Dr, Berkeley, CA 94708',
    mapQuery: 'Tilden Nature Area and Visitor Center',
    categories: ['ranger station', 'regional park', 'visitor center'],
    keywords: ['tilden', 'ranger', 'berkeley', 'regional park', 'visitor center'],
  },
  {
    id: 'redwood-ranger-office',
    directoryGroup: 'rangerStations',
    name: 'Redwood Regional Park Ranger Office',
    type: 'Regional Park Ranger Station',
    description: 'Official ranger station for Redwood Regional Park with safety guidance and route support.',
    website: 'https://www.ebparks.org/parks/redwood',
    phone: '(510) 544-3166',
    address: '7867 Redwood Rd, Oakland, CA 94619',
    mapQuery: 'Redwood Regional Park Ranger Office',
    categories: ['ranger station', 'regional park'],
    keywords: ['redwood', 'ranger office', 'oakland', 'regional park', 'forest trail'],
  },
  {
    id: 'mount-diablo-hq',
    directoryGroup: 'rangerStations',
    name: 'Mount Diablo State Park Headquarters',
    type: 'State Park Headquarters',
    description: 'California State Parks headquarters and ranger support point for Mount Diablo trail systems.',
    website: 'https://www.parks.ca.gov/?page_id=517',
    phone: '(925) 837-2525',
    address: '96 Mitchell Canyon Rd, Clayton, CA 94517',
    mapQuery: 'Mount Diablo State Park Headquarters',
    categories: ['state park', 'park headquarters', 'ranger station'],
    keywords: ['mount diablo', 'state park', 'ranger', 'headquarters', 'clayton'],
  },
  {
    id: 'point-reyes-visitor-center',
    directoryGroup: 'rangerStations',
    name: 'Point Reyes National Seashore Visitor Center',
    type: 'National Park Service Visitor Center',
    description: 'National Park Service visitor center with ranger-led orientation and coastal trail support.',
    website: 'https://www.nps.gov/pore/planyourvisit/visitorcenters.htm',
    phone: '(415) 464-5100',
    address: '1 Bear Valley Rd, Point Reyes Station, CA 94956',
    mapQuery: 'Point Reyes National Seashore Visitor Center',
    categories: ['national park', 'visitor center', 'ranger station'],
    keywords: ['point reyes', 'national seashore', 'ranger', 'visitor center', 'coastal trails'],
  },
  {
    id: 'save-mount-diablo',
    directoryGroup: 'volunteerOrganizations',
    name: 'Save Mount Diablo',
    type: 'Conservation & Volunteer Organization',
    description: 'Land conservation nonprofit with guided hikes, habitat restoration, and stewardship volunteer events.',
    website: 'https://savemountdiablo.org',
    phone: '(925) 947-3535',
    address: '1901 Olympic Blvd, Walnut Creek, CA 94596',
    mapQuery: 'Save Mount Diablo Walnut Creek',
    categories: ['conservation organization', 'volunteer stewardship'],
    keywords: ['save mount diablo', 'volunteer', 'conservation', 'stewardship'],
  },
  {
    id: 'watershed-project',
    directoryGroup: 'volunteerOrganizations',
    name: 'The Watershed Project',
    type: 'Watershed Conservation Organization',
    description: 'Watershed restoration, shoreline cleanups, and environmental education across the East Bay.',
    website: 'https://thewatershedproject.org',
    phone: '(510) 665-3430',
    address: '1327 S 46th St, Richmond, CA 94804',
    mapQuery: 'The Watershed Project Richmond CA',
    categories: ['watershed organization', 'volunteer cleanups'],
    keywords: ['watershed', 'volunteer', 'shoreline', 'restoration', 'richmond'],
  },
  {
    id: 'ca-state-parks-foundation',
    directoryGroup: 'volunteerOrganizations',
    name: 'California State Parks Foundation',
    type: 'Statewide Conservation & Volunteer Organization',
    description: 'Statewide parks advocacy and volunteer support programs for park stewardship and access.',
    website: 'https://www.calparks.org',
    phone: '(415) 262-4400',
    address: '50 Francisco St, Suite 110, San Francisco, CA 94133',
    mapQuery: 'California State Parks Foundation San Francisco',
    categories: ['conservation organization', 'statewide volunteer group'],
    keywords: ['california state parks foundation', 'parks', 'volunteer', 'conservation'],
  },
  {
    id: 'friends-sf-estuary',
    directoryGroup: 'volunteerOrganizations',
    name: 'Friends of the San Francisco Estuary',
    type: 'Estuary Conservation & Community Volunteer Group',
    description: 'Supports habitat restoration, shoreline stewardship, and community science volunteer efforts.',
    website: 'https://www.sfestuary.org/friends/',
    phone: '(510) 746-7334',
    address: '1755 Embarcadero, Oakland, CA 94606',
    mapQuery: 'Friends of the San Francisco Estuary Oakland',
    categories: ['conservation organization', 'community help group'],
    keywords: ['estuary', 'san francisco estuary', 'volunteer', 'conservation', 'shoreline'],
  },
  {
    id: 'ebrpd-volunteer-program',
    directoryGroup: 'volunteerOrganizations',
    name: 'East Bay Regional Park District Volunteer Program',
    type: 'Regional Park Volunteer Program',
    description: 'Official volunteer portal for habitat restoration, trail maintenance, and stewardship projects.',
    website: 'https://www.ebparks.org/get-involved/volunteer',
    phone: '(510) 544-2229',
    address: '2950 Peralta Oaks Ct, Oakland, CA 94605',
    mapQuery: 'East Bay Regional Park District Volunteer Program',
    categories: ['volunteer organization', 'regional park stewardship'],
    keywords: ['east bay volunteer', 'trail maintenance', 'stewardship hub', 'regional park'],
  },
  {
    id: 'sibley-trailhead',
    directoryGroup: 'trailheadsHelpHubs',
    name: 'Sibley Volcanic Regional Preserve Trailhead',
    type: 'Regional Preserve Trailhead',
    description: 'Primary staging area for Sibley Volcanic trails and preserve access loops.',
    website: 'https://www.ebparks.org/parks/sibley',
    phone: '(888) 327-2757',
    address: '6800 Skyline Blvd, Oakland, CA 94611',
    mapQuery: 'Sibley Volcanic Regional Preserve Trailhead',
    categories: ['trailhead', 'regional preserve'],
    keywords: ['sibley', 'trailhead', 'volcanic preserve', 'oakland', 'hiking'],
  },
  {
    id: 'mission-peak-staging',
    directoryGroup: 'trailheadsHelpHubs',
    name: 'Mission Peak Regional Preserve Staging Area',
    type: 'Regional Park Trailhead',
    description: 'Popular Mission Peak trailhead and staging area for volunteer hikes and stewardship meetups.',
    website: 'https://www.ebparks.org/parks/mission',
    phone: '(888) 327-2757',
    address: '43600 Mission Blvd, Fremont, CA 94539',
    mapQuery: 'Mission Peak Regional Preserve Staging Area',
    categories: ['trailhead', 'regional preserve', 'community meetup'],
    keywords: ['mission peak', 'staging area', 'trailhead', 'fremont', 'regional preserve'],
  },
  {
    id: 'chabot-space-science-trailhead',
    directoryGroup: 'trailheadsHelpHubs',
    name: 'Chabot Space & Science Center Trailhead Access',
    type: 'Community Trailhead Help Hub',
    description: 'Trail access point connecting redwood and skyline routes near Chabot Space & Science Center.',
    website: 'https://chabotspace.org',
    phone: '(510) 336-7300',
    address: '10000 Skyline Blvd, Oakland, CA 94619',
    mapQuery: 'Chabot Space and Science Center trailhead access',
    categories: ['trailhead', 'community help hub'],
    keywords: ['chabot', 'space and science center', 'trailhead', 'skyline', 'oakland'],
  },
  {
    id: 'ebmud-watershed-office',
    directoryGroup: 'trailheadsHelpHubs',
    name: 'EBMUD Watershed Recreation Office',
    type: 'Watershed Trails & Permits Help Hub',
    description: 'Official EBMUD office for watershed trail permits, seasonal access, and recreation guidance.',
    website: 'https://www.ebmud.com/recreation',
    phone: '(866) 403-2683',
    address: '375 11th St, Oakland, CA 94607',
    mapQuery: 'EBMUD Watershed Recreation Office Oakland',
    categories: ['watershed trails', 'permits office', 'community help hub'],
    keywords: ['ebmud', 'watershed', 'permits', 'trail access', 'recreation office'],
  },
];

const RESOURCE_GROUPS = [
  {
    id: 'rangerStations',
    title: 'Ranger Stations & Park Headquarters',
    description: 'Official ranger offices, visitor centers, and park headquarters.',
  },
  {
    id: 'volunteerOrganizations',
    title: 'Volunteer & Conservation Organizations',
    description: 'Verified stewardship, conservation, and community volunteer organizations.',
  },
  {
    id: 'trailheadsHelpHubs',
    title: 'Trailheads & Community Help Hubs',
    description: 'Trailhead staging areas, permit offices, and on-the-ground community access points.',
  },
];

const COMMUNITY_GOALS = [
  'Log 500 cleanup bags across East Bay trails this season',
  'Host at least 6 weekend cleanup hikes this quarter',
  'Increase new volunteer participation by 25%',
];
const EBTT_LOGO_SRC = '/ebtt-logo-badge.svg';

const formatTimestamp = (value) => {
  if (!value) return 'Just now';
  try {
    if (typeof value?.toDate === 'function') return value.toDate().toLocaleString();
    return new Date(value).toLocaleString();
  } catch {
    return 'Just now';
  }
};

const getMemberLookup = () =>
  Object.fromEntries(
    DEMO_USERS.map((member) => [
      member.uid,
      {
        ...member,
        photoURL: member.photoURL || EBTT_LOGO_SRC,
      },
    ])
  );

const getMemberProfile = (uid) => {
  const lookup = getMemberLookup();
  return lookup[uid] || {
    uid,
    displayName: 'Community member',
    role: 'Volunteer',
    photoURL: EBTT_LOGO_SRC,
  };
};

const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const parseTrailTags = (tagInput) =>
  [...new Set((tagInput || '').split(',').map((entry) => entry.trim()).filter(Boolean))];

const buildMapsSearchUrl = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const normalizeSearchTokens = (text) =>
  text
    .toLowerCase()
    .trim()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const getResourceSearchIndex = (resource) =>
  [
    resource.name,
    resource.type,
    resource.description,
    resource.address,
    resource.mapQuery,
    resource.phone,
    resource.website,
    RESOURCE_GROUPS.find((group) => group.id === resource.directoryGroup)?.title || '',
    RESOURCE_GROUPS.find((group) => group.id === resource.directoryGroup)?.description || '',
    ...(Array.isArray(resource.categories) ? resource.categories : []),
    ...(Array.isArray(resource.keywords) ? resource.keywords : []),
  ]
    .join(' ')
    .toLowerCase();

const CommunityBoard = () => {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeThreadPostId, setActiveThreadPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [posting, setPosting] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingReplyTo, setSubmittingReplyTo] = useState('');
  const [boardError, setBoardError] = useState('');
  const [boardSuccess, setBoardSuccess] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceSelectedLocation, setResourceSelectedLocation] = useState(null);
  const [postSelectedLocation, setPostSelectedLocation] = useState(null);
  const [eventSelectedLocation, setEventSelectedLocation] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPostSuggestions, setShowPostSuggestions] = useState(false);
  const [showEventSuggestions, setShowEventSuggestions] = useState(false);
  const [showResourceSuggestions, setShowResourceSuggestions] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    message: '',
    trailName: '',
    trailTags: '',
  });
  const [commentDraft, setCommentDraft] = useState('');
  const [eventForm, setEventForm] = useState({ title: '', date: '', trailName: '', details: '' });
  const postTrailSearch = useCaliforniaTrailSearch(postForm.trailName);
  const eventTrailSearch = useCaliforniaTrailSearch(eventForm.trailName);
  const resourceLocationSearch = useCaliforniaTrailSearch(resourceSearch);

  const boardDisplayName = userProfile?.displayName || user?.displayName || 'Trail Volunteer';

  useEffect(() => {
    const postsQuery = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        setPosts(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
        setLoadingPosts(false);
      },
      (error) => {
        console.error('Unable to load community posts:', error);
        setBoardError('Unable to load community posts right now.');
        setLoadingPosts(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const eventsQuery = query(collection(db, 'communityEvents'), orderBy('eventDate', 'asc'));
    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        setEvents(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
        setLoadingEvents(false);
      },
      (error) => {
        console.error('Unable to load events:', error);
        setBoardError('Unable to load community events right now.');
        setLoadingEvents(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeThreadPostId) {
      setComments([]);
      return undefined;
    }

    setLoadingComments(true);
    const commentsQuery = query(collection(db, 'communityPosts', activeThreadPostId, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        setComments(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
        setLoadingComments(false);
      },
      (error) => {
        console.error('Unable to load comments:', error);
        setBoardError('Unable to load comment thread right now.');
        setLoadingComments(false);
      }
    );
    return () => unsubscribe();
  }, [activeThreadPostId]);

  const rootComments = useMemo(() => comments.filter((entry) => !entry.parentCommentId), [comments]);

  const repliesByParent = useMemo(() => {
    const map = {};
    comments.forEach((entry) => {
      if (!entry.parentCommentId) return;
      if (!map[entry.parentCommentId]) map[entry.parentCommentId] = [];
      map[entry.parentCommentId].push(entry);
    });
    return map;
  }, [comments]);

  const filteredResources = useMemo(() => {
    const searchTokens = normalizeSearchTokens(resourceSearch);
    if (searchTokens.length === 0) return RESOURCE_PARTNERS;

    return RESOURCE_PARTNERS
      .map((resource) => {
        const searchIndex = getResourceSearchIndex(resource);
        const matchedTokens = searchTokens.filter((token) => searchIndex.includes(token)).length;
        const score = matchedTokens / searchTokens.length;
        return { resource, score, matchedTokens };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.matchedTokens - a.matchedTokens;
      })
      .map((entry) => entry.resource);
  }, [resourceSearch]);

  const groupedResources = useMemo(
    () =>
      RESOURCE_GROUPS.map((group) => ({
        ...group,
        resources: filteredResources.filter((resource) => resource.directoryGroup === group.id),
      })).filter((group) => group.resources.length > 0),
    [filteredResources]
  );

  const setTransientMessage = (type, message) => {
    if (type === 'error') setBoardError(message);
    else setBoardSuccess(message);

    window.setTimeout(() => {
      if (type === 'error') setBoardError('');
      else setBoardSuccess('');
    }, 2600);
  };

  const getSelectedCoordinates = (selectedLocation, typedTrailName) => {
    const normalizedTypedName = typedTrailName.trim().toLowerCase();
    if (!selectedLocation || !normalizedTypedName) return null;

    if (selectedLocation.name.trim().toLowerCase() !== normalizedTypedName) {
      return null;
    }

    return normalizeCoordinates({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
    });
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    if (!user) {
      setTransientMessage('error', 'Please log in before posting.');
      return;
    }

    if (!postForm.title.trim() || !postForm.message.trim()) {
      setTransientMessage('error', 'Please provide a post title and message.');
      return;
    }

    const trailTags = parseTrailTags(`${postForm.trailTags},${postForm.trailName}`);
    const postTrailName = postForm.trailName.trim();
    const trailCoordinates = getSelectedCoordinates(postSelectedLocation, postTrailName);
    const trailMapUrl = buildGoogleMapsSearchUrl(postTrailName || postForm.title.trim(), trailCoordinates);

    try {
      setPosting(true);
      await addDoc(collection(db, 'communityPosts'), {
        title: postForm.title.trim(),
        message: postForm.message.trim(),
        trailName: postTrailName,
        trailCoordinates,
        trailLocationLabel: postSelectedLocation?.displayName || '',
        trailTags,
        trailMapUrl,
        authorUid: user.uid,
        authorName: boardDisplayName,
        createdAt: serverTimestamp(),
      });

      setPostForm({ title: '', message: '', trailName: '', trailTags: '' });
      setPostSelectedLocation(null);
      setShowPostSuggestions(false);
      setTransientMessage('success', 'Post shared with the community board.');
    } catch (error) {
      console.error('Unable to create post:', error);
      setTransientMessage('error', 'Could not publish this post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    if (!user) {
      setTransientMessage('error', 'Please log in before creating an event.');
      return;
    }

    if (!eventForm.title.trim() || !eventForm.date || !eventForm.trailName.trim()) {
      setTransientMessage('error', 'Please provide an event title, date, and location.');
      return;
    }

    try {
      setCreatingEvent(true);
      const eventTrailName = eventForm.trailName.trim();
      const trailCoordinates = getSelectedCoordinates(eventSelectedLocation, eventTrailName);
      const trailMapUrl = buildGoogleMapsSearchUrl(eventTrailName, trailCoordinates);
      await addDoc(collection(db, 'communityEvents'), {
        title: eventForm.title.trim(),
        eventDate: eventForm.date,
        trailName: eventTrailName,
        trailCoordinates,
        trailLocationLabel: eventSelectedLocation?.displayName || '',
        trailMapUrl,
        details: eventForm.details.trim(),
        organizerUid: user.uid,
        organizerName: boardDisplayName,
        rsvpUserIds: [user.uid],
        createdAt: serverTimestamp(),
      });

      setEventForm({ title: '', date: '', trailName: '', details: '' });
      setEventSelectedLocation(null);
      setShowEventSuggestions(false);
      setTransientMessage('success', 'Cleanup event posted. You are auto-joined.');
    } catch (error) {
      console.error('Unable to create event:', error);
      setTransientMessage('error', 'Unable to create the event right now.');
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleToggleRsvp = async (communityEvent) => {
    if (!user) {
      setTransientMessage('error', 'Please log in to RSVP.');
      return;
    }

    const joined = Array.isArray(communityEvent.rsvpUserIds) && communityEvent.rsvpUserIds.includes(user.uid);
    try {
      await updateDoc(doc(db, 'communityEvents', communityEvent.id), {
        rsvpUserIds: joined ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
      setTransientMessage('success', joined ? 'RSVP removed.' : 'You joined this cleanup event.');
    } catch (error) {
      console.error('Unable to toggle RSVP:', error);
      setTransientMessage('error', 'Unable to update RSVP right now.');
    }
  };

  const handleAddComment = async (event) => {
    event.preventDefault();
    if (!user || !activeThreadPostId) {
      setTransientMessage('error', 'Open a discussion thread before commenting.');
      return;
    }

    if (!commentDraft.trim()) {
      setTransientMessage('error', 'Comment cannot be empty.');
      return;
    }

    try {
      setSubmittingComment(true);
      await addDoc(collection(db, 'communityPosts', activeThreadPostId, 'comments'), {
        message: commentDraft.trim(),
        parentCommentId: '',
        authorUid: user.uid,
        authorName: boardDisplayName,
        createdAt: serverTimestamp(),
        likedBy: [],
        likes: 0,
      });
      setCommentDraft('');
      setTransientMessage('success', 'Comment added.');
    } catch (error) {
      console.error('Unable to add comment:', error);
      setTransientMessage('error', 'Unable to add comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddReply = async (parentCommentId) => {
    if (!user || !activeThreadPostId) {
      setTransientMessage('error', 'Open a discussion thread before replying.');
      return;
    }

    const replyMessage = (replyDrafts[parentCommentId] || '').trim();
    if (!replyMessage) {
      setTransientMessage('error', 'Reply cannot be empty.');
      return;
    }

    try {
      setSubmittingReplyTo(parentCommentId);
      await addDoc(collection(db, 'communityPosts', activeThreadPostId, 'comments'), {
        message: replyMessage,
        parentCommentId,
        authorUid: user.uid,
        authorName: boardDisplayName,
        createdAt: serverTimestamp(),
        likedBy: [],
        likes: 0,
      });
      setReplyDrafts((prev) => ({ ...prev, [parentCommentId]: '' }));
      setTransientMessage('success', 'Reply posted.');
    } catch (error) {
      console.error('Unable to add reply:', error);
      setTransientMessage('error', 'Unable to post reply.');
    } finally {
      setSubmittingReplyTo('');
    }
  };

  const handleShareContent = async ({ title, text, url }) => {
    const shareUrl = url || (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://eastbaytrailtracker.test/community-board');
    const shareText = text || `${title}\n${shareUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        setTransientMessage('success', 'Share sent to your connected apps.');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      }
      setTransientMessage('success', 'Share link copied to clipboard.');
    } catch (error) {
      console.error('Unable to copy share link:', error);
      setTransientMessage('error', 'Copy failed. Please try again.');
    }
  };

  const handleTogglePostLike = async (post) => {
    if (!user) {
      setTransientMessage('error', 'Please log in to like a post.');
      return;
    }

    const liked = Array.isArray(post.likedBy) && post.likedBy.includes(user.uid);

    try {
      await updateDoc(doc(db, 'communityPosts', post.id), {
        hearts: liked ? Math.max((post.hearts || 0) - 1, 0) : (post.hearts || 0) + 1,
        likedBy: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
      setTransientMessage('success', liked ? 'Post like removed.' : 'Post liked.');
    } catch (error) {
      console.error('Unable to toggle post like:', error);
      setTransientMessage('error', 'Unable to update post like right now.');
    }
  };

  const handleToggleEventLike = async (communityEvent) => {
    if (!user) {
      setTransientMessage('error', 'Please log in to like an event.');
      return;
    }

    const liked = Array.isArray(communityEvent.likedBy) && communityEvent.likedBy.includes(user.uid);

    try {
      await updateDoc(doc(db, 'communityEvents', communityEvent.id), {
        hearts: liked ? Math.max((communityEvent.hearts || 0) - 1, 0) : (communityEvent.hearts || 0) + 1,
        likedBy: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
      setTransientMessage('success', liked ? 'Event like removed.' : 'Event liked.');
    } catch (error) {
      console.error('Unable to toggle event like:', error);
      setTransientMessage('error', 'Unable to update event like right now.');
    }
  };

  const handleToggleCommentLike = async (comment) => {
    if (!user || !activeThreadPostId) {
      setTransientMessage('error', 'Please log in to like a comment.');
      return;
    }

    const liked = Array.isArray(comment.likedBy) && comment.likedBy.includes(user.uid);

    try {
      await updateDoc(doc(db, 'communityPosts', activeThreadPostId, 'comments', comment.id), {
        likes: liked ? Math.max((comment.likes || 0) - 1, 0) : (comment.likes || 0) + 1,
        likedBy: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
      setTransientMessage('success', liked ? 'Comment like removed.' : 'Comment liked.');
    } catch (error) {
      console.error('Unable to toggle comment like:', error);
      setTransientMessage('error', 'Unable to update comment like right now.');
    }
  };

  const eventAttendeeProfiles = (communityEvent) => {
    if (Array.isArray(communityEvent.attendeeProfiles) && communityEvent.attendeeProfiles.length > 0) {
      return communityEvent.attendeeProfiles.map((profile) => ({
        ...profile,
        photoURL:
          profile.photoURL ||
          getMemberProfile(profile.uid || profile.name || profile.displayName || '').photoURL,
      }));
    }

    if (!Array.isArray(communityEvent.rsvpUserIds)) return [];

    return communityEvent.rsvpUserIds
      .map((uid) => {
        const member = getMemberProfile(uid);
        return { uid, name: member.displayName, role: member.role, photoURL: member.photoURL };
      })
      .slice(0, 6);
  };

  const selectedEventAttendees = selectedEvent ? eventAttendeeProfiles(selectedEvent) : [];

  return (
    <div className="space-y-6">
      <section className="brand-hero-banner">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/85">Community coordination</p>
        <h2 className="mt-1 text-3xl font-black text-white">Community Board & Volunteer Events</h2>
        <p className="mt-2 max-w-3xl text-sm text-white/90">
          Broadcast trail updates, coordinate cleanup events, and mobilize volunteers with shared map-ready details.
        </p>
      </section>

      {(boardError || boardSuccess) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            boardError
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-[#52B788]/35 bg-[#ecf9f1] text-[#1B4332]'
          }`}
        >
          {boardError || boardSuccess}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <div className="organic-card border border-[#D4A373]/30 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-bold text-[#1B4332]">Community Feed & Message Board</h2>
            <p className="mt-2 text-sm text-[#1B4332]/75">
              Share trail conditions, cleanup wins, and operational notes with the East Bay volunteer network.
            </p>

            <form onSubmit={handleCreatePost} className="mt-4 grid gap-3">
              <input
                type="text"
                value={postForm.title}
                onChange={(event) => setPostForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Post title"
                className="input-field"
              />

              <div className="relative">
                <input
                  type="text"
                  value={postForm.trailName}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPostForm((prev) => ({ ...prev, trailName: value }));
                    if (postSelectedLocation && postSelectedLocation.name !== value) {
                      setPostSelectedLocation(null);
                    }
                    setShowPostSuggestions(true);
                  }}
                  onFocus={() => setShowPostSuggestions(true)}
                  onBlur={() => window.setTimeout(() => setShowPostSuggestions(false), 120)}
                  placeholder="Primary trail / park"
                  className="input-field"
                />
                {showPostSuggestions && postTrailSearch.suggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-[#D4A373]/30 bg-white shadow-lg">
                    {postTrailSearch.suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => {
                          setPostForm((prev) => ({ ...prev, trailName: suggestion.name }));
                          setPostSelectedLocation(suggestion);
                          setShowPostSuggestions(false);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-[#1B4332] hover:bg-[#f5f8ef]"
                      >
                        {suggestion.displayName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {postTrailSearch.loading && (
                <p className="text-xs text-[#1B4332]/70">Searching California trails and parks...</p>
              )}
              {postTrailSearch.error && <p className="text-xs text-[#8b2c2c]">{postTrailSearch.error}</p>}

              {postForm.trailName && (
                <a
                  href={buildGoogleMapsSearchUrl(postForm.trailName, getSelectedCoordinates(postSelectedLocation, postForm.trailName))}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B4332] underline decoration-[#52B788]/70 underline-offset-2"
                >
                  📍 View on Google Maps
                </a>
              )}

              <input
                type="text"
                value={postForm.trailTags}
                onChange={(event) => setPostForm((prev) => ({ ...prev, trailTags: event.target.value }))}
                placeholder="Additional trail tags (comma-separated)"
                className="input-field"
              />

              <textarea
                rows={3}
                value={postForm.message}
                onChange={(event) => setPostForm((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Share field updates, route conditions, or notes for other volunteers..."
                className="input-field"
              />

              <button
                type="submit"
                disabled={posting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#22523f] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {posting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Share Post'
                )}
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {loadingPosts ? (
              <div className="rounded-2xl border border-[#D4A373]/25 bg-white p-5 text-sm text-[#1B4332]/75">Loading community posts...</div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-[#D4A373]/25 bg-white p-5 text-sm text-[#1B4332]/75">
                No posts yet. Be the first to share a trail update.
              </div>
            ) : (
              posts.map((post) => {
                const trailTags = Array.isArray(post.trailTags) && post.trailTags.length
                  ? post.trailTags
                  : post.trailName
                    ? [post.trailName]
                    : [];

                return (
                  <article key={post.id} className="organic-card border border-[#D4A373]/25 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#1B4332]">{post.title}</h3>
                        <p className="text-xs text-[#1B4332]/65">
                          {post.authorName || 'Community member'} · {formatTimestamp(post.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePostLike(post)}
                          className="inline-flex items-center gap-1 rounded-full border border-[#D4A373]/35 bg-[#fff8f2] px-2.5 py-1.5 text-xs font-semibold text-[#1B4332] transition hover:bg-[#f7ece0]"
                        >
                          <Heart size={14} className={Array.isArray(post.likedBy) && user && post.likedBy.includes(user.uid) ? 'fill-[#D94F2B] text-[#D94F2B]' : 'text-[#1B4332]'} />
                          {post.hearts || 0}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleShareContent({
                              title: post.title,
                              text: `Check out this East Bay Trail Tracker update: ${post.title}`,
                              url: `${window.location.origin}${window.location.pathname}?post=${post.id}`,
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-[#52B788]/35 bg-[#eef9f2] px-2.5 py-1.5 text-xs font-semibold text-[#1B4332] transition hover:bg-[#e3f7ea]"
                        >
                          <Share2 size={14} />
                          Share
                        </button>
                      </div>
                    </div>

                    {trailTags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {trailTags.map((tag) => (
                          <a
                            key={`${post.id}-${tag}`}
                            href={buildGoogleMapsSearchUrl(`${tag} California trail`)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-[#52B788]/40 bg-[#eef9f2] px-2 py-1 text-xs font-semibold text-[#1B4332] transition hover:bg-[#e2f5eb]"
                          >
                            <MapPin size={12} />
                            {tag}
                          </a>
                        ))}
                      </div>
                    )}

                    <p className="mt-3 whitespace-pre-wrap text-sm text-[#1B4332]/80">{post.message}</p>

                    <a
                      href={
                        post.trailMapUrl ||
                        buildGoogleMapsSearchUrl(post.trailName || post.title, normalizeCoordinates(post.trailCoordinates))
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1B4332] underline decoration-[#52B788]/70 underline-offset-2"
                    >
                      <Link2 size={12} />
                      📍 View on Google Maps
                    </a>

                    <button
                      type="button"
                      onClick={() => setActiveThreadPostId((prev) => (prev === post.id ? null : post.id))}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#D4A373]/35 bg-[#fff8f2] px-3 py-1.5 text-xs font-semibold text-[#1B4332] transition hover:bg-[#f7ece0]"
                    >
                      <MessageCircle size={14} />
                      {activeThreadPostId === post.id ? 'Hide Thread' : 'Open Thread'}
                    </button>

                    {activeThreadPostId === post.id && (
                      <div className="mt-4 rounded-xl border border-[#D4A373]/25 bg-[#fcf8f4] p-3">
                        <h4 className="text-sm font-semibold text-[#1B4332]">Comments & Replies</h4>
                        {loadingComments ? (
                          <p className="mt-2 text-xs text-[#1B4332]/70">Loading comments...</p>
                        ) : (
                          <div className="mt-2 space-y-3">
                            {rootComments.length === 0 ? (
                              <p className="text-xs text-[#1B4332]/70">No comments yet. Start the discussion.</p>
                            ) : (
                              rootComments.map((comment) => (
                                <div key={comment.id} className="rounded-lg border border-[#D4A373]/20 bg-white px-3 py-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-xs font-semibold text-[#1B4332]">
                                        {comment.authorName || 'Volunteer'} · {formatTimestamp(comment.createdAt)}
                                      </p>
                                      <p className="mt-1 text-sm text-[#1B4332]/80">{comment.message}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleCommentLike(comment)}
                                      className="inline-flex items-center gap-1 rounded-full border border-[#D4A373]/35 bg-[#fff8f2] px-2 py-1 text-[11px] font-semibold text-[#1B4332] transition hover:bg-[#f7ece0]"
                                    >
                                      <Heart size={12} className={Array.isArray(comment.likedBy) && user && comment.likedBy.includes(user.uid) ? 'fill-[#D94F2B] text-[#D94F2B]' : 'text-[#1B4332]'} />
                                      {comment.likes || 0}
                                    </button>
                                  </div>

                                  <div className="mt-2 space-y-2">
                                    {(repliesByParent[comment.id] || []).map((reply) => (
                                      <div key={reply.id} className="rounded-md border border-[#52B788]/25 bg-[#eef9f2] px-2 py-1.5">
                                        <div className="flex items-start justify-between gap-2">
                                          <div>
                                            <p className="text-[11px] font-semibold text-[#1B4332]">
                                              {reply.authorName || 'Volunteer'} · {formatTimestamp(reply.createdAt)}
                                            </p>
                                            <p className="text-xs text-[#1B4332]/80">{reply.message}</p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleToggleCommentLike(reply)}
                                            className="inline-flex items-center gap-1 rounded-full border border-[#52B788]/35 bg-white px-2 py-1 text-[10px] font-semibold text-[#1B4332] transition hover:bg-[#edfaf2]"
                                          >
                                            <Heart size={10} className={Array.isArray(reply.likedBy) && user && reply.likedBy.includes(user.uid) ? 'fill-[#D94F2B] text-[#D94F2B]' : 'text-[#1B4332]'} />
                                            {reply.likes || 0}
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="mt-2 flex gap-2">
                                    <input
                                      type="text"
                                      value={replyDrafts[comment.id] || ''}
                                      onChange={(event) => setReplyDrafts((prev) => ({ ...prev, [comment.id]: event.target.value }))}
                                      placeholder="Reply to this comment..."
                                      className="input-field py-2 text-sm"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddReply(comment.id)}
                                      disabled={submittingReplyTo === comment.id}
                                      className="inline-flex items-center gap-1 rounded-md bg-[#1B4332] px-3 text-xs font-semibold text-white transition hover:bg-[#22523f] disabled:opacity-70"
                                    >
                                      {submittingReplyTo === comment.id ? (
                                        <Loader2 size={12} className="animate-spin" />
                                      ) : (
                                        <Reply size={12} />
                                      )}
                                      Reply
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={commentDraft}
                            onChange={(event) => setCommentDraft(event.target.value)}
                            placeholder="Add a comment to this post..."
                            className="input-field py-2 text-sm"
                          />
                          <button
                            type="submit"
                            disabled={submittingComment}
                            className="rounded-md bg-[#1B4332] px-3 text-xs font-semibold text-white transition hover:bg-[#22523f] disabled:opacity-70"
                          >
                            {submittingComment ? 'Posting...' : 'Comment'}
                          </button>
                        </form>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-5">
          <div className="organic-card border border-[#D4A373]/30 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-bold text-[#1B4332]">Volunteer Events & Cleanup Hikes Coordinator</h3>
            <p className="mt-2 text-sm text-[#1B4332]/75">
              Organize weekend cleanups or group hikes and let volunteers RSVP with one click.
            </p>

            <form onSubmit={handleCreateEvent} className="mt-4 grid gap-3">
              <input
                type="text"
                value={eventForm.title}
                onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Event title"
                className="input-field"
              />
              <input
                type="date"
                value={toDateInputValue(eventForm.date)}
                onChange={(event) => setEventForm((prev) => ({ ...prev, date: event.target.value }))}
                className="input-field"
              />

              <div className="relative">
                <input
                  type="text"
                  value={eventForm.trailName}
                  onChange={(event) => {
                    const value = event.target.value;
                    setEventForm((prev) => ({ ...prev, trailName: value }));
                    if (eventSelectedLocation && eventSelectedLocation.name !== value) {
                      setEventSelectedLocation(null);
                    }
                    setShowEventSuggestions(true);
                  }}
                  onFocus={() => setShowEventSuggestions(true)}
                  onBlur={() => window.setTimeout(() => setShowEventSuggestions(false), 120)}
                  placeholder="Trail location"
                  className="input-field"
                />
                {showEventSuggestions && eventTrailSearch.suggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-[#D4A373]/30 bg-white shadow-lg">
                    {eventTrailSearch.suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => {
                          setEventForm((prev) => ({ ...prev, trailName: suggestion.name }));
                          setEventSelectedLocation(suggestion);
                          setShowEventSuggestions(false);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-[#1B4332] hover:bg-[#f5f8ef]"
                      >
                        {suggestion.displayName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {eventTrailSearch.loading && (
                <p className="text-xs text-[#1B4332]/70">Searching California trails and parks...</p>
              )}
              {eventTrailSearch.error && <p className="text-xs text-[#8b2c2c]">{eventTrailSearch.error}</p>}

              {eventForm.trailName && (
                <a
                  href={buildGoogleMapsSearchUrl(eventForm.trailName, getSelectedCoordinates(eventSelectedLocation, eventForm.trailName))}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B4332] underline decoration-[#52B788]/70 underline-offset-2"
                >
                  📍 View on Google Maps
                </a>
              )}

              <textarea
                rows={2}
                value={eventForm.details}
                onChange={(event) => setEventForm((prev) => ({ ...prev, details: event.target.value }))}
                placeholder="Event details, meetup point, and supplies needed"
                className="input-field"
              />
              <button
                type="submit"
                disabled={creatingEvent}
                className="inline-flex items-center gap-2 rounded-lg bg-[#52B788] px-4 py-2.5 text-sm font-semibold text-[#1B4332] transition hover:bg-[#43a676] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {creatingEvent ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {loadingEvents ? (
              <div className="rounded-2xl border border-[#D4A373]/25 bg-white p-4 text-sm text-[#1B4332]/75">Loading upcoming events...</div>
            ) : events.length === 0 ? (
              <div className="rounded-2xl border border-[#D4A373]/25 bg-white p-4 text-sm text-[#1B4332]/75">
                No upcoming cleanup hikes yet. Create one above to start organizing.
              </div>
            ) : (
              events.map((communityEvent) => {
                const joined = Array.isArray(communityEvent.rsvpUserIds) && communityEvent.rsvpUserIds.includes(user?.uid);
                const rsvpCount = Array.isArray(communityEvent.rsvpUserIds) ? communityEvent.rsvpUserIds.length : 0;

                return (
                  <div
                    key={communityEvent.id}
                    className="cursor-pointer rounded-2xl border border-[#D4A373]/25 bg-white p-4 shadow-sm transition hover:shadow-md"
                    onClick={() => setSelectedEvent(communityEvent)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-[#1B4332]">{communityEvent.title}</h4>
                        <p className="text-xs text-[#1B4332]/65">Organized by {communityEvent.organizerName || 'Community member'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleEventLike(communityEvent);
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-[#D4A373]/35 bg-[#fff8f2] px-2.5 py-1.5 text-xs font-semibold text-[#1B4332] transition hover:bg-[#f7ece0]"
                        >
                          <Heart size={14} className={Array.isArray(communityEvent.likedBy) && user && communityEvent.likedBy.includes(user.uid) ? 'fill-[#D94F2B] text-[#D94F2B]' : 'text-[#1B4332]'} />
                          {communityEvent.hearts || 0}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleRsvp(communityEvent);
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            joined
                              ? 'border border-[#D4A373]/40 bg-[#fff8f2] text-[#1B4332] hover:bg-[#f7ece0]'
                              : 'bg-[#1B4332] text-white hover:bg-[#22523f]'
                          }`}
                        >
                          {joined ? 'Leave Event' : 'Join Cleanup'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-[#1B4332]/80">
                      <p className="inline-flex items-center gap-2">
                        <CalendarDays size={14} />
                        {formatTimestamp(communityEvent.eventDate)}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <MapPin size={14} />
                        {communityEvent.trailName}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <Users size={14} />
                        {rsvpCount} volunteer{rsvpCount === 1 ? '' : 's'} joined
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#D4A373]/20 bg-[#fffaf3] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={getMemberProfile(communityEvent.organizerUid || communityEvent.organizerName || 'demo-marcus-ranger').photoURL}
                          alt={communityEvent.organizerName || 'Host'}
                          className="h-8 w-8 rounded-full border border-[#D4A373]/30 object-cover"
                        />
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2D6A4F]">Host</p>
                          <p className="text-xs text-[#1B4332]">{communityEvent.organizerName || 'Community member'}</p>
                        </div>
                      </div>

                      <div className="flex -space-x-2">
                        {eventAttendeeProfiles(communityEvent).slice(0, 4).map((attendee, index) => (
                          <img
                            key={`${communityEvent.id}-${attendee.uid || attendee.name || index}`}
                            src={attendee.photoURL || EBTT_LOGO_SRC}
                            alt={attendee.name || 'Volunteer'}
                            title={attendee.name || 'Volunteer'}
                            className="h-8 w-8 rounded-full border-2 border-white object-cover"
                            style={{ zIndex: 10 - index }}
                          />
                        ))}
                      </div>
                    </div>

                    {communityEvent.details && <p className="mt-2 text-sm text-[#1B4332]/75">{communityEvent.details}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a
                        href={
                          communityEvent.trailMapUrl ||
                          buildGoogleMapsSearchUrl(
                            communityEvent.trailName,
                            normalizeCoordinates(communityEvent.trailCoordinates)
                          )
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B4332] underline decoration-[#52B788]/70 underline-offset-2"
                      >
                        📍 View on Google Maps
                      </a>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedEvent(communityEvent);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-[#D4A373]/35 bg-[#fff8f2] px-2.5 py-1.5 text-[11px] font-semibold text-[#1B4332] transition hover:bg-[#f7ece0]"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleShareContent({
                            title: communityEvent.title,
                            text: `Join me for ${communityEvent.title} in ${communityEvent.trailName}.`,
                            url: `${window.location.origin}${window.location.pathname}?event=${communityEvent.id}`,
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-[#52B788]/35 bg-[#eef9f2] px-2.5 py-1.5 text-[11px] font-semibold text-[#1B4332] transition hover:bg-[#e3f7ea]"
                      >
                        <Share2 size={12} />
                        Share Event
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selectedEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#112A1F]/60 p-4 backdrop-blur-sm">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#D4A373]/30 bg-[#F9FBF9] p-5 shadow-[0_24px_70px_rgba(17,42,31,0.22)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2D6A4F]">Volunteer event</p>
                    <h3 className="mt-1 text-2xl font-black text-[#112A1F]">{selectedEvent.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D4A373]/30 bg-white text-[#1B4332] transition hover:bg-[#f7f1e9]"
                    aria-label="Close event details"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#D4A373]/20 bg-white p-4">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B4332]">
                      <CalendarDays size={15} />
                      {formatTimestamp(selectedEvent.eventDate)}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm text-[#1B4332]/80">
                      <MapPin size={15} />
                      {selectedEvent.trailName}
                    </p>
                    <p className="mt-2 text-sm text-[#1B4332]/75">{selectedEvent.details || 'No detailed notes were provided for this event.'}</p>
                    <a
                      href={
                        selectedEvent.trailMapUrl ||
                        buildGoogleMapsSearchUrl(selectedEvent.trailName, normalizeCoordinates(selectedEvent.trailCoordinates))
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1B4332] underline decoration-[#52B788]/70 underline-offset-2"
                    >
                      <MapPin size={12} />
                      Open in Google Maps
                    </a>
                  </div>

                  <div className="rounded-2xl border border-[#D4A373]/20 bg-[#fffaf3] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2D6A4F]">Host & contacts</p>
                    <div className="mt-3 flex items-center gap-3">
                      <img
                        src={getMemberProfile(selectedEvent.organizerUid || selectedEvent.organizerName || 'demo-marcus-ranger').photoURL}
                        alt={selectedEvent.organizerName || 'Host'}
                        className="h-12 w-12 rounded-full border border-[#D4A373]/30 object-cover"
                      />
                      <div>
                        <p className="font-semibold text-[#1B4332]">{selectedEvent.organizerName || 'Community member'}</p>
                        <p className="text-xs text-[#1B4332]/70">Volunteer coordinator</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-[#1B4332]/80">
                      <a href={`mailto:${selectedEvent.hostContact?.email || selectedEvent.organizerName + '@eastbaytrailtracker.test'}`} className="inline-flex items-center gap-2 underline">
                        <Mail size={14} />
                        {selectedEvent.hostContact?.email || 'Message host'}
                      </a>
                      <a href={`tel:${(selectedEvent.hostContact?.phone || '').replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 underline">
                        <Phone size={14} />
                        {selectedEvent.hostContact?.phone || 'Call host'}
                      </a>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleRsvp(selectedEvent)}
                        className="rounded-lg bg-[#1B4332] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#22523f]"
                      >
                        {Array.isArray(selectedEvent.rsvpUserIds) && selectedEvent.rsvpUserIds.includes(user?.uid) ? 'Leave Event' : 'RSVP Now'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleShareContent({
                            title: selectedEvent.title,
                            text: `Join me for ${selectedEvent.title} on ${selectedEvent.trailName}.`,
                            url: `${window.location.origin}${window.location.pathname}?event=${selectedEvent.id}`,
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-[#52B788]/35 bg-[#eef9f2] px-3 py-2 text-xs font-semibold text-[#1B4332] transition hover:bg-[#e3f7ea]"
                      >
                        <Share2 size={14} />
                        Share Event
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#D4A373]/20 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#1B4332]">Attending volunteers</p>
                    <div className="inline-flex items-center gap-1 rounded-full border border-[#52B788]/35 bg-[#eef9f2] px-2 py-1 text-[11px] font-semibold text-[#1B4332]">
                      <Users size={12} />
                      {selectedEventAttendees.length}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {selectedEventAttendees.length > 0 ? (
                      selectedEventAttendees.map((attendee) => (
                        <div key={`${selectedEvent.id}-${attendee.uid || attendee.name}`} className="flex items-center gap-3 rounded-xl border border-[#D4A373]/20 bg-[#fafcfb] p-2">
                          <img
                            src={attendee.photoURL || 'https://ui-avatars.com/api/?name=Volunteer&background=1B4332&color=ffffff'}
                            alt={attendee.name || 'Volunteer'}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[#1B4332]">{attendee.name || 'Volunteer'}</p>
                            <p className="text-xs text-[#1B4332]/70">{attendee.role || 'Trail Volunteer'}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#1B4332]/70">No volunteers have RSVP’d yet. Be the first to join.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="organic-card border border-[rgba(139,94,60,0.3)] bg-[var(--ebtt-white)] p-5 shadow-sm">
            <h3 className="text-xl font-bold text-[var(--ebtt-deep-forest)]">Community Resources & Local Guides Finder</h3>
            <p className="mt-2 text-sm text-[var(--ebtt-slate)]">
              Curated directory of official ranger stations, regional parks, trailheads, and verified conservation and volunteer stewardship organizations.
            </p>

            <div className="mt-4 space-y-2">
              <label className="relative block">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#1B4332]/60" />
                <input
                  type="text"
                  value={resourceSearch}
                  onChange={(event) => {
                    const value = event.target.value;
                    setResourceSearch(value);
                    if (resourceSelectedLocation && resourceSelectedLocation.name !== value) {
                      setResourceSelectedLocation(null);
                    }
                    setShowResourceSuggestions(true);
                  }}
                  onFocus={() => setShowResourceSuggestions(true)}
                  onBlur={() => window.setTimeout(() => setShowResourceSuggestions(false), 120)}
                  placeholder="Search park names, ranger stations, trailheads, wilderness areas, and stewardship organizations"
                  className="input-field pl-9"
                />
              </label>

              {showResourceSuggestions && resourceLocationSearch.suggestions.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-[#D4A373]/30 bg-white shadow-sm">
                  {resourceLocationSearch.suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => {
                        setResourceSearch(suggestion.name);
                        setResourceSelectedLocation(suggestion);
                        setShowResourceSuggestions(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm text-[#1B4332] hover:bg-[#f5f8ef]"
                    >
                      {suggestion.displayName}
                    </button>
                  ))}
                </div>
              )}

              {resourceLocationSearch.loading && (
                <p className="text-xs text-[#1B4332]/70">Searching California trails and parks...</p>
              )}
              {resourceLocationSearch.error && <p className="text-xs text-[#8b2c2c]">{resourceLocationSearch.error}</p>}
            </div>

            {resourceSelectedLocation && (
              <a
                href={buildMapsSearchUrl(resourceSelectedLocation.name)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--ebtt-deep-forest)] underline decoration-[var(--ebtt-sky-blue)] underline-offset-2"
              >
                📍 View on Google Maps
              </a>
            )}

            <div className="mt-4 space-y-3">
              {groupedResources.length === 0 ? (
                <div className="rounded-xl border border-[rgba(139,94,60,0.25)] bg-[rgba(210,180,140,0.18)] p-3 text-xs text-[var(--ebtt-slate)]">
                  No matching resources yet. Try keywords like &quot;volunteer&quot;, &quot;ranger&quot;, &quot;park&quot;, &quot;watershed&quot;, &quot;trailhead&quot;, or specific names like &quot;Point Reyes&quot; and &quot;Mission Peak&quot;.
                </div>
              ) : (
                groupedResources.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <div className="rounded-xl border border-[rgba(139,94,60,0.2)] bg-[rgba(210,180,140,0.16)] px-3 py-2">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ebtt-deep-forest)]">{group.title}</p>
                      <p className="text-xs text-[var(--ebtt-slate)]">{group.description}</p>
                    </div>
                    {group.resources.map((resource) => (
                      <div key={resource.id} className="rounded-xl border border-[rgba(139,94,60,0.24)] bg-[rgba(210,180,140,0.2)] p-3">
                        <p className="text-sm font-semibold text-[var(--ebtt-deep-forest)]">{resource.name}</p>
                        <p className="text-xs font-medium text-[var(--ebtt-slate)]">{resource.type}</p>
                        <p className="mt-1 text-xs text-[var(--ebtt-slate)]">{resource.description}</p>
                        <p className="mt-1 text-xs text-[var(--ebtt-slate)]">{resource.address}</p>
                        <p className="text-xs text-[var(--ebtt-slate)]">
                          Phone:{' '}
                          <a href={`tel:${resource.phone.replace(/[^\d+]/g, '')}`} className="font-semibold underline">
                            {resource.phone}
                          </a>
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-[var(--ebtt-deep-forest)]">
                          <a href={resource.website} target="_blank" rel="noreferrer" className="underline">
                            Official Website
                          </a>
                          <a
                            href={buildMapsSearchUrl(
                              `${resource.mapQuery} ${resourceSelectedLocation?.name || 'East Bay California'}`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            📍 View on Google Maps
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 rounded-xl border border-[#D4A373]/35 bg-[#fff8f2] p-3">
              <h4 className="text-sm font-bold text-[#1B4332]">Shared East Bay Goals</h4>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[#1B4332]/80">
                {COMMUNITY_GOALS.map((goal) => (
                  <li key={goal}>{goal}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CommunityBoard;
