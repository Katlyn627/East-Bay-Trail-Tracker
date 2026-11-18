import { doc, setDoc, collection, addDoc, getDocs, query, where, serverTimestamp, increment, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { DEMO_USERS } from './mockData';

const SEED_FLAG_KEY = 'ebtt_data_seeded_v6';

export const seedApplicationData = async (force = false) => {
  if (!force && localStorage.getItem(SEED_FLAG_KEY)) {
    console.log('Data already seeded (v6). Use force=true to re-seed.');
    return;
  }

  console.log('Starting comprehensive data seeding v6 (Force Update Mode)...');

  try {
    const batch = writeBatch(db);

    // 1. Seed User Profiles with rich activity
    for (const user of DEMO_USERS) {
      const userRef = doc(db, 'users', user.uid);
      batch.set(userRef, {
        ...user,
        totalBags: user.totalBags || 15,
        totalWeightLbs: user.totalWeightLbs || 105.2,
        totalMiles: user.totalMiles || 32.8,
        totalHours: user.totalHours || 24.5,
        pointsBalance: user.pointsBalance || 850,
        uniqueTrails: user.uniqueTrails || ['Tilden Regional Park', 'Redwood Regional Park', 'Joaquin Miller Park', 'Mount Diablo'],
        issuesReported: 3,
        cleanupsLogged: 8,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    // 2. Seed Cleanup Logs (reports collection)
    const cleanupSeeds = [
      {
        id: 'seed-cleanup-1',
        uid: 'demo-marcus-ranger',
        userEmail: 'ranger.marcus@eastbaytrailtracker.test',
        userName: 'Ranger Marcus',
        trailName: 'Tilden Regional Park',
        bagCount: 5,
        totalWeightLbs: 45.5,
        milesLogged: 4.2,
        totalHours: 3.5,
        notes: 'Cleared debris near the Brazilian Room and along Wildcat Creek trail.',
        issueType: 'trash',
        status: 'submitted',
        createdAt: new Date('2025-10-01T10:00:00Z'),
      },
      {
        id: 'seed-cleanup-2',
        uid: 'demo-katlyn-volunteer',
        userEmail: 'katlyn.volunteer@eastbaytrailtracker.test',
        userName: 'Volunteer Katlyn',
        trailName: 'Lake Merritt Loop',
        bagCount: 3,
        totalWeightLbs: 12.0,
        milesLogged: 3.1,
        totalHours: 2.0,
        notes: 'Mostly plastic bottles and food wrappers near the Pergola.',
        issueType: 'trash',
        status: 'submitted',
        createdAt: new Date('2025-10-05T09:00:00Z'),
      },
      {
        id: 'seed-cleanup-3',
        uid: 'demo-elena-hiker',
        userEmail: 'elena.hiker@eastbaytrailtracker.test',
        userName: 'Hiker Elena',
        trailName: 'Mount Diablo Summit Trail',
        bagCount: 2,
        totalWeightLbs: 8.5,
        milesLogged: 6.8,
        totalHours: 5.0,
        notes: 'Picked up micro-trash along the summit approach. Windy but productive.',
        issueType: 'trash',
        status: 'submitted',
        createdAt: new Date('2025-10-12T14:00:00Z'),
      },
      {
        id: 'seed-cleanup-4',
        uid: 'demo-katlyn-volunteer',
        userEmail: 'katlyn.volunteer@eastbaytrailtracker.test',
        userName: 'Volunteer Katlyn',
        trailName: 'Briones Regional Park',
        bagCount: 4,
        totalWeightLbs: 22.0,
        milesLogged: 5.2,
        totalHours: 4.0,
        notes: 'Spring cleaning around Bear Creek staging area.',
        issueType: 'trash',
        status: 'submitted',
        createdAt: new Date('2025-10-14T10:00:00Z'),
      },
      {
        id: 'seed-cleanup-5',
        uid: 'demo-marcus-ranger',
        userEmail: 'ranger.marcus@eastbaytrailtracker.test',
        userName: 'Ranger Marcus',
        trailName: 'Wildcat Canyon',
        bagCount: 6,
        totalWeightLbs: 38.0,
        milesLogged: 4.5,
        totalHours: 3.0,
        notes: 'Removed illegal dumping near the trailhead.',
        issueType: 'trash',
        status: 'submitted',
        createdAt: new Date('2025-10-16T15:00:00Z'),
      },
      {
        id: 'seed-cleanup-6',
        uid: 'demo-elena-hiker',
        userEmail: 'elena.hiker@eastbaytrailtracker.test',
        userName: 'Hiker Elena',
        trailName: 'Coyote Hills',
        bagCount: 2,
        totalWeightLbs: 5.0,
        milesLogged: 3.5,
        totalHours: 2.5,
        notes: 'Marsh cleanup. Found lots of plastic straw wrappers.',
        issueType: 'trash',
        status: 'submitted',
        createdAt: new Date('2025-10-17T11:00:00Z'),
      },
      {
        id: 'seed-cleanup-7',
        uid: 'demo-katlyn-volunteer',
        userEmail: 'katlyn.volunteer@eastbaytrailtracker.test',
        userName: 'Volunteer Katlyn',
        trailName: 'Anthony Chabot',
        bagCount: 4,
        totalWeightLbs: 28.0,
        milesLogged: 6.0,
        totalHours: 5.0,
        notes: 'Cleaning up around the campground area.',
        issueType: 'trash',
        status: 'submitted',
        createdAt: new Date('2025-10-19T09:00:00Z'),
      },
      {
        id: 'seed-cleanup-8',
        uid: 'demo-marcus-ranger',
        userEmail: 'ranger.marcus@eastbaytrailtracker.test',
        userName: 'Ranger Marcus',
        trailName: 'Morgan Territory',
        bagCount: 3,
        totalWeightLbs: 15.0,
        milesLogged: 5.5,
        totalHours: 4.0,
        notes: 'Routine sweep of the main loop.',
        issueType: 'trash',
        status: 'submitted',
        createdAt: new Date('2025-10-22T13:00:00Z'),
      }
    ];

    for (const seed of cleanupSeeds) {
      const { id, ...data } = seed;
      const reportRef = doc(db, 'reports', id);
      batch.set(reportRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    }

    // 3. Seed Issue Reports (trailReports collection)
    const issueSeeds = [
      {
        id: 'seed-issue-1',
        uid: 'demo-marcus-ranger',
        issueType: 'downed_tree',
        trailName: 'Redwood Regional Park',
        description: 'Large eucalyptus fell across West Ridge Trail, approx 0.5 miles from Skyline Gate.',
        severity: 'high',
        latitude: 37.8202,
        longitude: -122.1794,
        status: 'reported',
        createdAt: new Date('2025-10-15T08:30:00Z'),
      },
      {
        id: 'seed-issue-2',
        uid: 'demo-katlyn-volunteer',
        issueType: 'erosion',
        trailName: 'Joaquin Miller Park',
        description: 'Significant trail washout on Cinderella Trail after the heavy rains.',
        severity: 'medium',
        latitude: 37.8105,
        longitude: -122.1885,
        status: 'verified',
        createdAt: new Date('2025-10-18T11:45:00Z'),
      },
      {
        id: 'seed-issue-3',
        uid: 'demo-elena-hiker',
        issueType: 'trash',
        trailName: 'Mount Diablo',
        description: 'Large amount of construction debris dumped near the North Gate entrance.',
        severity: 'high',
        latitude: 37.9200,
        longitude: -121.9800,
        status: 'reported',
        createdAt: new Date('2025-10-26T10:00:00Z'),
      }
    ];

    for (const seed of issueSeeds) {
      const { id, ...data } = seed;
      const trailReportRef = doc(db, 'trailReports', id);
      const userData = DEMO_USERS.find(u => u.uid === seed.uid);
      batch.set(trailReportRef, {
        ...data,
        userEmail: userData.email,
        userName: userData.displayName,
        userPhotoURL: userData.photoURL,
        upvotes: 5,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    // 4. Seed Community Board Posts (6 posts)
    const postSeeds = [
      {
        id: 'seed-post-1',
        title: 'Dublin Hills Cleanup Success!',
        message: 'We had a great turnout at Dublin Hills Regional Park yesterday. The staging area is looking much cleaner. Watch out for some mud on the lower loops!',
        trailName: 'Dublin Hills Regional Park',
        trailTags: ['Dublin', 'Cleanup', 'Mud Alert'],
        authorUid: 'demo-katlyn-volunteer',
        authorName: 'Volunteer Katlyn',
        hearts: 15,
        likedBy: ['demo-marcus-ranger'],
        createdAt: new Date('2025-10-20T16:00:00Z'),
      },
      {
        id: 'seed-post-2',
        title: 'Ranger Note: Seasonal Closures',
        message: 'Friendly reminder that certain interior trails in Redwood Regional are closed for nesting season. Please respect the barriers.',
        trailName: 'Redwood Regional Park',
        trailTags: ['Ranger Alert', 'Redwood', 'Conservation'],
        authorUid: 'demo-marcus-ranger',
        authorName: 'Ranger Marcus',
        hearts: 42,
        likedBy: ['demo-katlyn-volunteer', 'demo-elena-hiker'],
        createdAt: new Date('2025-10-21T09:00:00Z'),
      },
      {
        id: 'seed-post-3',
        title: 'Found Keys at Iron Horse Trail',
        message: 'Found a set of Subaru keys near the San Ramon crossing. Handed them to the station on Bollinger Canyon Rd.',
        trailName: 'Iron Horse Regional Trail',
        trailTags: ['Lost & Found', 'San Ramon'],
        authorUid: 'demo-elena-hiker',
        authorName: 'Hiker Elena',
        hearts: 8,
        likedBy: [],
        createdAt: new Date('2025-10-22T17:30:00Z'),
      },
      {
        id: 'seed-post-4',
        title: 'Tri-Valley Meetup next Saturday',
        message: 'Join us for a casual hike and trash sweep at Sycamore Grove. Meet at the Wetmore Road entrance at 9 AM.',
        trailName: 'Sycamore Grove Park',
        trailTags: ['Meetup', 'Livermore', 'Tri-Valley'],
        authorUid: 'demo-katlyn-volunteer',
        authorName: 'Volunteer Katlyn',
        hearts: 22,
        likedBy: ['demo-elena-hiker'],
        createdAt: new Date('2025-10-23T12:00:00Z'),
      },
      {
        id: 'seed-post-5',
        title: 'Heavy Erosion at Pleasanton Ridge',
        message: 'The North Ridge trail has some deep ruts after the storm. Bikes should exercise extreme caution.',
        trailName: 'Pleasanton Ridge Regional Park',
        trailTags: ['Safety', 'Pleasanton', 'MTB'],
        authorUid: 'demo-elena-hiker',
        authorName: 'Hiker Elena',
        hearts: 19,
        likedBy: ['demo-marcus-ranger'],
        createdAt: new Date('2025-10-24T07:15:00Z'),
      },
      {
        id: 'seed-post-6',
        title: 'Volunteer Milestone!',
        message: 'Shoutout to our Tri-Valley team for reaching 500 bags collected this year! Amazing work everyone.',
        trailName: 'East Bay Trails',
        trailTags: ['Milestone', 'Celebration'],
        authorUid: 'demo-marcus-ranger',
        authorName: 'Ranger Marcus',
        hearts: 56,
        likedBy: ['demo-katlyn-volunteer', 'demo-elena-hiker'],
        createdAt: new Date('2025-10-25T15:00:00Z'),
      }
    ];

    for (const seed of postSeeds) {
      const { id, ...data } = seed;
      const postRef = doc(db, 'communityPosts', id);
      batch.set(postRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    }

    await batch.commit();

    // 5. Seed Comments (Subcollections)
    for (const seed of postSeeds) {
        const commentsRef = collection(db, 'communityPosts', seed.id, 'comments');

        // Add specific comments for v4 richness
        if (seed.id === 'seed-post-1') {
            batch.set(doc(commentsRef, 'comment-1'), {
                message: 'Wish I could have been there! The Dublin Hills are beautiful.',
                authorUid: 'demo-elena-hiker',
                authorName: 'Hiker Elena',
                createdAt: serverTimestamp(),
                likes: 3,
                likedBy: ['demo-marcus-ranger', 'demo-katlyn-volunteer']
            });
        }

        if (seed.id === 'seed-post-6') {
            batch.set(doc(commentsRef, 'comment-2'), {
                message: '500 bags! That is incredible. So proud of this community.',
                authorUid: 'demo-katlyn-volunteer',
                authorName: 'Volunteer Katlyn',
                createdAt: serverTimestamp(),
                likes: 12,
                likedBy: ['demo-marcus-ranger', 'demo-elena-hiker']
            });
        }

        const q = query(commentsRef, where('authorUid', '==', 'demo-marcus-ranger'));
        const snap = await getDocs(q);
        if (snap.empty) {
            batch.set(doc(commentsRef, 'generic-comment-' + seed.id), {
                message: 'Great update, thanks for sharing!',
                authorUid: 'demo-marcus-ranger',
                authorName: 'Ranger Marcus',
                createdAt: serverTimestamp(),
                likes: 2,
                likedBy: ['demo-katlyn-volunteer']
            });
        }
    }

    localStorage.setItem(SEED_FLAG_KEY, 'true');
    console.log('Seeding v6 completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};
