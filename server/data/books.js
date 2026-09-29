import { subjects as courses } from './curriculum.js';
import { subjects } from './bookSubjects.js';
import { syllabusBooks } from './syllabusBooks.js';
// Bibliographic titles/authors are real; inventory, shelving and study mappings are demo data.
// ISBN, publisher, edition and publication year are omitted unless curated and verified.
const groups = [
  [
    'The C Programming Language|Brian W. Kernighan & Dennis M. Ritchie',
    'C Programming: A Modern Approach|K. N. King',
    'Let Us C|Yashavant Kanetkar',
  ],
  [
    'Head First Java|Kathy Sierra, Bert Bates & Trisha Gee',
    'Effective Java|Joshua Bloch',
    'Java: The Complete Reference|Herbert Schildt',
  ],
  [
    'Python Crash Course|Eric Matthes',
    'Automate the Boring Stuff with Python|Al Sweigart',
    'Learning Python|Mark Lutz',
  ],
  [
    'Data Structures and Algorithm Analysis in C|Mark Allen Weiss',
    'Data Structures Using C|Reema Thareja',
    'Data Structures and Algorithms in Java|Michael T. Goodrich, Roberto Tamassia & Michael H. Goldwasser',
  ],
  [
    'Introduction to Algorithms|Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest & Clifford Stein',
    'The Algorithm Design Manual|Steven S. Skiena',
    'Algorithms|Robert Sedgewick & Kevin Wayne',
  ],
  [
    'Database System Concepts|Abraham Silberschatz, Henry F. Korth & S. Sudarshan',
    'Fundamentals of Database Systems|Ramez Elmasri & Shamkant B. Navathe',
    'Database Management Systems|Raghu Ramakrishnan & Johannes Gehrke',
  ],
  [
    'Operating System Concepts|Abraham Silberschatz, Peter B. Galvin & Greg Gagne',
    'Modern Operating Systems|Andrew S. Tanenbaum & Herbert Bos',
    'Operating Systems: Three Easy Pieces|Remzi H. Arpaci-Dusseau & Andrea C. Arpaci-Dusseau',
  ],
  [
    'Computer Networking: A Top-Down Approach|James F. Kurose & Keith W. Ross',
    'Computer Networks|Andrew S. Tanenbaum & David J. Wetherall',
    'TCP/IP Illustrated, Volume 1|W. Richard Stevens',
  ],
  [
    'Computer Organization and Design|David A. Patterson & John L. Hennessy',
    'Computer System Architecture|M. Morris Mano',
    'Computer Organization and Architecture|William Stallings',
  ],
  [
    'Software Engineering|Ian Sommerville',
    'Clean Code|Robert C. Martin',
    'Design Patterns|Erich Gamma, Richard Helm, Ralph Johnson & John Vlissides',
  ],
  [
    'Eloquent JavaScript|Marijn Haverbeke',
    'HTML and CSS: Design and Build Websites|Jon Duckett',
    'Learning Web Design|Jennifer Niederst Robbins',
  ],
  [
    'Artificial Intelligence: A Modern Approach|Stuart Russell & Peter Norvig',
    'Artificial Intelligence|Elaine Rich, Kevin Knight & Shivashankar B. Nair',
    'Artificial Intelligence: Foundations of Computational Agents|David L. Poole & Alan K. Mackworth',
  ],
  [
    'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow|Aurélien Géron',
    'Pattern Recognition and Machine Learning|Christopher M. Bishop',
    'Deep Learning|Ian Goodfellow, Yoshua Bengio & Aaron Courville',
  ],
  [
    'Cloud Computing: Concepts, Technology & Architecture|Thomas Erl, Zaigham Mahmood & Ricardo Puttini',
    'Distributed Systems|Maarten van Steen & Andrew S. Tanenbaum',
  ],
  [
    'Computer Security: Principles and Practice|William Stallings & Lawrie Brown',
    'Security Engineering|Ross Anderson',
  ],
  ['Cryptography and Network Security|William Stallings', 'Applied Cryptography|Bruce Schneier'],
  [
    'Compilers: Principles, Techniques, and Tools|Alfred V. Aho, Monica S. Lam, Ravi Sethi & Jeffrey D. Ullman',
    'Engineering a Compiler|Keith D. Cooper & Linda Torczon',
  ],
  [
    'Introduction to the Theory of Computation|Michael Sipser',
    'Introduction to Automata Theory, Languages, and Computation|John E. Hopcroft, Rajeev Motwani & Jeffrey D. Ullman',
  ],
  [
    'Higher Engineering Mathematics|B. S. Grewal',
    'Advanced Engineering Mathematics|Erwin Kreyszig',
    'Discrete Mathematics and Its Applications|Kenneth H. Rosen',
    'Introduction to Linear Algebra|Gilbert Strang',
  ],
  [
    'Fundamentals of Physics|David Halliday, Robert Resnick & Jearl Walker',
    'Concepts of Modern Physics|Arthur Beiser',
  ],
  [
    'Engineering Chemistry|P. C. Jain & Monika Jain',
    'A Textbook of Engineering Chemistry|S. S. Dara & S. S. Umare',
  ],
  ['Engineering Drawing|N. D. Bhatt', 'Engineering Graphics|K. L. Narayana & P. Kannaiah'],
  [
    'Basic Electrical Engineering|D. P. Kothari & I. J. Nagrath',
    'Fundamentals of Electric Circuits|Charles K. Alexander & Matthew N. O. Sadiku',
  ],
  [
    'Electronic Devices and Circuit Theory|Robert L. Boylestad & Louis Nashelsky',
    'Digital Design|M. Morris Mano & Michael D. Ciletti',
    'Microelectronic Circuits|Adel S. Sedra & Kenneth C. Smith',
  ],
  [
    'Ethics in Engineering|Mike W. Martin & Roland Schinzinger',
    'Engineering Ethics: Concepts and Cases|Charles E. Harris Jr., Michael S. Pritchard & Michael J. Rabins',
  ],
  [
    'Technical Communication|Meenakshi Raman & Sangeeta Sharma',
    'English Grammar in Use|Raymond Murphy',
  ],
  [
    'Object-Oriented Programming with C++|E. Balagurusamy',
    'The C++ Programming Language|Bjarne Stroustrup',
  ],
  [
    'Surveying, Volume 1|B. C. Punmia, Ashok Kumar Jain & Arun Kumar Jain',
    'Concrete Technology|M. S. Shetty',
  ],
  [
    'Engineering Thermodynamics|P. K. Nag',
    'Engineering Mechanics: Statics|J. L. Meriam & L. G. Kraige',
  ],
];
let index = 0;
const existingBooks = groups.flatMap((entries, g) =>
  entries.map((entry) => {
    const [title, author] = entry.split('|');
    let s = subjects[g];
    const specificCourses = {
      'Discrete Mathematics and Its Applications': '24BM11RC05',
      'Introduction to Linear Algebra': '24BM11RC02',
      'Digital Design': '24EC11RC05',
      'English Grammar in Use': '24HE11RC01',
      'Distributed Systems': '24CI11PE03',
      'Deep Learning': '24CI11PE02',
    };
    const course = courses.find((item) => item.code === specificCourses[title]);
    if (course) s = { ...s, name: course.name, semester: course.semester };
    const n = index++;
    const totalCopies = title === 'Operating System Concepts' ? 5 : 3 + (n % 7);
    return {
      title,
      author,
      subject: s.name,
      department: s.department,
      semester: s.semester,
      topics: s.topics,
      tags: [s.name, ...s.topics],
      description: `Explore ${s.topics.slice(0, 3).join(', ').toLowerCase()} with ${title}. A useful companion for building strong foundations in ${s.name.toLowerCase()}, preparing for coursework, and taking your understanding beyond the classroom.`,
      totalCopies,
      availableCopies: totalCopies,
      checkedOutCopies: 0,
      reservedCopies: 0,
      shelfLocation: `${s.department.replaceAll(' ', '')}-${String(g + 1).padStart(2, '0')}${String((n % 5) + 1)}`,
      coverImage: '',
    };
  }),
);

export const books = existingBooks
  .map((book) => {
    const reading = syllabusBooks.find(
      (item) => item.title === book.title && item.author === book.author,
    );
    return reading
      ? {
          ...book,
          topics: [...new Set([...book.topics, ...reading.topics])],
          tags: [...new Set([...book.tags, ...reading.tags])],
        }
      : book;
  })
  .concat(
    syllabusBooks.filter(
      (reading) =>
        !existingBooks.some(
          (book) => book.title === reading.title && book.author === reading.author,
        ),
    ),
  );
