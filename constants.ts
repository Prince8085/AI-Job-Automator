
import { Job, UserProfile, TrackedJob, ApplicationStatus, PotentialContact } from './types';

export const MOCK_USER_PROFILE: UserProfile = {
  name: 'Prince Kachhwaha',
  email: 'kachhwahaprince@gmail.com',
  phone: '+91 8085654567',
  linkedinUrl: 'https://linkedin.com/in/prince-kachhwaha',
  githubUrl: 'https://github.com/prince-kachhwaha',
  portfolioUrl: 'https://prince-dev.netlify.app',
  profilePictureUrl: 'https://media.licdn.com/dms/image/D4D03AQE8PjI5Pj-g9A/profile-displayphoto-shrink_400_400/0/1715016559982?e=1726704000&v=beta&t=O_2iXbCGFsXg7hY0z1q9R1g3c2V_3b4Q9J9l8Yk3f0w',
  coverPhotoUrl: 'https://images.unsplash.com/photo-1554629947-334ff61d85dc?q=80&w=2836&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  bio: 'Results-driven AI and Full-Stack Engineer with a proven track record of building and delivering over 14 end-to-end projects. Proven ability to turn complex challenges into profitable solutions, from architecting AI-powered trading systems achieving a 78% success rate to developing automation tools that save 40+ hours/week. Seeking to leverage expertise in machine learning and full-stack development to build high-value products at an innovative startup.',
  baseResume: `PRINCE KACHHWAHA
+91 8085654567 | Shahdol, MP | kachhwahaprince@gmail.com | LinkedIn | GitHub | Portfolio

SUMMARY
Results-driven AI and Full-Stack Engineer with a proven track record of building and delivering over 14 end-to-end projects. Proven ability to turn complex challenges into profitable solutions, from architecting AI-powered trading systems achieving a 78% success rate to developing automation tools that save 40+ hours/week. Seeking to leverage expertise in machine learning and full-stack development to build high-value products at an innovative startup.

EXPERIENCE
Machine Learning and Managing Intern | Innovix Solutions | Feb 2024 - Present, Remote
- Developed and implemented a Python-based automation suite that streamlined internal data processing and reporting tasks, saving the engineering team over 40 hours of manual work per week.
- Engineered and deployed an AI-powered chatbot using Node.js and the RASA framework, which automated customer support queries and improved initial response times by over 60%.
- Collaborated in an Agile environment to design, develop, and test new features, contributing to a 15% reduction in the bug backlog before a major product release.

PROJECTS
AI-Powered Algorithmic Trading System
- Architected and deployed a sophisticated trading bot that analyzes market data and social media sentiment to execute trades, achieving a documented 78% success rate in back-testing and live-paper trading.
- Engineered the predictive core using Python, TensorFlow, and Scikit-learn for time-series forecasting and sentiment analysis on real-time financial data streams.
- Built a robust, event-driven back-end with Node.js and Express.js to handle secure API integrations with brokerage platforms and manage trade execution logic, ensuring 99.9% system uptime.

Full-Stack E-Commerce Platform
- Developed a complete, cross-platform e-commerce application for iOS and Android from concept to deployment, demonstrating end-to-end product ownership.
- Built a responsive and intuitive user interface using Flutter, enabling a single, maintainable codebase for both mobile platforms.
- Created a secure and scalable back-end using Node.js, Express.js, and MongoDB, featuring JWT-based user authentication, product inventory management, and a complete RESTful API. Integrated the Stripe API for secure payment processing.

SKILLS
Languages: Python, JavaScript, Dart, C++
Frameworks & Libraries: Next.js, Node.js, Express.js, Flutter, TensorFlow, Keras, Scikit-learn, Pandas, NumPy, RASA
Databases: MongoDB, Firebase, SQL
Tools & Platforms: Git, Docker, Google Cloud Platform (GCP), AWS (EC2, S3), REST APIs

EDUCATION
Bachelor of Technology, Artificial Intelligence and Machine Learning | MITS Gwalior | Expected 2025`
};

export const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    company: 'Innovatech',
    location: 'San Francisco, CA',
    description: 'Innovatech is seeking a Senior Frontend Engineer to build our next-generation platform. You will work with React, TypeScript, and GraphQL to create beautiful and performant user interfaces. The ideal candidate has a strong eye for design and a passion for web development.',
    tags: ['React', 'TypeScript', 'GraphQL'],
    salary: '$150,000 - $180,000',
    postedDate: '5 days ago',
    isWishlisted: false,
  },
  {
    id: '2',
    title: 'Product Manager, AI',
    company: 'FutureAI',
    location: 'New York, NY (Remote)',
    description: 'FutureAI is at the forefront of artificial intelligence. We are looking for a Product Manager to lead our AI-powered products. You will define product strategy, work with engineering teams, and drive product launches. Experience with machine learning concepts is a plus.',
    tags: ['Product Management', 'AI/ML', 'Remote'],
    salary: '$160,000 - $190,000',
    postedDate: '2 days ago',
    isWishlisted: false,
  },
  {
    id: '3',
    title: 'UX/UI Designer',
    company: 'Creative Minds',
    location: 'Austin, TX',
    description: 'Join Creative Minds and help design intuitive and engaging user experiences. You will be responsible for the entire design process, from user research to high-fidelity mockups and prototypes. Proficiency in Figma and Adobe Creative Suite is required.',
    tags: ['UX', 'UI', 'Figma'],
    salary: '$110,000 - $130,000',
    postedDate: '1 week ago',
    isWishlisted: false,
  },
    {
    id: '4',
    title: 'Full Stack Developer',
    company: 'DataStream',
    location: 'Chicago, IL',
    description: 'DataStream is hiring a Full Stack Developer to work on our core data processing pipeline. The stack includes Node.js, Python, React, and PostgreSQL. We value clean code and a collaborative spirit.',
    tags: ['Node.js', 'Python', 'React'],
    salary: '$130,000 - $155,000',
    postedDate: '10 days ago',
    isWishlisted: false,
  }
];

export const MOCK_TRACKED_JOBS: TrackedJob[] = [
    { ...MOCK_JOBS[0], status: ApplicationStatus.INTERVIEWING, isWishlisted: false },
    { ...MOCK_JOBS[2], status: ApplicationStatus.APPLIED, isWishlisted: true },
    { ...MOCK_JOBS[3], status: ApplicationStatus.SAVED, isWishlisted: false },
];

export const APPLICATION_STATUS_ORDER = [
  ApplicationStatus.SAVED,
  ApplicationStatus.APPLIED,
  ApplicationStatus.INTERVIEWING,
  ApplicationStatus.OFFER,
  ApplicationStatus.REJECTED,
];

export const MOCK_POTENTIAL_CONTACTS: PotentialContact[] = [
  {
    name: 'Jane Doe',
    title: 'Senior Technical Recruiter',
    linkedinUrl: '#',
    email: 'jane.doe@example.com',
  },
  {
    name: 'John Smith',
    title: 'Hiring Manager, Engineering',
    linkedinUrl: '#',
    email: 'john.smith@example.com',
  },
   {
    name: 'Emily White',
    title: 'Talent Acquisition Partner',
    linkedinUrl: '#',
    email: 'emily.white@example.com',
  },
];
