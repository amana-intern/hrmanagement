// Template kompetensi assessment. Sumber: requirement user (6 bidang).
// Dipakai sebagai default saat HR membuat assessment (bisa diedit).

export const ASSESSMENT_LEVELS = [
  {
    level: 1,
    label: 'Familiar',
    description: 'Has a basic understanding of concepts and terminology.',
  },
  {
    level: 2,
    label: 'Applied',
    description: 'Able to use this skill for basic tasks with guidance.',
  },
  {
    level: 3,
    label: 'Proficient',
    description:
      'Able to work independently and effectively, becoming a key contributor on relevant projects.',
  },
  {
    level: 4,
    label: 'Expert',
    description:
      'Able to lead, teach, and solve complex problems; recognized as an expert in their field.',
  },
] as const;

// 6 bidang kompetensi + daftar kompetensi di dalamnya.
export const ASSESSMENT_FIELDS: { namaKategori: string; kompetensi: string[] }[] = [
  {
    namaKategori: 'Digital Transformation & GovTech',
    kompetensi: [
      'Digital Strategy',
      'Public Sector Transformation',
      'Civic tech',
      'Digital Government',
      'Technology Implementation',
      'E-Government',
      'Sustainable Development Goals',
      'Project Management',
      'Digital Transformation',
    ],
  },
  {
    namaKategori: 'Health & Wellbeing',
    kompetensi: [
      'Public Health',
      'Epidemiology',
      'Clinical research',
      'Laboratory Management',
      'Health Policy',
      'Health System Strengthening',
      'Monitoring & Evaluation',
    ],
  },
  {
    namaKategori: 'Public Policy & Social Development',
    kompetensi: [
      'Policy analysis',
      'Social Research',
      'Stakeholder engagement',
      'Social development',
      'Policy economics',
      'Public Policy',
      'Digital Policy',
      'Policy Research & Analysis',
      'Social Welfare',
      'Social Inclusion',
      'Policy Advocacy',
      'Curriculum development',
    ],
  },
  {
    namaKategori: 'Technology & Data Analytics',
    kompetensi: [
      'Product Development',
      'Scrum Master',
      'IT Audit',
      'Cybersecurity',
      'Solution Architect',
      'Fraud detection',
      'Data Engineering',
      'Cloud computing',
      'Data Science',
      'Data Analytics',
      'Data modeling',
      'SQL Databases',
      'Data Visualization',
      'Data Governance',
      'Data Warehousing',
      'Data Driven Planning',
      'AI Policy',
      'AI Product Development',
      'UI/UX Design',
      'Data Center Operation',
      'Full Stack Developer',
    ],
  },
  {
    namaKategori: 'Research & Consulting',
    kompetensi: [
      'Qualitative Research',
      'Quantitative Research',
      'Research Design',
      'Strategic Planning',
      'Public sector consulting',
      'Public sector reform',
      'Business research',
    ],
  },
  {
    namaKategori: 'Human Resources & Operation',
    kompetensi: [
      'HR Management',
      'Recruitment',
      'Business Operation',
      'Administration',
      'Organizational Development',
      'Social Media Analyst',
      'Copywriter',
      'Graphic Designer',
      'Motion Graphic',
      'Videographer',
      'Public Relation',
      'Legal Drafting',
      'Legal Compliance',
      'Litigasi',
      'Hukum Tata Negara',
      'Corporate Governance',
      'Business Acumen',
      'Information Design',
      'Content Management',
    ],
  },
];
