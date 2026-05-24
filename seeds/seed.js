require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Job = require('../models/Job.model');
const SiteContent = require('../models/SiteContent.model');

const JOBS = [
  {
    title: 'Senior Software Engineer',
    location: 'Chennai / Remote',
    type: 'Full-time',
    category: 'IT & Software',
    department: 'Engineering',
    description:
      'We are looking for a seasoned Senior Software Engineer to join our growing technology team. You will architect, build, and maintain scalable backend and frontend systems.',
    requirements: [
      '5+ years of software engineering experience',
      'Proficiency in Node.js, React, or Python',
      'Experience with cloud platforms (AWS/GCP/Azure)',
      'Strong understanding of distributed systems',
    ],
    responsibilities: [
      'Design and implement scalable microservices',
      'Lead code reviews and mentor junior engineers',
      'Collaborate with product and design teams',
      'Maintain CI/CD pipelines and infrastructure',
    ],
    status: 'Active',
    experienceRange: { min: 5, max: 12 },
    salaryRange: { min: 1200000, max: 2400000, currency: 'INR', visible: false },
  },
  {
    title: 'HR Manager',
    location: 'Chennai',
    type: 'Full-time',
    category: 'Human Resources',
    department: 'HR',
    description:
      'Join us as an HR Manager to drive talent acquisition, employee engagement, and compliance for our clients across Chennai.',
    requirements: [
      '4+ years of HR experience',
      'Knowledge of Indian labour laws and statutory compliance',
      'Experience with HRIS tools',
      'Strong interpersonal and communication skills',
    ],
    responsibilities: [
      'Manage end-to-end recruitment for client organizations',
      'Ensure statutory compliance (PF, ESI, Gratuity)',
      'Drive employee engagement initiatives',
      'Conduct HR audits and policy reviews',
    ],
    status: 'Active',
    experienceRange: { min: 4, max: 10 },
  },
  {
    title: 'Sales Executive',
    location: 'Coimbatore',
    type: 'Hybrid',
    category: 'Sales',
    department: 'Business Development',
    description:
      'Expand NEXO HR Solutions\' client base in Coimbatore and surrounding regions through consultative selling of our HR services.',
    requirements: [
      '2+ years of B2B sales experience',
      'Proven track record of meeting or exceeding targets',
      'Excellent communication in Tamil and English',
    ],
    responsibilities: [
      'Identify and prospect new clients via calls, LinkedIn, and events',
      'Deliver consultative pitches for HR service packages',
      'Manage a pipeline of 30+ active leads monthly',
      'Coordinate onboarding with the delivery team',
    ],
    status: 'Active',
    experienceRange: { min: 2, max: 6 },
  },
  {
    title: 'Payroll Specialist',
    location: 'Chennai',
    type: 'Contract',
    category: 'Finance',
    department: 'Finance',
    description:
      'Process accurate and timely payroll for 2,000+ employees across multiple clients, ensuring compliance with statutory deductions.',
    requirements: [
      '3+ years of payroll processing experience',
      'Deep knowledge of PF, ESI, PT, TDS calculations',
      'Proficiency in Zoho Payroll, GreytHR or similar HRMS',
      'High attention to detail and confidentiality',
    ],
    responsibilities: [
      'Process monthly payroll for multiple client entities',
      'File PF, ESI, PT, and TDS on time',
      'Prepare salary registers and compliance reports',
      'Resolve payroll discrepancies in a timely manner',
    ],
    status: 'Active',
    experienceRange: { min: 3, max: 8 },
  },
];

const DEFAULT_CONTENT = [
  {
    key: 'hero',
    label: 'Homepage Hero Section',
    data: {
      heading: 'Where People &',
      gradientText: 'Workplaces Meet',
      subtitle:
        'End-to-end HR solutions that help SMEs recruit smarter, comply confidently, and grow sustainably.',
      cta: { primary: 'Book Free Consultation', secondary: 'Explore Services' },
    },
  },
  {
    key: 'global',
    label: 'Global Site Settings',
    data: {
      companyName: 'NEXO HR Solutions',
      tagline: 'Where People & Workplaces Meet',
      phone: '7200721109',
      email: 'nexo.hrsolutions@gmail.com',
      address: 'Chennai, Tamil Nadu, India',
      officeHours: 'Mon – Fri · 9 AM – 6 PM',
      experience: '10+ Years',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      facebook: 'https://facebook.com',
    },
  },
  {
    key: 'about',
    label: 'About Page',
    data: {
      heading: 'Pioneering Human Capital Excellence',
      story:
        'Founded over a decade ago in Chennai, NEXO HR Solutions was built with one clear purpose: to be the HR backbone that growing businesses never had access to.',
      mission:
        'To empower SMEs with enterprise-grade HR practices — making compliance seamless, hiring precise, and workplaces thriving.',
      vision:
        'A future where every business, regardless of size, has access to world-class human capital management.',
    },
  },
];

const seed = async () => {
  console.log('🌱 Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGO_URI);

  console.log('🧹 Clearing existing seed data…');
  await Promise.all([
    User.deleteMany({ email: 'admin@nexohr.com' }),
    Job.deleteMany({}),
    SiteContent.deleteMany({}),
  ]);

  console.log('👤 Creating admin user…');
  await User.create({
    name: 'NEXO Admin',
    email: 'admin@nexohr.com',
    password: 'Admin@123456',
    role: 'superadmin',
  });

  console.log('💼 Seeding jobs…');
  await Job.create(JOBS);

  console.log('📄 Seeding site content…');
  await SiteContent.insertMany(DEFAULT_CONTENT);

  console.log('\n✅ Seed complete!');
  console.log('   Admin email:    admin@nexohr.com');
  console.log('   Admin password: Admin@123456');
  console.log('\n⚠️  Change the password after first login!\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
