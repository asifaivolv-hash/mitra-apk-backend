import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Notice } from '../models/Notice';
import { Event } from '../models/Event';
import { Listing } from '../models/Listing';
import { Helpline } from '../models/Helpline';
import { CommitteeMember } from '../models/CommitteeMember';
import { Discussion } from '../models/Discussion';
import { SocietySetting } from '../models/SocietySetting';
import { Community } from '../models/Community';
import { Complaint } from '../models/Complaint';
import { AdPoster } from '../models/AdPoster';

export const seedInitialData = async (force: boolean = false): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[Seed] Database not connected. Skipping seed.');
      return;
    }

    const shouldForce = force || process.env.FORCE_SEED === 'true' || process.argv.includes('--force');

    if (shouldForce) {
      console.log('[Seed] Force flag detected. Resetting database collections...');
      await mongoose.connection.collection('complaints').drop().catch(() => {});
      await Promise.all([
        User.deleteMany({}),
        Notice.deleteMany({}),
        Event.deleteMany({}),
        Listing.deleteMany({}),
        Helpline.deleteMany({}),
        CommitteeMember.deleteMany({}),
        Discussion.deleteMany({}),
        SocietySetting.deleteMany({}),
        Community.deleteMany({}),
        Complaint.deleteMany({}),
        AdPoster.deleteMany({}),
      ]);
    } else {
      const userCount = await User.countDocuments();
      if (userCount > 0) {
        console.log('[Seed] Database already contains records. Skipping initial seeding.');
        return;
      }
    }

    console.log('[Seed] Seeding initial verified Mitra data...');

    const salt = await bcrypt.genSalt(10);
    const centralPasswordHash = await bcrypt.hash('Central@123456', salt);
    const adminPasswordHash = await bcrypt.hash('Admin@123456', salt);
    const managerPasswordHash = await bcrypt.hash('Mitra@123456', salt);
    const residentPasswordHash = await bcrypt.hash('Resident@123', salt);

    // 1. Seed Communities (Multi-Community Platform)
    const greenwoodCommunity = await Community.create({
      name: 'Greenwood Heights Society',
      code: 'GWH',
      city: 'Hyderabad',
      address: 'Financial District, Nanakramguda, Hyderabad, Telangana',
      totalUnits: 520,
      status: 'active',
      bannerImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
    });

    const palmMeadowsCommunity = await Community.create({
      name: 'Palm Meadows Residency',
      code: 'PMR',
      city: 'Bangalore',
      address: 'Whitefield Main Road, Bangalore, Karnataka',
      totalUnits: 340,
      status: 'active',
      bannerImage: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1200&q=80',
    });

    const cyberValleyCommunity = await Community.create({
      name: 'Cyber Valley Towers',
      code: 'CVT',
      city: 'Pune',
      address: 'Hinjewadi Phase 1, Pune, Maharashtra',
      totalUnits: 450,
      status: 'active',
      bannerImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
    });

    // 2. Seed Users across all 4 Roles
    // Role 1: Central Admin (Super Admin)
    const centralAdmin = await User.create({
      name: 'Central Platform Admin',
      email: 'centraladmin@mitra.org',
      phone: '+91 98000 00000',
      passwordHash: centralPasswordHash,
      role: 'superadmin',
      designation: 'Central Operations Director',
      unit: { block: 'HQ Central', flat: 'Suite 100' },
      status: 'active',
      privacy: { hidePhone: false, allowProxyCalls: true },
    });

    // Role 2: Society Admin (Handles Ads & Creates Community Managers)
    const adminUser = await User.create({
      name: 'Mitra Estate Admin',
      email: 'admin@mitra.org',
      phone: '+91 98000 00001',
      passwordHash: adminPasswordHash,
      communityId: greenwoodCommunity._id,
      role: 'admin',
      designation: 'Estate Administration Lead',
      unit: { block: 'Block A', flat: '101' },
      status: 'active',
      privacy: { hidePhone: false, allowProxyCalls: true },
    });

    // Link admin to community
    await Community.findByIdAndUpdate(greenwoodCommunity._id, { adminId: adminUser._id });

    // Role 3: Community Managers (Add members, post events/programs, manage complaints)
    const secretaryUser = await User.create({
      name: 'Priya Sharma',
      email: 'priya.sharma@greenwoodheights.org',
      phone: '+91 98000 00002',
      passwordHash: managerPasswordHash,
      communityId: greenwoodCommunity._id,
      role: 'community_manager',
      designation: 'Secretary & Community Manager',
      managedBy: adminUser._id,
      unit: { block: 'Block B', flat: '705' },
      status: 'active',
      privacy: { hidePhone: true, allowProxyCalls: true },
    });

    const presidentUser = await User.create({
      name: 'Rahul Kumar',
      email: 'rahul.kumar@greenwoodheights.org',
      phone: '+91 98000 00003',
      passwordHash: managerPasswordHash,
      communityId: greenwoodCommunity._id,
      role: 'community_manager',
      designation: 'Managing Committee President',
      managedBy: adminUser._id,
      unit: { block: 'Block A', flat: '402' },
      status: 'active',
      privacy: { hidePhone: true, allowProxyCalls: true },
    });

    // Role 4: Related Community Members (Residents)
    const resident1 = await User.create({
      name: 'Sunil Mehta',
      email: 'sunil.mehta@example.com',
      phone: '+91 98000 00004',
      passwordHash: residentPasswordHash,
      communityId: greenwoodCommunity._id,
      unit: { block: 'Block B', flat: '402' },
      role: 'resident',
      status: 'active',
      privacy: { hidePhone: true, allowProxyCalls: true },
    });

    const resident2 = await User.create({
      name: 'Ananya Deshmukh',
      email: 'ananya.deshmukh@example.com',
      phone: '+91 98000 00005',
      passwordHash: residentPasswordHash,
      communityId: greenwoodCommunity._id,
      unit: { block: 'Block C', flat: '1102' },
      role: 'resident',
      status: 'active',
      privacy: { hidePhone: true, allowProxyCalls: true },
    });

    const resident3 = await User.create({
      name: 'Manish S.',
      email: 'manish.s@example.com',
      phone: '+91 98000 00006',
      passwordHash: residentPasswordHash,
      communityId: greenwoodCommunity._id,
      unit: { block: 'Block A', flat: '204' },
      role: 'resident',
      status: 'active',
      privacy: { hidePhone: true, allowProxyCalls: true },
    });

    // 2. Seed Society Settings
    await SocietySetting.create({
      societyName: 'Greenwood Heights Society',
      tagline: 'Stronger Together',
      address: 'Financial District, Nanakramguda, Hyderabad',
      city: 'Hyderabad',
      totalFlats: 520,
      adBanner: {
        enabled: true,
        badgeText: 'YOUR AD HERE',
        title: 'Reach 500+ Families in your Community',
        subtitle: 'Promote local businesses and services directly to verified neighbours.',
        ctaText: 'Post Ad Now',
        targetUrl: '/classifieds',
      },
      contactEmail: 'office@greenwoodheights.org',
      contactPhone: '+91 40 2345 6789',
    });

    // 3. Seed Notices
    await Notice.create([
      {
        title: 'Garden Maintenance Work',
        content:
          'Garden maintenance will be done on 18th May (Sunday) from 6 AM to 10 AM. Lawns will be aerated and sprinkler lines serviced across Central Courtyard.',
        category: 'Colony Announcement',
        priority: 'normal',
        author: 'Greenwood Heights Management Committee',
        image: 'https://images.unsplash.com/photo-1558904541-efa8c4a08931?w=600&auto=format&fit=crop&q=80',
        isPinned: true,
        publishedAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        title: 'Annual General Body Meeting (AGM) Scheduled',
        content:
          'The Management Committee requests all homeowners to attend the AGM at the Clubhouse to review annual audits, budget allocations, and upcoming development plans.',
        category: 'Community Notice',
        priority: 'urgent',
        author: 'Rahul Kumar (President)',
        image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80',
        isPinned: true,
        publishedAt: new Date(Date.now() - 3600000 * 24),
      },
      {
        title: 'Elevator Modernization & Periodic Safety Inspection',
        content:
          'Scheduled servicing for Passenger Lift #2 in Tower B will take place between 10:00 AM and 2:00 PM. Alternate service elevator is fully operational.',
        category: 'Maintenance Update',
        priority: 'normal',
        author: 'Estate Manager desk',
        image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
        isPinned: false,
        publishedAt: new Date(Date.now() - 3600000 * 48),
      },
      {
        title: 'Tree Plantation & Balcony Composting Workshop',
        content:
          'Join fellow residents and kids this Sunday at the central green lawn. We will be planting 60 native saplings and introducing balcony composting kits.',
        category: 'Upcoming Activity',
        priority: 'normal',
        author: 'Green Mitra Club',
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
        isPinned: false,
        publishedAt: new Date(Date.now() - 3600000 * 72),
      },
    ]);

    // 4. Seed Events
    await Event.create([
      {
        title: 'Grand Diwali Cultural Utsav 2026',
        type: 'Festival Celebration',
        category: 'Celebration',
        date: 'Sat, Oct 28, 2026',
        time: '6:30 PM - 10:00 PM',
        location: 'Central Amphitheatre & Lawns',
        description:
          'Join all 500+ families for a night of cultural dances, music performances, food stalls, and eco-friendly fireworks celebration.',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        maxSlots: 200,
        rsvps: [resident1._id, resident2._id, secretaryUser._id],
      },
      {
        title: 'Inter-Block Badminton Championship',
        type: 'Sports Event',
        category: 'Sports',
        date: 'Sun, Nov 2, 2026',
        time: '8:00 AM - 1:00 PM',
        location: 'Clubhouse Indoor Badminton Courts',
        description:
          'Annual badminton tournament for men, women and junior residents. Singles and doubles formats with exciting prizes.',
        image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80',
        maxSlots: 64,
        rsvps: [resident1._id, resident3._id],
      },
      {
        title: 'RWA Quarterly Open House & Budget Review',
        type: 'Residents Meeting',
        category: 'Meeting',
        date: 'Sat, Nov 8, 2026',
        time: '10:00 AM - 12:30 PM',
        location: 'Community Multi-Purpose Hall A',
        description:
          'Quarterly review of estate maintenance accounts, water recycling plant status, and open floor discussion for all residents.',
        image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&auto=format&fit=crop&q=80',
        maxSlots: 150,
        rsvps: [presidentUser._id, secretaryUser._id],
      },
      {
        title: 'Junior Pottery & Creative Arts Workshop',
        type: 'Kids Activity',
        category: 'Kids',
        date: 'Wed, Nov 12, 2026',
        time: '4:00 PM - 6:00 PM',
        location: 'Children Activity Studio',
        description:
          'Interactive pottery wheel experience and acrylic painting class for society children aged 5 to 14. Materials provided.',
        image: 'https://images.unsplash.com/photo-1560421683-680b93824041?w=600&auto=format&fit=crop&q=80',
        maxSlots: 40,
        rsvps: [resident2._id],
      },
    ]);

    // 5. Seed Classifieds
    await Listing.create([
      {
        title: 'Solid Teak 6-Seater Dining Table',
        type: 'Buy',
        category: 'Furniture',
        price: '₹14,500',
        condition: 'Excellent Condition',
        location: 'Block B • Flat 804',
        sellerId: resident1._id,
        sellerName: 'Rohit Verma',
        contactType: 'proxy_call',
        image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&auto=format&fit=crop&q=80',
        verified: true,
        status: 'active',
      },
      {
        title: 'IFB 7kg Front Load Washing Machine',
        type: 'Buy',
        category: 'Home Appliances',
        price: '₹11,200',
        condition: '2 Yrs Used • Under AMC',
        location: 'Block C • Flat 1102',
        sellerId: resident2._id,
        sellerName: 'Ananya Deshmukh',
        contactType: 'proxy_call',
        image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80',
        verified: true,
        status: 'active',
      },
      {
        title: 'Professional Deep Home Cleaning & Sofa Sanitization',
        type: 'Services',
        category: 'Local Services',
        price: 'From ₹1,299',
        condition: 'Society Verified Vendor',
        location: 'Dedicated Community Service',
        sellerId: adminUser._id,
        sellerName: 'SparklePro Services',
        contactType: 'in_app_chat',
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
        verified: true,
        status: 'active',
      },
      {
        title: 'Decathlon Rockrider Kids MTB Cycle (Age 7-11)',
        type: 'Buy',
        category: 'Used Items',
        price: '₹3,400',
        condition: 'Good • New Tyres',
        location: 'Block A • Flat 204',
        sellerId: resident3._id,
        sellerName: 'Manish S.',
        contactType: 'proxy_call',
        image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
        verified: true,
        status: 'active',
      },
    ]);

    // 6. Seed Helplines
    await Helpline.create([
      {
        title: 'Main Gate Security',
        subtitle: 'Guard Post 1 & 2 • 24x7 Intercom',
        extension: 'Ext. 101 / 102',
        phoneNumber: '+91 98000 00101',
        category: 'security',
        tag: 'Immediate Response',
        tagColor: 'bg-blue-50 text-[#060E57]',
        callButtonColor: 'bg-[#060E57] hover:bg-[#1684F3]',
        priority: 1,
      },
      {
        title: 'Facility & Maintenance',
        subtitle: 'Electrician, Plumbing & Lift Support',
        extension: 'Ext. 204 (24 Hours)',
        phoneNumber: '+91 98000 00204',
        category: 'maintenance',
        tag: '24/7 Support',
        tagColor: 'bg-green-50 text-[#4E9B2A]',
        callButtonColor: 'bg-[#4E9B2A] hover:bg-emerald-700',
        priority: 2,
      },
      {
        title: 'Local Police Station',
        subtitle: 'Jurisdiction Police Control Room',
        extension: '',
        phoneNumber: '112',
        category: 'emergency',
        tag: 'Emergency Desk',
        tagColor: 'bg-red-50 text-red-600',
        callButtonColor: 'bg-red-600 hover:bg-red-700',
        priority: 3,
      },
      {
        title: 'Medical Emergency Tie-Up',
        subtitle: 'Emergency Ambulance & Doctor on Call',
        extension: '',
        phoneNumber: '108',
        category: 'emergency',
        tag: 'Critical Care',
        tagColor: 'bg-rose-50 text-rose-600',
        callButtonColor: 'bg-rose-600 hover:bg-rose-700',
        priority: 4,
      },
      {
        title: 'Fire & Rescue Service',
        subtitle: 'Regional Fire Station Control',
        extension: '',
        phoneNumber: '101',
        category: 'emergency',
        tag: 'Fire Station',
        tagColor: 'bg-orange-50 text-orange-600',
        callButtonColor: 'bg-[#F99D1C] hover:bg-orange-600',
        priority: 5,
      },
      {
        title: 'Community Office (RWA)',
        subtitle: 'Administration & Estate Manager',
        extension: 'Ext. 100 • 9 AM - 6 PM',
        phoneNumber: '+91 40 2345 6789',
        category: 'admin',
        tag: 'Estate Admin',
        tagColor: 'bg-slate-100 text-slate-700',
        callButtonColor: 'bg-slate-800 hover:bg-[#060E57]',
        priority: 6,
      },
    ]);

    // 7. Seed Committee Members
    await CommitteeMember.create([
      {
        role: 'President',
        name: 'Rahul Kumar',
        unit: 'Block A - Flat 402',
        tenure: 'Tenure: 2025 – 2027',
        focus: 'Society Governance & Statutory Compliances',
        phoneNumber: '+91 98000 00003',
        email: 'president@greenwoodheights.org',
        initials: 'RK',
        avatarBg: 'bg-[#060E57]',
        badgeColor: 'bg-blue-100 text-[#060E57]',
        displayOrder: 1,
      },
      {
        role: 'General Secretary',
        name: 'Priya Sharma',
        unit: 'Block B - Flat 705',
        tenure: 'Tenure: 2025 – 2027',
        focus: 'Resident Communications & Event Operations',
        phoneNumber: '+91 98000 00002',
        email: 'secretary@greenwoodheights.org',
        initials: 'PS',
        avatarBg: 'bg-[#8E10D8]',
        badgeColor: 'bg-purple-100 text-[#8E10D8]',
        displayOrder: 2,
      },
      {
        role: 'Treasurer',
        name: 'Arjun Reddy',
        unit: 'Block C - Flat 301',
        tenure: 'Tenure: 2025 – 2027',
        focus: 'Society Accounts, Audits & Sinking Fund',
        phoneNumber: '+91 98000 00007',
        email: 'treasurer@greenwoodheights.org',
        initials: 'AR',
        avatarBg: 'bg-[#4E9B2A]',
        badgeColor: 'bg-green-100 text-[#4E9B2A]',
        displayOrder: 3,
      },
      {
        role: 'Facility Lead',
        name: 'Vikram Malhotra',
        unit: 'Block D - Flat 1104',
        tenure: 'Tenure: 2025 – 2027',
        focus: 'Facility AMC, Security & Landscaping',
        phoneNumber: '+91 98000 00008',
        email: 'facility@greenwoodheights.org',
        initials: 'VM',
        avatarBg: 'bg-[#F99D1C]',
        badgeColor: 'bg-orange-100 text-[#F99D1C]',
        displayOrder: 4,
      },
    ]);

    // 8. Seed Discussions
    await Discussion.create([
      {
        authorId: resident1._id,
        authorName: 'Sunil Mehta',
        unit: 'Block B - 402',
        title: 'Water supply update — Tank 2 Pressure',
        content:
          'Good news neighbours! Overhead water tank #2 valve replacement was finished by the estate team this morning. Water pressure in Block B & C is back to optimal levels. Huge thanks to the maintenance crew!',
        tag: 'Water & Utilities',
        likes: [resident2._id, secretaryUser._id],
        comments: [
          {
            authorId: resident2._id,
            authorName: 'Ananya Deshmukh',
            unit: 'Block C - 1102',
            content: 'Confirmed! Water pressure on the 11th floor is back to normal now. Thanks for the quick update Sunil.',
            createdAt: new Date(Date.now() - 1800000),
          },
        ],
      },
      {
        authorId: resident2._id,
        authorName: 'Anjali Deshmukh',
        unit: 'Block C - 1102',
        title: 'Weekend community event — Badminton Doubles Partners?',
        content:
          'Anyone looking for a partner for the upcoming doubles badminton tournament this Saturday? I play at intermediate level and usually practice between 7 AM to 8 AM. Drop a reply!',
        tag: 'Sports & Fitness',
        likes: [resident1._id],
        comments: [],
      },
      {
        authorId: adminUser._id,
        authorName: 'Security Post #1',
        unit: 'Estate Admin Desk',
        title: 'Lost & found — Blue Keychain with Honda key',
        content:
          "A blue woven lanyard with a two-wheeler key was discovered near the Children's Sandpit bench around 4 PM. Resident owner can collect it from the Security Office at Tower A lobby after verification.",
        tag: 'Lost & Found',
        likes: [resident3._id],
        comments: [],
      },
    ]);

    // 8. Seed Complaints (Module 3: Resident Complaints)
    await Complaint.create([
      {
        title: 'Elevator #2 in Block B making squeaking vibration',
        description: 'Between 5th and 8th floor the lift makes an abnormal shuddering sound. Needs technician inspection before weekend.',
        category: 'Maintenance',
        priority: 'high',
        status: 'in_progress',
        communityId: greenwoodCommunity._id,
        userId: resident1._id,
        userName: resident1.name,
        userPhone: resident1.phone,
        unit: { block: 'Block B', flat: '402' },
        assignedTo: 'Johnson Lifts AMC Team',
        resolutionNotes: 'AMC technician dispatched; bearings being checked.',
      },
      {
        title: 'Streetlight flickering outside Gate 3 pathway',
        description: 'The pole light near pedestrian gate 3 is completely dark and flickers intermittently at night.',
        category: 'Electrical',
        priority: 'medium',
        status: 'pending',
        communityId: greenwoodCommunity._id,
        userId: resident3._id,
        userName: resident3.name,
        userPhone: resident3.phone,
        unit: { block: 'Block A', flat: '204' },
        assignedTo: 'Facility Electrical Desk',
      },
      {
        title: 'Water seepage in basement parking slot B-14',
        description: 'Continuous dripping from overhead storm water pipe onto car roof. Urgent attention needed.',
        category: 'Plumbing',
        priority: 'urgent',
        status: 'in_progress',
        communityId: greenwoodCommunity._id,
        userId: resident2._id,
        userName: resident2.name,
        userPhone: resident2.phone,
        unit: { block: 'Block C', flat: '1102' },
        assignedTo: 'Plumbing Lead Ramesh',
        resolutionNotes: 'Coupling clamp ordered, scheduled for repair today 3 PM.',
      },
      {
        title: 'Clubhouse gym treadmill belt slipping',
        description: 'Treadmill #1 belt slips when running above speed 8. Lubrication or tension adjustment required.',
        category: 'Common Area',
        priority: 'low',
        status: 'resolved',
        communityId: greenwoodCommunity._id,
        userId: resident1._id,
        userName: resident1.name,
        userPhone: resident1.phone,
        unit: { block: 'Block B', flat: '402' },
        assignedTo: 'Fitness Equipment Vendor',
        resolutionNotes: 'Belt replaced and tension calibrated on Oct 16.',
        resolvedAt: new Date(Date.now() - 86400000),
      },
    ]);

    // 9. Seed Ads & Posters (Module 1: Promoted Ads & Community Posters)
    await AdPoster.create([
      {
        title: 'Greenwood Annual Grand Diwali Mela & Food Carnival',
        description: 'Join 500+ families for festive food stalls, live games, handicrafts & cultural music evening at Central Amphitheatre.',
        badgeText: 'COMMUNITY EVENT',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
        targetUrl: '/events',
        category: 'Community Poster',
        communityId: greenwoodCommunity._id,
        status: 'active',
        impressions: 480,
        clicks: 72,
        createdBy: adminUser._id,
      },
      {
        title: 'Farm Fresh Organic Milk, Fruits & Veggies Daily Door Delivery',
        description: 'Direct from certified Telangana farms. Early morning doorstep drops before 6:30 AM with 20% resident discount.',
        badgeText: 'PARTNER OFFER',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
        targetUrl: 'https://wa.me/919800000000',
        category: 'Business Ad',
        communityId: greenwoodCommunity._id,
        status: 'active',
        impressions: 340,
        clicks: 58,
        createdBy: adminUser._id,
      },
      {
        title: 'Society Mega Blood Donation Drive — Sunday 9 AM to 2 PM',
        description: 'In partnership with Red Cross Society at Tower B Multi-purpose Hall. Refreshments & donor certificates provided.',
        badgeText: 'HEALTH DRIVE',
        imageUrl: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800&q=80',
        targetUrl: '/notices',
        category: 'Notice Poster',
        isGlobal: true,
        status: 'active',
        impressions: 610,
        clicks: 94,
        createdBy: centralAdmin._id,
      },
      {
        title: 'UrbanClap Home Deep Cleaning & Pest Control — 25% Off',
        description: 'Special verified community partner pricing for festive sofa cleaning, kitchen deep scrub and sanitize.',
        badgeText: 'SPONSORED',
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
        targetUrl: 'https://urbancompany.com',
        category: 'Sponsorship',
        communityId: greenwoodCommunity._id,
        status: 'active',
        impressions: 290,
        clicks: 41,
        createdBy: adminUser._id,
      },
    ]);

    console.log('[Seed] Seeding completed successfully! 4 Roles ready:');
    console.log('       1. Central Admin: centraladmin@mitra.org / Central@123456');
    console.log('       2. Society Admin: admin@mitra.org / Admin@123456');
    console.log('       3. Community Manager: priya.sharma@greenwoodheights.org / Mitra@123456');
    console.log('       4. Resident Member: sunil.mehta@example.com / Resident@123');
  } catch (err: any) {
    console.error('[Seed] Error during seeding:', err.message);
  }
};

if (require.main === module) {
  (async () => {
    const { connectDB } = await import('../config/db');
    await connectDB();
    await seedInitialData();
    process.exit(0);
  })();
}
