import { subjects } from './curriculum.js';

// Selected textbooks/reference books from the eight supplied III-I syllabus PDFs.
// IoT has no prescribed books: its two entries are supplementary project references.
// IoT sources: https://www.exploringrpi.com/ and
// https://www.packtpub.com/en-CY/product/internet-of-things-with-raspberry-pi-3-9781788627405
const readings = [
  [
    'Insight into Data Mining: Theory and Practice',
    'K. P. Soman, Shyam Diwakar & V. Ajay',
    ['24CI11RC01'],
    ['Data mining', 'WEKA', 'Classification', 'Clustering'],
  ],
  [
    'Introduction to Data Mining with Case Studies',
    'G. K. Gupta',
    ['24CI11RC01'],
    ['Data mining', 'Data preprocessing', 'Association rules', 'Case studies'],
  ],
  [
    'Data Mining: Concepts and Techniques',
    'Jiawei Han, Micheline Kamber & Jian Pei',
    ['24CT11RC19'],
    ['Data warehousing', 'OLAP', 'Classification', 'Clustering', 'Apriori'],
  ],
  [
    'Introduction to Data Mining',
    'Pang-Ning Tan, Michael Steinbach & Vipin Kumar',
    ['24CT11RC19'],
    ['Data mining', 'Association analysis', 'Decision trees', 'Clustering'],
  ],
  [
    'Change by Design',
    'Tim Brown',
    ['24CS11MC01'],
    ['Design thinking', 'Innovation', 'Empathy', 'Prototyping', 'Entrepreneurship'],
  ],
  [
    'The Design Thinking Toolbox',
    'Michael Lewrick, Patrick Link & Larry Leifer',
    ['24CS11MC01'],
    ['Design thinking', 'Ideation', 'Prototyping', 'Testing'],
  ],
  [
    'Compiler Construction: Principles and Practice',
    'Kenneth C. Louden',
    ['24CS11RC01'],
    ['Lexical analysis', 'Parsing', 'Code generation', 'Optimization'],
  ],
  [
    'Compilers: Principles, Techniques, and Tools',
    'Alfred V. Aho, Monica S. Lam, Ravi Sethi & Jeffrey D. Ullman',
    ['24CS11RC01'],
    ['Lexical analysis', 'Parsing', 'Code generation', 'Optimization'],
  ],
  [
    'Computer Networks',
    'Andrew S. Tanenbaum & David J. Wetherall',
    ['24CT11RC22', '24CT11RC24'],
    ['TCP/IP', 'Routing', 'Socket programming', 'CRC', 'Network protocols'],
  ],
  [
    'Data Communications and Networking',
    'Behrouz A. Forouzan',
    ['24CT11RC22', '24CT11RC24'],
    ['OSI model', 'TCP/IP', 'Routing', 'Error detection', 'Network protocols'],
  ],
  [
    'Learning Continuous Integration with Jenkins',
    'Nikhil Pathania',
    ['24CT11SC01'],
    ['DevOps', 'Jenkins', 'CI/CD', 'Git', 'Maven', 'Pipelines'],
  ],
  [
    'Jenkins 2: Up and Running',
    'Brent Laster',
    ['24CT11SC01'],
    ['DevOps', 'Jenkins', 'CI/CD', 'Pipelines', 'Automation'],
  ],
  [
    'Exploring Raspberry Pi',
    'Derek Molloy',
    ['24EC11SC02'],
    ['IoT', 'Raspberry Pi', 'Sensors', 'Interfacing', 'Embedded Linux'],
  ],
  [
    'Internet of Things with Raspberry Pi 3',
    'Maneesh Rao',
    ['24EC11SC02'],
    ['IoT', 'Raspberry Pi', 'Sensors', 'Cloud', 'HTTP', 'Motor control'],
  ],
];

export const syllabusBooks = readings.map(([title, author, codes, topics], index) => {
  const courses = codes.map((code) => {
    const course = subjects.find((item) => item.code === code);
    if (!course) throw new Error(`Unknown syllabus course: ${code}`);
    return course;
  });
  const supplementary = codes.includes('24EC11SC02');
  return {
    title,
    author,
    subject: courses[0].name,
    department: 'CSE',
    semester: 5,
    topics,
    tags: [...codes, ...courses.map((course) => course.name), ...topics],
    description: `${supplementary ? 'Supplementary reading aligned with the IoT syllabus; not a prescribed textbook' : 'Textbook or reference selected from the supplied syllabus'} for ${courses.map((course) => course.name).join(' and ')} (III Year, I Semester). Covers ${topics.join(', ')}.`,
    // Inventory and shelving follow the application's demo catalogue convention.
    totalCopies: 5,
    availableCopies: 5,
    checkedOutCopies: 0,
    reservedCopies: 0,
    shelfLocation: `CSE-S5-${String(index + 1).padStart(2, '0')}`,
    coverImage: '',
  };
});
