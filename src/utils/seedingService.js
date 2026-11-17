import { doc, setDoc, collection, addDoc, getDocs, query, where, serverTimestamp, increment, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEMO_USERS } from './mockData';

const SEED_FLAG_KEY = 'ebtt_data_seeded_v1';

export const seedApplicationData = async (force = false) => {
  if (!force && localStorage.getItem(SEED_FLAG_KEY)) {
    console.log('Data already seeded. Use force=true to re-seed.');
    return;
  }

  console.log('Starting comprehensive data seeding...');

  try {
    // 1. Seed User Profiles
    for (const user of DEMO_USERS) {
      await setDoc(doc(db, 'users', user.uid), {
        ...user,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    // 2. Seed Cleanup Logs (reports collection)
    const reportsRef = collection(db, 'reports');
    const cleanupSeeds = [
      {
        uid: 'demo-marcus-ranger',
        userEmail: 'ranger.marcus@eastbaytrailtracker.test',
        userName: 'Ranger Marcus',
        trailName: 'Tilden Regional Park',
        bagCount: 5,
        totalWeightLbs: 45.5,
        milesLogged: 4.2,
        totalHours: 3.5,
        notes: 'Cleared debris near the Brazilian Room and along Wildcat Creek trail.',
        type: 'cleanup',
        status: 'submitted',
        createdAt: new Date('2025-10-01T10:00:00Z'),
      },
      {
        uid: 'demo-marcus-ranger',
        userEmail: 'ranger.marcus@eastbaytrailtracker.test',
        userName: 'Ranger Marcus',
        trailName: 'Cull Canyon',
        bagCount: 8,
        totalWeightLbs: 62.0,
        milesLogged: 2.5,
        totalHours: 4.0,
        notes: 'Major dump site cleared near the staging area entrance.',
        type: 'cleanup',
        status: 'submitted',
        createdAt: new Date('2025-10-15T14:30:00Z'),
      },
      {
        uid: 'demo-katlyn-volunteer',
        userEmail: 'katlyn.volunteer@eastbaytrailtracker.test',
        userName: 'Volunteer Katlyn',
        trailName: 'Lake Merritt Loop',
        bagCount: 3,
        totalWeightLbs: 12.0,
        milesLogged: 3.1,
        totalHours: 2.0,
        notes: 'Mostly plastic bottles and food wrappers near the Pergola.',
        type: 'cleanup',
        status: 'submitted',
        createdAt: new Date('2025-10-05T09:00:00Z'),
      },
      {
        uid: 'demo-katlyn-volunteer',
        userEmail: 'katlyn.volunteer@eastbaytrailtracker.test',
        userName: 'Volunteer Katlyn',
        trailName: 'Dublin Hills Regional Park',
        bagCount: 4,
        totalWeightLbs: 28.5,
        milesLogged: 5.2,
        totalHours: 3.0,
        notes: 'Post-storm cleanup. Lots of microplastics washed onto the Calaveras Ridge trail.',
        type: 'cleanup',
        status: 'submitted',
        createdAt: new Date('2025-10-22T10:15:00Z'),
      },
      {
        uid: 'demo-elena-hiker',
        userEmail: 'elena.hiker@eastbaytrailtracker.test',
        userName: 'Hiker Elena',
        trailName: 'Mount Diablo Summit Trail',
        bagCount: 2,
        totalWeightLbs: 8.5,
        milesLogged: 6.8,
        totalHours: 5.0,
        notes: 'Picked up micro-trash along the summit approach. Windy but productive.',
        type: 'cleanup',
        status: 'submitted',
        createdAt: new Date('2025-10-12T14:00:00Z'),
      },
      {
        uid: 'demo-elena-hiker',
        userEmail: 'elena.hiker@eastbaytrailtracker.test',
        userName: 'Hiker Elena',
        trailName: 'Sycamore Grove Park',
        bagCount: 3,
        totalWeightLbs: 15.0,
        milesLogged: 3.5,
        totalHours: 2.5,
        notes: 'Cleaning up around the creek crossing. Found a lot of picnic debris.',
        type: 'cleanup',
        status: 'submitted',
        createdAt: new Date('2025-10-28T11:00:00Z'),
      }
    ];

    for (const seed of cleanupSeeds) {
      const q = query(reportsRef, where('uid', '==', seed.uid), where('notes', '==', seed.notes));
      const existing = await getDocs(q);
      if (existing.empty) {
        await addDoc(reportsRef, { ...seed, updatedAt: serverTimestamp() });
      }
    }

    // 3. Seed Issue Reports (trailReports collection)
    const trailReportsRef = collection(db, 'trailReports');
    const issueSeeds = [
      {
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
        uid: 'demo-marcus-ranger',
        issueType: 'overgrowth',
        trailName: 'Wildcat Canyon',
        description: 'Poison oak encroaching significantly on the Mezue Trail.',
        severity: 'medium',
        latitude: 37.9255,
        longitude: -122.2855,
        status: 'reported',
        createdAt: new Date('2025-10-18T09:00:00Z'),
      },
      {
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
        uid: 'demo-katlyn-volunteer',
        issueType: 'trash',
        trailName: 'Lake Merritt',
        description: 'Illegal dumping reported near the boating center.',
        severity: 'high',
        latitude: 37.8055,
        longitude: -122.2555,
        status: 'reported',
        createdAt: new Date('2025-10-25T13:20:00Z'),
      },
      {
        uid: 'demo-elena-hiker',
        issueType: 'mudslide',
        trailName: 'Pleasanton Ridge',
        description: 'Small slide blocking the Thermalito Trail about 1 mile in.',
        severity: 'high',
        latitude: 37.6655,
        longitude: -121.9055,
        status: 'reported',
        createdAt: new Date('2025-10-24T16:40:00Z'),
      }
    ];

    for (const seed of issueSeeds) {
      const q = query(trailReportsRef, where('uid', '==', seed.uid), where('description', '==', seed.description));
      const existing = await getDocs(q);
      if (existing.empty) {
        await addDoc(trailReportsRef, {
          ...seed,
          userEmail: DEMO_USERS.find(u => u.uid === seed.uid).email,
          userName: DEMO_USERS.find(u => u.uid === seed.uid).displayName,
          userPhotoURL: DEMO_USERS.find(u => u.uid === seed.uid).photoURL,
          upvotes: 5,
          updatedAt: serverTimestamp()
        });
      }
    }


    // 4. Seed Community Board Posts
    const postsRef = collection(db, 'communityPosts');
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
      await setDoc(doc(postsRef, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });

      // Add a dummy comment to each post
      const commentsRef = collection(db, 'communityPosts', id, 'comments');
      const existingComments = await getDocs(commentsRef);
      if (existingComments.empty) {
        await addDoc(commentsRef, {
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
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};
