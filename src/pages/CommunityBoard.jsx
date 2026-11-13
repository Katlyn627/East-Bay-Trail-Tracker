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
  Trees,
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
    description: 'Official agency headquarters for East Bay Regional Park District maps, ranger services, and community support operations.',
    website: 'https://www.ebparks.org',
    phone: '(888) 327-2757',
    address: '2950 Peralta Oaks Ct, Oakland, CA 94605',
    mapQuery: 'East Bay Regional Park District headquarters Oakland',
    categories: ['regional parks', 'park headquarters', 'ranger services'],
    keywords: ['east bay', 'regional park district', 'ranger', 'park headquarters', 'park services'],
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
    description: 'Land conservation nonprofit with guided hikes, habitat restoration, and volunteer trail events.',
    website: 'https://savemountdiablo.org',
    phone: '(925) 947-3535',
    address: '1901 Olympic Blvd, Walnut Creek, CA 94596',
    mapQuery: 'Save Mount Diablo Walnut Creek',
    categories: ['conservation organization', 'volunteer events'],
    keywords: ['save mount diablo', 'volunteer', 'conservation', 'trail care'],
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
    description: 'Statewide parks advocacy and volunteer support programs for park access and community care.',
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
    description: 'Supports habitat restoration, shoreline cleanups, and community science volunteer efforts.',
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
    description: 'Official volunteer portal for habitat restoration, trail maintenance, and community volunteer projects.',
    website: 'https://www.ebparks.org/get-involved/volunteer',
    phone: '(510) 544-2229',
    address: '2950 Peralta Oaks Ct, Oakland, CA 94605',
    mapQuery: 'East Bay Regional Park District Volunteer Program',
    categories: ['volunteer organization', 'regional park volunteer program'],
    keywords: ['east bay volunteer', 'trail maintenance', 'community help', 'regional park'],
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
    description: 'Popular Mission Peak trailhead and staging area for volunteer hikes and community meetups.',
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
    description: 'Verified conservation, trail care, and community volunteer organizations.',
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
const EBTT_LOGO_SRC = '/ebtt-app-icon.png';

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
    <div className="space-y-8 pb-12">
      <section className="relative overflow-hidden organic-card bg-forest-gradient p-8 text-white shadow-xl">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sage-mist/80">Community coordination</p>
          <h2 className="mt-1 text-3xl font-heading font-black text-white leading-tight">Community Board & <br />Volunteer Events</h2>
          <p className="mt-2 max-w-2xl text-sm text-sage-mist/90 leading-relaxed">
            Broadcast trail updates, coordinate cleanup events, and mobilize volunteers with shared map-ready details.
          </p>
        </div>
        <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none">
          <Trees size={200} />
        </div>
      </section>

      {(boardError || boardSuccess) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
            boardError
              ? 'border-red-200 bg-white text-red-700'
              : 'border-forest/20 bg-white text-forest-deep'
          }`}
        >
          <div className={`p-2 rounded-full ${boardError ? 'bg-red-100' : 'bg-forest/10'}`}>
            <Leaf size={18} className={boardError ? 'text-red-600' : 'text-forest'} />
          </div>
          {boardError || boardSuccess}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="organic-card p-6">
            <h2 className="text-2xl font-heading text-forest-deep">Community Feed</h2>
            <p className="mt-2 text-sm text-forest-deep/70">
              Share trail conditions, cleanup wins, and operational notes with the East Bay volunteer network.
            </p>

            <form onSubmit={handleCreatePost} className="mt-6 grid gap-4">
              <input
                type="text"
                value={postForm.title}
                onChange={(event) => setPostForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Post title"
                className="nature-input"
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
                  className="nature-input"
                />
                {showPostSuggestions && postTrailSearch.suggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 max-h-48 w-full overflow-y-auto rounded-2xl border border-forest/10 bg-white shadow-xl">
                    {postTrailSearch.suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => {
                          setPostForm((prev) => ({ ...prev, trailName: suggestion.name }));
                          setPostSelectedLocation(suggestion);
                          setShowPostSuggestions(false);
                        }}
                        className="block w-full px-4 py-3 text-left text-sm text-forest-deep hover:bg-sage-mist transition-colors"
                      >
                        {suggestion.displayName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {postTrailSearch.loading && (
                <p className="text-xs text-forest-moss font-bold">Searching California trails...</p>
              )}

              {postForm.trailName && (
                <a
                  href={buildGoogleMapsSearchUrl(postForm.trailName, getSelectedCoordinates(postSelectedLocation, postForm.trailName))}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-forest underline decoration-forest/30 underline-offset-4"
                >
                  <MapPin size={12} /> View on Google Maps
                </a>
              )}

              <input
                type="text"
                value={postForm.trailTags}
                onChange={(event) => setPostForm((prev) => ({ ...prev, trailTags: event.target.value }))}
                placeholder="Additional trail tags (comma-separated)"
                className="nature-input"
              />

              <textarea
                rows={3}
                value={postForm.message}
                onChange={(event) => setPostForm((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Share field updates, route conditions, or notes..."
                className="nature-input"
              />

              <button
                type="submit"
                disabled={posting}
                className="btn-nature w-full sm:w-auto self-start flex items-center justify-center gap-2"
              >
                {posting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Share Post'
                )}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {loadingPosts ? (
              <div className="organic-card p-8 text-center text-forest-moss">
                <Loader2 size={32} className="animate-spin mx-auto mb-2 opacity-20" />
                <p>Loading community posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="organic-card p-8 text-center text-forest-moss">
                <p>No posts yet. Be the first to share a trail update.</p>
              </div>
            ) : (
              posts.map((post) => {
                const trailTags = Array.isArray(post.trailTags) && post.trailTags.length
                  ? post.trailTags
                  : post.trailName
                    ? [post.trailName]
                    : [];

                return (
                  <article key={post.id} className="organic-card p-5 group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                         <img
                           src={getMemberProfile(post.authorUid).photoURL}
                           className="w-10 h-10 rounded-full border-2 border-sage-mist object-cover shadow-sm"
                           alt=""
                         />
                         <div>
                           <h3 className="text-lg font-heading font-bold text-forest-deep">{post.title}</h3>
                           <p className="text-xs font-medium text-forest-moss">
                             {post.authorName || 'Community member'} · {formatTimestamp(post.createdAt)}
                           </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePostLike(post)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                            Array.isArray(post.likedBy) && user && post.likedBy.includes(user.uid)
                            ? 'bg-poppy/10 text-poppy border border-poppy/20'
                            : 'bg-sage-mist text-forest-moss border border-forest/5 hover:border-forest/20'
                          }`}
                        >
                          <Heart size={14} className={Array.isArray(post.likedBy) && user && post.likedBy.includes(user.uid) ? 'fill-current' : ''} />
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
                          className="p-2 rounded-full bg-sage-mist text-forest-moss hover:text-forest transition-colors border border-forest/5"
                        >
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>

                    {trailTags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {trailTags.map((tag) => (
                          <span
                            key={`${post.id}-${tag}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-forest/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-forest"
                          >
                            <MapPin size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-forest-deep/80">{post.message}</p>

                    <div className="mt-6 flex items-center justify-between border-t border-forest/5 pt-4">
                      <a
                        href={
                          post.trailMapUrl ||
                          buildGoogleMapsSearchUrl(post.trailName || post.title, normalizeCoordinates(post.trailCoordinates))
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-forest hover:underline underline-offset-4"
                      >
                        <Link2 size={14} />
                        View Map
                      </a>

                      <button
                        type="button"
                        onClick={() => setActiveThreadPostId((prev) => (prev === post.id ? null : post.id))}
                        className="inline-flex items-center gap-2 text-xs font-bold text-forest-moss hover:text-forest transition-colors"
                      >
                        <MessageCircle size={16} />
                        {activeThreadPostId === post.id ? 'Hide Discussion' : 'Join Discussion'}
                      </button>
                    </div>

                    {activeThreadPostId === post.id && (
                      <div className="mt-6 space-y-4 rounded-2xl bg-sage-mist/50 p-4 border border-forest/5 animate-in slide-in-from-top-2 duration-300">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-forest-moss">Discussion</h4>
                        {loadingComments ? (
                          <p className="text-xs text-forest-moss italic">Gathering responses...</p>
                        ) : (
                          <div className="space-y-4">
                            {rootComments.length === 0 ? (
                              <p className="text-xs text-forest-moss italic">No comments yet. Start the discussion below.</p>
                            ) : (
                              rootComments.map((comment) => (
                                <div key={comment.id} className="space-y-3">
                                  <div className="flex gap-3">
                                     <img
                                       src={getMemberProfile(comment.authorUid).photoURL}
                                       className="w-8 h-8 rounded-full border border-white object-cover"
                                       alt=""
                                     />
                                     <div className="flex-1 bg-white rounded-2xl rounded-tl-none p-3 shadow-sm border border-forest/5">
                                        <div className="flex items-start justify-between gap-2">
                                          <p className="text-[11px] font-bold text-forest-deep">
                                            {comment.authorName || 'Volunteer'} · {formatTimestamp(comment.createdAt)}
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => handleToggleCommentLike(comment)}
                                            className="text-forest-moss hover:text-poppy transition-colors"
                                          >
                                            <Heart size={12} className={Array.isArray(comment.likedBy) && user && comment.likedBy.includes(user.uid) ? 'fill-poppy text-poppy' : ''} />
                                          </button>
                                        </div>
                                        <p className="mt-1 text-sm text-forest-deep/80">{comment.message}</p>
                                     </div>
                                  </div>

                                  {/* Replies */}
                                  <div className="ml-11 space-y-3">
                                    {(repliesByParent[comment.id] || []).map((reply) => (
                                      <div key={reply.id} className="flex gap-2">
                                        <img
                                          src={getMemberProfile(reply.authorUid).photoURL}
                                          className="w-6 h-6 rounded-full border border-white object-cover"
                                          alt=""
                                        />
                                        <div className="flex-1 bg-forest/5 rounded-xl rounded-tl-none p-2 border border-forest/5">
                                          <p className="text-[10px] font-bold text-forest-deep">
                                            {reply.authorName || 'Volunteer'} · {formatTimestamp(reply.createdAt)}
                                          </p>
                                          <p className="text-xs text-forest-deep/70">{reply.message}</p>
                                        </div>
                                      </div>
                                    ))}

                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={replyDrafts[comment.id] || ''}
                                        onChange={(event) => setReplyDrafts((prev) => ({ ...prev, [comment.id]: event.target.value }))}
                                        placeholder="Write a reply..."
                                        className="nature-input py-2 text-xs"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleAddReply(comment.id)}
                                        disabled={submittingReplyTo === comment.id}
                                        className="btn-nature px-4 py-0 text-xs"
                                      >
                                        {submittingReplyTo === comment.id ? <Loader2 size={12} className="animate-spin" /> : 'Reply'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        <form onSubmit={handleAddComment} className="flex gap-3 pt-2">
                          <input
                            type="text"
                            value={commentDraft}
                            onChange={(event) => setCommentDraft(event.target.value)}
                            placeholder="Add your voice..."
                            className="nature-input py-2 text-sm"
                          />
                          <button
                            type="submit"
                            disabled={submittingComment}
                            className="btn-nature px-6"
                          >
                            {submittingComment ? '...' : 'Post'}
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

        <section className="space-y-6">
          <div className="organic-card p-6 bg-forest/5 border-dashed border-2 border-forest/20 shadow-none">
            <h3 className="text-xl font-heading text-forest-deep">Organize an Event</h3>
            <p className="mt-2 text-sm text-forest-deep/70">
              Host a cleanup or group hike. Coordinating our efforts doubles our impact.
            </p>

            <form onSubmit={handleCreateEvent} className="mt-6 grid gap-4">
              <input
                type="text"
                value={eventForm.title}
                onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Event title"
                className="nature-input"
              />
              <input
                type="date"
                value={toDateInputValue(eventForm.date)}
                onChange={(event) => setEventForm((prev) => ({ ...prev, date: event.target.value }))}
                className="nature-input"
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
                  className="nature-input"
                />
                {showEventSuggestions && eventTrailSearch.suggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 max-h-48 w-full overflow-y-auto rounded-2xl border border-forest/10 bg-white shadow-xl">
                    {eventTrailSearch.suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => {
                          setEventForm((prev) => ({ ...prev, trailName: suggestion.name }));
                          setEventSelectedLocation(suggestion);
                          setShowEventSuggestions(false);
                        }}
                        className="block w-full px-4 py-3 text-left text-sm text-forest-deep hover:bg-sage-mist"
                      >
                        {suggestion.displayName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                rows={2}
                value={eventForm.details}
                onChange={(event) => setEventForm((prev) => ({ ...prev, details: event.target.value }))}
                placeholder="Meetup point, supplies, and goals..."
                className="nature-input"
              />
              <button
                type="submit"
                disabled={creatingEvent}
                className="btn-poppy w-full flex items-center justify-center gap-2"
              >
                {creatingEvent ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Launch Event'
                )}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {loadingEvents ? (
              <div className="organic-card p-8 text-center text-forest-moss">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="organic-card p-8 text-center text-forest-moss bg-white/40">
                <p>No upcoming cleanup hikes. Lead the way!</p>
              </div>
            ) : (
              events.map((communityEvent) => {
                const joined = Array.isArray(communityEvent.rsvpUserIds) && communityEvent.rsvpUserIds.includes(user?.uid);
                const rsvpCount = Array.isArray(communityEvent.rsvpUserIds) ? communityEvent.rsvpUserIds.length : 0;

                return (
                  <div
                    key={communityEvent.id}
                    className="organic-card p-5 cursor-pointer"
                    onClick={() => setSelectedEvent(communityEvent)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <CalendarDays size={14} className="text-poppy" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-poppy">
                             {formatTimestamp(communityEvent.eventDate)}
                           </span>
                        </div>
                        <h4 className="text-lg font-heading font-bold text-forest-deep">{communityEvent.title}</h4>
                        <p className="text-xs text-forest-moss">Host: {communityEvent.organizerName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleRsvp(communityEvent);
                        }}
                        className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                          joined
                            ? 'bg-forest/10 text-forest border border-forest/20'
                            : 'bg-forest text-white shadow-md hover:bg-forest-deep'
                        }`}
                      >
                        {joined ? 'Attending' : 'Join'}
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-bold text-forest-deep/70">
                      <div className="flex items-center gap-2 bg-sage-mist px-3 py-2 rounded-xl">
                        <MapPin size={14} className="text-forest" />
                        <span className="truncate">{communityEvent.trailName}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-sage-mist px-3 py-2 rounded-xl">
                        <Users size={14} className="text-forest" />
                        <span>{rsvpCount} Joined</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                       <div className="flex -space-x-2">
                          {eventAttendeeProfiles(communityEvent).slice(0, 4).map((attendee, index) => (
                            <img
                              key={`${communityEvent.id}-${attendee.uid || index}`}
                              src={attendee.photoURL || EBTT_LOGO_SRC}
                              className="h-8 w-8 rounded-full border-2 border-white object-cover"
                              title={attendee.name}
                              alt=""
                            />
                          ))}
                          {rsvpCount > 4 && (
                            <div className="h-8 w-8 rounded-full bg-forest-moss text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                              +{rsvpCount - 4}
                            </div>
                          )}
                       </div>
                       <button
                         type="button"
                         className="text-xs font-bold text-forest-moss hover:text-forest transition-colors"
                       >
                         View Details
                       </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Event Detail Modal */}
          {selectedEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-organic border border-white/20 bg-sage-mist p-0 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="relative h-32 bg-forest-gradient">
                   <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <div className="absolute -bottom-8 left-8">
                     <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                        <CalendarDays size={32} className="text-poppy" />
                     </div>
                  </div>
                </div>

                <div className="px-8 pt-12 pb-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-3xl font-heading font-black text-forest-deep">{selectedEvent.title}</h3>
                      <p className="mt-1 font-bold text-forest flex items-center gap-2">
                        <MapPin size={16} /> {selectedEvent.trailName}
                      </p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-bold uppercase tracking-widest text-forest-moss">Event Date</p>
                       <p className="text-lg font-black text-forest-deep">{formatTimestamp(selectedEvent.eventDate)}</p>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <div className="organic-card p-6 bg-white/80">
                       <h4 className="text-sm font-bold uppercase tracking-widest text-forest-moss mb-3">Description</h4>
                       <p className="text-sm leading-relaxed text-forest-deep/80">
                         {selectedEvent.details || 'No additional details provided. Meet at the trailhead!'}
                       </p>
                       <div className="mt-6">
                         <a
                            href={selectedEvent.trailMapUrl || buildGoogleMapsSearchUrl(selectedEvent.trailName)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-nature inline-flex items-center gap-2"
                          >
                            <MapPin size={18} /> Get Directions
                          </a>
                       </div>
                    </div>

                    <div className="organic-card p-6 bg-white/80">
                       <h4 className="text-sm font-bold uppercase tracking-widest text-forest-moss mb-3">Host</h4>
                       <div className="flex items-center gap-4 mb-6">
                          <img
                            src={getMemberProfile(selectedEvent.organizerUid).photoURL}
                            className="h-12 w-12 rounded-full border-2 border-forest/10 object-cover"
                            alt=""
                          />
                          <div>
                            <p className="font-bold text-forest-deep">{selectedEvent.organizerName}</p>
                            <p className="text-xs text-forest-moss">Trail Coordinator</p>
                          </div>
                       </div>

                       <div className="space-y-3">
                         <button
                           onClick={() => handleToggleRsvp(selectedEvent)}
                           className={`w-full py-3 rounded-2xl font-bold transition-all ${
                             Array.isArray(selectedEvent.rsvpUserIds) && selectedEvent.rsvpUserIds.includes(user?.uid)
                             ? 'bg-forest/10 text-forest border border-forest/20'
                             : 'btn-poppy'
                           }`}
                         >
                            {Array.isArray(selectedEvent.rsvpUserIds) && selectedEvent.rsvpUserIds.includes(user?.uid) ? 'Cancel RSVP' : 'RSVP Now'}
                         </button>
                         <button
                           onClick={() => handleShareContent({ title: selectedEvent.title, url: window.location.href })}
                           className="w-full py-3 bg-sage-mist text-forest-deep font-bold rounded-2xl border border-forest/5 hover:bg-white transition-colors"
                         >
                           Invite Friends
                         </button>
                       </div>
                    </div>
                  </div>

                  <div className="mt-8">
                     <h4 className="text-sm font-bold uppercase tracking-widest text-forest-moss mb-4">Attending ({selectedEventAttendees.length})</h4>
                     <div className="flex flex-wrap gap-3">
                        {selectedEventAttendees.map((attendee) => (
                          <div key={attendee.uid} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-forest/5 shadow-sm">
                             <img src={attendee.photoURL} className="w-6 h-6 rounded-full object-cover" alt="" />
                             <span className="text-xs font-bold text-forest-deep">{attendee.name}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="organic-card p-6">
            <h3 className="text-xl font-heading text-forest-deep">Nature Directory</h3>
            <p className="mt-2 text-sm text-forest-deep/70">
              Verified ranger stations, conservation groups, and trailheads.
            </p>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-moss" />
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
                  placeholder="Search resources..."
                  className="nature-input pl-12"
                />
              </div>

              <div className="mt-6 space-y-6">
                {groupedResources.map((group) => (
                  <div key={group.id} className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-poppy flex items-center gap-2">
                       <span className="h-px flex-1 bg-poppy/20"></span>
                       {group.title}
                       <span className="h-px flex-1 bg-poppy/20"></span>
                    </h4>
                    {group.resources.map((resource) => (
                      <div key={resource.id} className="p-4 rounded-2xl bg-sage-mist/50 border border-forest/5 hover:bg-white hover:shadow-md transition-all">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-forest-deep leading-tight">{resource.name}</p>
                          <a href={resource.website} target="_blank" rel="noreferrer" className="text-forest hover:text-poppy">
                            <Link2 size={16} />
                          </a>
                        </div>
                        <p className="mt-1 text-[11px] font-medium text-forest-moss">{resource.type}</p>
                        <p className="mt-3 text-xs text-forest-deep/60 line-clamp-2">{resource.description}</p>
                        <div className="mt-4 flex items-center justify-between gap-2">
                           <a href={`tel:${resource.phone}`} className="text-xs font-bold text-forest-deep hover:text-forest transition-colors underline decoration-forest/20">
                             {resource.phone}
                           </a>
                           <a
                            href={buildMapsSearchUrl(resource.mapQuery)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-black uppercase tracking-tighter text-forest flex items-center gap-1"
                          >
                            <MapPin size={12} /> Map
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 bg-forest-gradient rounded-[2rem] p-6 text-white text-center relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-80">Season Goals</h4>
                <div className="space-y-3">
                  {COMMUNITY_GOALS.map((goal, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-left">
                       <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                          <Leaf size={12} className="text-gold" />
                       </div>
                       <p className="text-xs font-medium leading-tight">{goal}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-10">
                 <Trees size={100} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CommunityBoard;
