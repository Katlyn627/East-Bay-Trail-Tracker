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
import { CalendarDays, Loader2, MapPin, MessageCircle, Reply, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

const RESOURCE_PARTNERS = [
  {
    name: 'East Bay Regional Park District',
    type: 'Parks & Access',
    description: 'Trail maps, maintenance notices, and stewardship volunteer opportunities.',
  },
  {
    name: 'Friends of Five Creeks',
    type: 'Conservation Group',
    description: 'Habitat restoration projects and watershed cleanup collaborations.',
  },
  {
    name: 'Bay Area Tool Share Network',
    type: 'Tool-Sharing',
    description: 'Community loaner tools for trail litter pickup and invasive removal.',
  },
];

const COMMUNITY_GOALS = [
  'Log 500 cleanup bags across East Bay trails this season',
  'Host at least 6 weekend cleanup hikes this quarter',
  'Increase new volunteer participation by 25%',
];

const formatTimestamp = (value) => {
  if (!value) return 'Just now';

  try {
    if (typeof value?.toDate === 'function') {
      return value.toDate().toLocaleString();
    }
    return new Date(value).toLocaleString();
  } catch {
    return 'Just now';
  }
};

const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

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
  const [postForm, setPostForm] = useState({ title: '', message: '', trailName: '' });
  const [commentDraft, setCommentDraft] = useState('');
  const [eventForm, setEventForm] = useState({ title: '', date: '', trailName: '', details: '' });

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
    const commentsQuery = query(
      collection(db, 'communityPosts', activeThreadPostId, 'comments'),
      orderBy('createdAt', 'asc')
    );
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

  const rootComments = useMemo(
    () => comments.filter((entry) => !entry.parentCommentId),
    [comments]
  );

  const repliesByParent = useMemo(() => {
    const map = {};
    comments.forEach((entry) => {
      if (!entry.parentCommentId) return;
      if (!map[entry.parentCommentId]) map[entry.parentCommentId] = [];
      map[entry.parentCommentId].push(entry);
    });
    return map;
  }, [comments]);

  const setTransientMessage = (type, message) => {
    if (type === 'error') {
      setBoardError(message);
    } else {
      setBoardSuccess(message);
    }

    window.setTimeout(() => {
      if (type === 'error') {
        setBoardError('');
      } else {
        setBoardSuccess('');
      }
    }, 2600);
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

    try {
      setPosting(true);
      await addDoc(collection(db, 'communityPosts'), {
        title: postForm.title.trim(),
        message: postForm.message.trim(),
        trailName: postForm.trailName.trim(),
        authorUid: user.uid,
        authorName: boardDisplayName,
        createdAt: serverTimestamp(),
      });

      setPostForm({ title: '', message: '', trailName: '' });
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
      await addDoc(collection(db, 'communityEvents'), {
        title: eventForm.title.trim(),
        eventDate: eventForm.date,
        trailName: eventForm.trailName.trim(),
        details: eventForm.details.trim(),
        organizerUid: user.uid,
        organizerName: boardDisplayName,
        rsvpUserIds: [user.uid],
        createdAt: serverTimestamp(),
      });

      setEventForm({ title: '', date: '', trailName: '', details: '' });
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

  return (
    <div className="space-y-6">
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
          <div className="rounded-2xl border border-[#D4A373]/30 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-bold text-[#1B4332]">Community Feed & Message Board</h2>
            <p className="mt-2 text-sm text-[#1B4332]/75">
              Share trail conditions, celebrate wins, and coordinate local stewardship efforts.
            </p>

            <form onSubmit={handleCreatePost} className="mt-4 grid gap-3">
              <input
                type="text"
                value={postForm.title}
                onChange={(event) => setPostForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Post title (e.g., Redwood trailhead cleanup update)"
                className="input-field"
              />
              <input
                type="text"
                value={postForm.trailName}
                onChange={(event) => setPostForm((prev) => ({ ...prev, trailName: event.target.value }))}
                placeholder="Trail / Park"
                className="input-field"
              />
              <textarea
                rows={3}
                value={postForm.message}
                onChange={(event) => setPostForm((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Share an update, ask for support, or post a field note..."
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
              posts.map((post) => (
                <article key={post.id} className="rounded-2xl border border-[#D4A373]/25 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#1B4332]">{post.title}</h3>
                      <p className="text-xs text-[#1B4332]/65">
                        {post.authorName || 'Community member'} · {formatTimestamp(post.createdAt)}
                      </p>
                    </div>
                    {post.trailName && (
                      <span className="rounded-full border border-[#52B788]/40 bg-[#eef9f2] px-2 py-1 text-xs font-semibold text-[#1B4332]">
                        {post.trailName}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-[#1B4332]/80">{post.message}</p>

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
                                <p className="text-xs font-semibold text-[#1B4332]">
                                  {comment.authorName || 'Volunteer'} · {formatTimestamp(comment.createdAt)}
                                </p>
                                <p className="mt-1 text-sm text-[#1B4332]/80">{comment.message}</p>

                                <div className="mt-2 space-y-2">
                                  {(repliesByParent[comment.id] || []).map((reply) => (
                                    <div key={reply.id} className="rounded-md border border-[#52B788]/25 bg-[#eef9f2] px-2 py-1.5">
                                      <p className="text-[11px] font-semibold text-[#1B4332]">
                                        {reply.authorName || 'Volunteer'} · {formatTimestamp(reply.createdAt)}
                                      </p>
                                      <p className="text-xs text-[#1B4332]/80">{reply.message}</p>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-2 flex gap-2">
                                  <input
                                    type="text"
                                    value={replyDrafts[comment.id] || ''}
                                    onChange={(event) =>
                                      setReplyDrafts((prev) => ({ ...prev, [comment.id]: event.target.value }))
                                    }
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
              ))
            )}
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-2xl border border-[#D4A373]/30 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-bold text-[#1B4332]">Volunteer Events & Cleanup Hikes</h3>
            <p className="mt-2 text-sm text-[#1B4332]/75">
              Organize weekend cleanups and let volunteers RSVP directly.
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
              <input
                type="text"
                value={eventForm.trailName}
                onChange={(event) => setEventForm((prev) => ({ ...prev, trailName: event.target.value }))}
                placeholder="Trail location"
                className="input-field"
              />
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
                  <div key={communityEvent.id} className="rounded-2xl border border-[#D4A373]/25 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-[#1B4332]">{communityEvent.title}</h4>
                        <p className="text-xs text-[#1B4332]/65">Organized by {communityEvent.organizerName || 'Community member'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleRsvp(communityEvent)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          joined
                            ? 'border border-[#D4A373]/40 bg-[#fff8f2] text-[#1B4332] hover:bg-[#f7ece0]'
                            : 'bg-[#1B4332] text-white hover:bg-[#22523f]'
                        }`}
                      >
                        {joined ? 'Leave Event' : 'Join Event'}
                      </button>
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
                    {communityEvent.details && <p className="mt-2 text-sm text-[#1B4332]/75">{communityEvent.details}</p>}
                  </div>
                );
              })
            )}
          </div>

          <div className="rounded-2xl border border-[#D4A373]/30 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-bold text-[#1B4332]">Community Resources & Local Goals</h3>
            <div className="mt-4 space-y-3">
              {RESOURCE_PARTNERS.map((partner) => (
                <div key={partner.name} className="rounded-xl border border-[#52B788]/25 bg-[#eef9f2] p-3">
                  <p className="text-sm font-semibold text-[#1B4332]">{partner.name}</p>
                  <p className="text-xs font-medium text-[#1B4332]/70">{partner.type}</p>
                  <p className="mt-1 text-xs text-[#1B4332]/75">{partner.description}</p>
                </div>
              ))}
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
