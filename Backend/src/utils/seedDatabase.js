const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import all application models
const User = require('../models/User');
const Category = require('../models/Category');
const Book = require('../models/Book');
const Counter = require('../models/Counter');
const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const Issue = require('../models/Issue');
const FinePayment = require('../models/FinePayment');
const Purchase = require('../models/Purchase');

// =========================================================================
// 1. MASTER CATEGORIES DATASET (14 Diverse Disciplines)
// =========================================================================

const categoriesData = [
  {
    name: 'Computer Science & AI',
    description: 'Algorithms, system design, software engineering, cloud computing, and machine learning.',
  },
  {
    name: 'Business & Management',
    description: 'Corporate leadership, organizational behavior, startup entrepreneurship, and strategy.',
  },
  {
    name: 'Finance & Economics',
    description: 'Financial markets, behavioral economics, investment banking, and fiscal policy.',
  },
  {
    name: 'Mathematics & Statistics',
    description: 'Calculus, linear algebra, probability, discrete math, and quantitative data modeling.',
  },
  {
    name: 'Science & Physics',
    description: 'Quantum mechanics, theoretical physics, thermodynamics, astrophysics, and relativity.',
  },
  {
    name: 'Psychology & Cognitive Science',
    description: 'Human behavior, cognitive neuroscience, social psychology, and mental well-being.',
  },
  {
    name: 'World Literature & Classics',
    description: 'Timeless literary masterpieces, prose, classic drama, and global poetry.',
  },
  {
    name: 'Fiction & Modern Thriller',
    description: 'Engaging contemporary fiction, investigative mysteries, and speculative narratives.',
  },
  {
    name: 'World History & Civilizations',
    description: 'Global revolutions, ancient empires, cultural development, and modern geopolitical affairs.',
  },
  {
    name: 'Philosophy & Ethics',
    description: 'Epistemology, moral philosophy, existential thought, and ethics of modern life.',
  },
  {
    name: 'Self-Development & Productivity',
    description: 'Habit formation, personal mastery, focus, time management, and mental resilience.',
  },
  {
    name: 'Competitive Exams & Aptitude',
    description: 'Quantitative aptitude, analytical reasoning, civil services, and entrance examinations.',
  },
  {
    name: 'Medicine & Health Sciences',
    description: 'Anatomy, human physiology, epidemiology, immunology, and public health.',
  },
  {
    name: 'Biography & Memoirs',
    description: 'Life narratives of pioneering scientists, global statesmen, inventors, and changemakers.',
  },
];

// =========================================================================
// 2. MASTER BOOKS CATALOG (44 Books - Clean Inventory)
// =========================================================================

const booksData = [
  // 1. Computer Science & AI
  {
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    publisher: 'Prentice Hall',
    publicationYear: 2008,
    categoryName: 'Computer Science & AI',
    totalCopies: 6,
    purchasePrice: 749,
    shelfLocation: 'Rack CS-101',
    description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. This book explores principles, patterns, and practices of writing clean software.',
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    isbn: '978-1449373320',
    publisher: "O'Reilly Media",
    publicationYear: 2017,
    categoryName: 'Computer Science & AI',
    totalCopies: 5,
    purchasePrice: 999,
    shelfLocation: 'Rack CS-102',
    description: 'An indispensable guide to the principles and architecture behind distributed systems, database internals, data models, scalability, and streaming data infrastructure.',
  },
  {
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell & Peter Norvig',
    isbn: '978-0136042594',
    publisher: 'Pearson',
    publicationYear: 2020,
    categoryName: 'Computer Science & AI',
    totalCopies: 4,
    purchasePrice: 1250,
    shelfLocation: 'Rack CS-103',
    description: 'The definitive textbook exploring all facets of artificial intelligence, including machine learning, probabilistic reasoning, robotics, NLP, and intelligent search agents.',
  },
  {
    title: 'Introduction to Algorithms (CLRS)',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest & Clifford Stein',
    isbn: '978-0262033848',
    publisher: 'MIT Press',
    publicationYear: 2009,
    categoryName: 'Computer Science & AI',
    totalCopies: 5,
    purchasePrice: 1199,
    shelfLocation: 'Rack CS-104',
    description: 'Comprehensive and rigorous introduction to algorithms across dynamic programming, graph algorithms, computational geometry, and multi-threaded computation.',
  },

  // 2. Business & Management
  {
    title: 'Zero to One: Notes on Startups, or How to Build the Future',
    author: 'Peter Thiel & Blake Masters',
    isbn: '978-0804139298',
    publisher: 'Crown Business',
    publicationYear: 2014,
    categoryName: 'Business & Management',
    totalCopies: 5,
    purchasePrice: 499,
    shelfLocation: 'Rack BM-201',
    description: 'The great secret of our time is that there are still uncharted frontiers to explore and new inventions to create. An unconventional blueprint for building category-defining companies.',
  },
  {
    title: 'Good to Great: Why Some Companies Make the Leap and Others Don\'t',
    author: 'Jim Collins',
    isbn: '978-0066620992',
    publisher: 'HarperBusiness',
    publicationYear: 2001,
    categoryName: 'Business & Management',
    totalCopies: 4,
    purchasePrice: 599,
    shelfLocation: 'Rack BM-202',
    description: 'A five-year research study exploring how mediocre companies achieved enduring greatness through disciplined people, disciplined thought, and disciplined action.',
  },
  {
    title: 'The Lean Startup: How Today\'s Entrepreneurs Use Continuous Innovation',
    author: 'Eric Ries',
    isbn: '978-0307887894',
    publisher: 'Crown Publishing',
    publicationYear: 2011,
    categoryName: 'Business & Management',
    totalCopies: 5,
    purchasePrice: 549,
    shelfLocation: 'Rack BM-203',
    description: 'A scientific approach to creating and managing startups through rapid experimentation, validated learning, and minimum viable products (MVPs).',
  },

  // 3. Finance & Economics
  {
    title: 'The Intelligent Investor: The Definitive Book on Value Investing',
    author: 'Benjamin Graham',
    isbn: '978-0060555665',
    publisher: 'Harper Business',
    publicationYear: 2006,
    categoryName: 'Finance & Economics',
    totalCopies: 6,
    purchasePrice: 699,
    shelfLocation: 'Rack FE-301',
    description: 'The greatest investment advisor of the twentieth century taught and inspired people worldwide. His philosophy of value investing shields investors from substantial error.',
  },
  {
    title: 'The Psychology of Money: Timeless Lessons on Wealth, Greed, and Happiness',
    author: 'Morgan Housel',
    isbn: '978-9390166268',
    publisher: 'Harriman House',
    publicationYear: 2020,
    categoryName: 'Finance & Economics',
    totalCopies: 7,
    purchasePrice: 399,
    shelfLocation: 'Rack FE-302',
    description: 'Doing well with money isn\'t necessarily about what you know. It\'s about how you behave. Explores nineteen short stories on the strange ways people think about money.',
  },
  {
    title: 'Freakonomics: A Rogue Economist Explores the Hidden Side of Everything',
    author: 'Steven D. Levitt & Stephen J. Dubner',
    isbn: '978-0060731328',
    publisher: 'William Morrow',
    publicationYear: 2005,
    categoryName: 'Finance & Economics',
    totalCopies: 4,
    purchasePrice: 450,
    shelfLocation: 'Rack FE-303',
    description: 'Which is more dangerous: a gun or a swimming pool? Demonstrates that economics is, at root, the study of incentives and human behavioral patterns.',
  },

  // 4. Mathematics & Statistics
  {
    title: 'Linear Algebra and Its Applications',
    author: 'Gilbert Strang',
    isbn: '978-0030105678',
    publisher: 'Cengage Learning',
    publicationYear: 2006,
    categoryName: 'Mathematics & Statistics',
    totalCopies: 4,
    purchasePrice: 850,
    shelfLocation: 'Rack MS-401',
    description: 'A classic mathematical work introducing vector spaces, eigenvalues, matrix decompositions, and linear transformations with clarity and real-world geometric intuition.',
  },
  {
    title: 'The Art of Statistics: How to Learn from Data',
    author: 'David Spiegelhalter',
    isbn: '978-1541618510',
    publisher: 'Basic Books',
    publicationYear: 2019,
    categoryName: 'Mathematics & Statistics',
    totalCopies: 4,
    purchasePrice: 599,
    shelfLocation: 'Rack MS-402',
    description: 'A masterclass in statistical reasoning, teaching readers how to extract reliable truth from raw numbers, question data claims, and communicate empirical evidence.',
  },
  {
    title: 'Calculus: Early Transcendentals',
    author: 'James Stewart',
    isbn: '978-1285741550',
    publisher: 'Brooks Cole',
    publicationYear: 2015,
    categoryName: 'Mathematics & Statistics',
    totalCopies: 5,
    purchasePrice: 1100,
    shelfLocation: 'Rack MS-403',
    description: 'Renowned for its mathematical precision, accuracy, and outstanding examples. Sets the world benchmark for university-level calculus education.',
  },

  // 5. Science & Physics
  {
    title: 'Six Easy Pieces: Essentials of Physics Explained by Its Most Brilliant Teacher',
    author: 'Richard P. Feynman',
    isbn: '978-0465025275',
    publisher: 'Basic Books',
    publicationYear: 2011,
    categoryName: 'Science & Physics',
    totalCopies: 4,
    purchasePrice: 420,
    shelfLocation: 'Rack SP-501',
    description: 'Drawn from the famous Feynman Lectures on Physics, presenting introductory physics with dazzling wit, profound physical insight, and pedagogical mastery.',
  },
  {
    title: 'A Brief History of Time: From the Big Bang to Black Holes',
    author: 'Stephen Hawking',
    isbn: '978-0553380163',
    publisher: 'Bantam Books',
    publicationYear: 1998,
    categoryName: 'Science & Physics',
    totalCopies: 5,
    purchasePrice: 499,
    shelfLocation: 'Rack SP-502',
    description: 'A landmark cosmological journey exploring the origins of the universe, space-time curvature, black holes, thermodynamics, and the unified theory of physics.',
  },
  {
    title: 'Cosmos',
    author: 'Carl Sagan',
    isbn: '978-0345539434',
    publisher: 'Ballantine Books',
    publicationYear: 2013,
    categoryName: 'Science & Physics',
    totalCopies: 4,
    purchasePrice: 550,
    shelfLocation: 'Rack SP-503',
    description: 'Traces fifteen billion years of cosmic evolution and the development of science and civilization. A poetic testament to our pursuit of astronomical discovery.',
  },

  // 6. Psychology & Cognitive Science
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    isbn: '978-0374533557',
    publisher: 'Farrar, Straus and Giroux',
    publicationYear: 2011,
    categoryName: 'Psychology & Cognitive Science',
    totalCopies: 6,
    purchasePrice: 599,
    shelfLocation: 'Rack PC-601',
    description: 'Nobel laureate Daniel Kahneman takes us on an intellectual tour of the two systems that drive the way we think: fast, emotional System 1 and slow, logical System 2.',
  },
  {
    title: 'The Man Who Mistook His Wife for a Hat and Other Clinical Tales',
    author: 'Oliver Sacks',
    isbn: '978-0684853949',
    publisher: 'Touchstone',
    publicationYear: 1998,
    categoryName: 'Psychology & Cognitive Science',
    totalCopies: 3,
    purchasePrice: 475,
    shelfLocation: 'Rack PC-602',
    description: 'In his most extraordinary book, Dr. Sacks recounts the case histories of patients lost in the bizarre neurological territory of amnesias, agnosias, and altered perception.',
  },
  {
    title: 'Influence: The Psychology of Persuasion',
    author: 'Robert B. Cialdini',
    isbn: '978-0061241895',
    publisher: 'Harper Business',
    publicationYear: 2006,
    categoryName: 'Psychology & Cognitive Science',
    totalCopies: 5,
    purchasePrice: 520,
    shelfLocation: 'Rack PC-603',
    description: 'Explains the psychology of why people say yes and how to apply these understandings. Identifies six universal principles of ethical persuasion.',
  },

  // 7. World Literature & Classics
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0061120084',
    publisher: 'Harper Perennial',
    publicationYear: 2006,
    categoryName: 'World Literature & Classics',
    totalCopies: 5,
    purchasePrice: 399,
    shelfLocation: 'Rack LC-701',
    description: 'A Pulitzer Prize-winning masterpiece exploring racial injustice, compassion, and human decency through the eyes of young Scout Finch in the American South.',
  },
  {
    title: '1984',
    author: 'George Orwell',
    isbn: '978-0451524935',
    publisher: 'Signet Classic',
    publicationYear: 1950,
    categoryName: 'World Literature & Classics',
    totalCopies: 6,
    purchasePrice: 299,
    shelfLocation: 'Rack LC-702',
    description: 'The chilling dystopian novel depicting totalitarianism, mass surveillance, historical revisionism, and the loss of individual autonomy in Oceania under Big Brother.',
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '978-0743273565',
    publisher: 'Scribner',
    publicationYear: 2004,
    categoryName: 'World Literature & Classics',
    totalCopies: 4,
    purchasePrice: 350,
    shelfLocation: 'Rack LC-703',
    description: 'An exemplary portrait of the Jazz Age, capturing the romantic obsession, disillusionment, and tragedy of Jay Gatsby on Long Island.',
  },
  {
    title: 'Crime and Punishment',
    author: 'Fyodor Dostoevsky',
    isbn: '978-0140449136',
    publisher: 'Penguin Classics',
    publicationYear: 2003,
    categoryName: 'World Literature & Classics',
    totalCopies: 4,
    purchasePrice: 480,
    shelfLocation: 'Rack LC-704',
    description: 'The psychological struggle and moral dilemmas of Rodion Raskolnikov, an impoverished ex-student in Saint Petersburg who formulates a plan to murder an unscrupulous pawnbroker.',
  },

  // 8. Fiction & Modern Thriller
  {
    title: 'The Da Vinci Code',
    author: 'Dan Brown',
    isbn: '978-0307474278',
    publisher: 'Anchor Books',
    publicationYear: 2009,
    categoryName: 'Fiction & Modern Thriller',
    totalCopies: 4,
    purchasePrice: 450,
    shelfLocation: 'Rack FT-801',
    description: 'While in Paris, Harvard symbologist Robert Langdon is awakened by a phone call: the elderly curator of the Louvre has been murdered inside the museum.',
  },
  {
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    isbn: '978-1250301696',
    publisher: 'Celadon Books',
    publicationYear: 2019,
    categoryName: 'Fiction & Modern Thriller',
    totalCopies: 4,
    purchasePrice: 420,
    shelfLocation: 'Rack FT-802',
    description: 'Alicia Berenson\'s life is seemingly perfect. One evening she shoots her husband five times in the face, and then never speaks another word. A criminal psychotherapist unravels the truth.',
  },

  // 9. World History & Civilizations
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    isbn: '978-0062316097',
    publisher: 'Harper',
    publicationYear: 2015,
    categoryName: 'World History & Civilizations',
    totalCopies: 6,
    purchasePrice: 650,
    shelfLocation: 'Rack HC-901',
    description: 'One hundred thousand years ago, at least six different species of humans inhabited Earth. Yet today there is only one: Homo sapiens. Explores how our species succeeded.',
  },
  {
    title: 'Guns, Germs, and Steel: The Fates of Human Societies',
    author: 'Jared Diamond',
    isbn: '978-0393317558',
    publisher: 'W. W. Norton & Company',
    publicationYear: 1999,
    categoryName: 'World History & Civilizations',
    totalCopies: 4,
    purchasePrice: 620,
    shelfLocation: 'Rack HC-902',
    description: 'A fascinating work arguing that geographical and environmental factors shaped the modern world, not genetic differences among human populations.',
  },
  {
    title: 'India After Gandhi: The History of the World\'s Largest Democracy',
    author: 'Ramachandra Guha',
    isbn: '978-0060958589',
    publisher: 'Ecco',
    publicationYear: 2008,
    categoryName: 'World History & Civilizations',
    totalCopies: 4,
    purchasePrice: 799,
    shelfLocation: 'Rack HC-903',
    description: 'A magisterial narrative of post-independence India, capturing the nation\'s political struggles, social diversity, linguistic conflicts, and democratic triumphs.',
  },

  // 10. Philosophy & Ethics
  {
    title: 'Meditations',
    author: 'Marcus Aurelius',
    isbn: '978-0812968255',
    publisher: 'Modern Library',
    publicationYear: 2002,
    categoryName: 'Philosophy & Ethics',
    totalCopies: 4,
    purchasePrice: 320,
    shelfLocation: 'Rack PE-101',
    description: 'Private reflections of Roman Emperor Marcus Aurelius offering practical Stoic wisdom on duty, resilience, emotional composure, and cosmic humility.',
  },
  {
    title: 'Beyond Good and Evil: Prelude to a Philosophy of the Future',
    author: 'Friedrich Nietzsche',
    isbn: '978-0140449235',
    publisher: 'Penguin Classics',
    publicationYear: 2003,
    categoryName: 'Philosophy & Ethics',
    totalCopies: 3,
    purchasePrice: 380,
    shelfLocation: 'Rack PE-102',
    description: 'Nietzsche attacks past philosophers for their blind acceptance of Christian morality and proposes a radical philosophy of will to power and individual mastery.',
  },
  {
    title: 'Justice: What\'s the Right Thing to Do?',
    author: 'Michael J. Sandel',
    isbn: '978-0374532505',
    publisher: 'Farrar, Straus and Giroux',
    publicationYear: 2010,
    categoryName: 'Philosophy & Ethics',
    totalCopies: 4,
    purchasePrice: 499,
    shelfLocation: 'Rack PE-103',
    description: 'Engaging moral philosophy exploring contemporary dilemmas such as affirmative action, income inequality, human rights, and the role of justice in society.',
  },

  // 11. Self-Development & Productivity
  {
    title: 'Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones',
    author: 'James Clear',
    isbn: '978-0735211292',
    publisher: 'Avery',
    publicationYear: 2018,
    categoryName: 'Self-Development & Productivity',
    totalCopies: 7,
    purchasePrice: 550,
    shelfLocation: 'Rack SD-201',
    description: 'A revolutionary system for making tiny changes that yield remarkable results. Draws on proven ideas from biology, psychology, and neuroscience.',
  },
  {
    title: 'Deep Work: Rules for Focused Success in a Distracted World',
    author: 'Cal Newport',
    isbn: '978-1455586691',
    publisher: 'Grand Central Publishing',
    publicationYear: 2016,
    categoryName: 'Self-Development & Productivity',
    totalCopies: 5,
    purchasePrice: 499,
    shelfLocation: 'Rack SD-202',
    description: 'Argues that deep work—the ability to focus without distraction on a cognitively demanding task—is an increasingly rare superpower in our modern economy.',
  },
  {
    title: 'The 7 Habits of Highly Effective People',
    author: 'Stephen R. Covey',
    isbn: '978-1982137274',
    publisher: 'Simon & Schuster',
    publicationYear: 2020,
    categoryName: 'Self-Development & Productivity',
    totalCopies: 5,
    purchasePrice: 599,
    shelfLocation: 'Rack SD-203',
    description: 'A holistic, integrated, principle-centered approach for solving personal and professional problems with timeless principles of fairness and integrity.',
  },

  // 12. Competitive Exams & Aptitude
  {
    title: 'Quantitative Aptitude for Competitive Examinations',
    author: 'R.S. Aggarwal',
    isbn: '978-9352534029',
    publisher: 'S. Chand Publishing',
    publicationYear: 2017,
    categoryName: 'Competitive Exams & Aptitude',
    totalCopies: 6,
    purchasePrice: 650,
    shelfLocation: 'Rack CE-301',
    description: 'Comprehensive practice manual covering arithmetic, algebra, percentages, geometry, and number systems for UPSC, Bank PO, SSC, and campus placements.',
  },
  {
    title: 'A Modern Approach to Verbal & Non-Verbal Reasoning',
    author: 'R.S. Aggarwal',
    isbn: '978-9352534326',
    publisher: 'S. Chand Publishing',
    publicationYear: 2018,
    categoryName: 'Competitive Exams & Aptitude',
    totalCopies: 5,
    purchasePrice: 720,
    shelfLocation: 'Rack CE-302',
    description: 'Extensive coverage of logical deduction, analytical puzzles, data sufficiency, analogy, and visual reasoning for premier recruitment exams.',
  },

  // 13. Medicine & Health Sciences
  {
    title: 'The Emperor of All Maladies: A Biography of Cancer',
    author: 'Siddhartha Mukherjee',
    isbn: '978-1439170915',
    publisher: 'Scribner',
    publicationYear: 2011,
    categoryName: 'Medicine & Health Sciences',
    totalCopies: 4,
    purchasePrice: 699,
    shelfLocation: 'Rack MD-401',
    description: 'A Pulitzer Prize-winning magnificent, profoundly humane "biography" of cancer—from its first documented appearances thousands of years ago to modern cellular therapies.',
  },
  {
    title: 'When Breath Becomes Air',
    author: 'Paul Kalanithi',
    isbn: '978-0812988406',
    publisher: 'Random House',
    publicationYear: 2016,
    categoryName: 'Medicine & Health Sciences',
    totalCopies: 4,
    purchasePrice: 450,
    shelfLocation: 'Rack MD-402',
    description: 'At thirty-six, on the verge of completing a decade\'s worth of training as a neurosurgeon, Paul Kalanithi was diagnosed with stage IV lung cancer. An unforgettable memoir on facing mortality.',
  },

  // 14. Biography & Memoirs
  {
    title: 'Steve Jobs',
    author: 'Walter Isaacson',
    isbn: '978-1451648539',
    publisher: 'Simon & Schuster',
    publicationYear: 2011,
    categoryName: 'Biography & Memoirs',
    totalCopies: 5,
    purchasePrice: 799,
    shelfLocation: 'Rack BM-501',
    description: 'Based on more than forty interviews with Steve Jobs conducted over two years. An unvarnished portrait of the roller-coaster life and searingly intense personality of a creative entrepreneur.',
  },
  {
    title: 'Wings of Fire: An Autobiography',
    author: 'A.P.J. Abdul Kalam & Arun Tiwari',
    isbn: '978-8173711466',
    publisher: 'Universities Press',
    publicationYear: 1999,
    categoryName: 'Biography & Memoirs',
    totalCopies: 6,
    purchasePrice: 350,
    shelfLocation: 'Rack BM-502',
    description: 'The inspiring autobiography of Dr. APJ Abdul Kalam, tracing his journey from humble beginnings in Rameswaram to becoming India\'s foremost aerospace scientist and eleventh President.',
  },

  // 15. Additional Titles
  {
    title: 'The Pragmatic Programmer: Your Journey To Mastery (20th Anniversary)',
    author: 'David Thomas & Andrew Hunt',
    isbn: '978-0135957059',
    publisher: 'Addison-Wesley Professional',
    publicationYear: 2019,
    categoryName: 'Computer Science & AI',
    totalCopies: 2,
    purchasePrice: 850,
    shelfLocation: 'Rack CS-105',
    description: 'Illustrates the core processes of software development: keeping code flexible, adapting to change, fighting software rot, and mastering career longevity.',
  },
  {
    title: 'Structure and Interpretation of Computer Programs (SICP)',
    author: 'Harold Abelson & Gerald Jay Sussman',
    isbn: '978-0262510875',
    publisher: 'MIT Press',
    publicationYear: 1996,
    categoryName: 'Computer Science & AI',
    totalCopies: 3,
    purchasePrice: 950,
    shelfLocation: 'Rack CS-106',
    description: 'The legendary foundational text on programming abstractions, computational models, metalinguistic abstraction, and register machines.',
  },
  {
    title: 'Refactoring: Improving the Design of Existing Code',
    author: 'Martin Fowler',
    isbn: '978-0134757599',
    publisher: 'Addison-Wesley Professional',
    publicationYear: 2018,
    categoryName: 'Computer Science & AI',
    totalCopies: 4,
    purchasePrice: 899,
    shelfLocation: 'Rack CS-107',
    description: 'Explains the principles and best practices of refactoring, including a catalog of proven refactorings with step-by-step instructions.',
  },
  {
    title: 'The Lean Product Playbook',
    author: 'Dan Olsen',
    isbn: '978-1118960875',
    publisher: 'Wiley',
    publicationYear: 2015,
    categoryName: 'Business & Management',
    totalCopies: 4,
    purchasePrice: 650,
    shelfLocation: 'Rack BM-204',
    description: 'A practical, actionable guide to achieving product-market fit using Lean customer discovery, user experience design, and iterative metrics.',
  },
];

// =========================================================================
// MAIN SEED FUNCTION
// =========================================================================

const seedDatabase = async () => {
  console.log('===========================================================');
  console.log('🌱 Starting Production Catalog & Admin Database Seeder');
  console.log('   (Clean state: No loans, no student accounts, no payments)');
  console.log('===========================================================');

  try {
    // ---------------------------------------------------------------------
    // STEP 1: CLEAN EXISTING DATABASE IN SAFE DEPENDENCY ORDER
    // ---------------------------------------------------------------------
    console.log('\n--- 1. Cleaning All Collections ---');
    await FinePayment.deleteMany({});
    console.log('  ✓ Cleaned FinePayment collection');

    await Purchase.deleteMany({});
    console.log('  ✓ Cleaned Purchase collection');

    await Issue.deleteMany({});
    console.log('  ✓ Cleaned Issue collection');

    await InventoryTransaction.deleteMany({});
    console.log('  ✓ Cleaned InventoryTransaction collection');

    await Inventory.deleteMany({});
    console.log('  ✓ Cleaned Inventory collection');

    await Book.deleteMany({});
    console.log('  ✓ Cleaned Book collection');

    await Category.deleteMany({});
    console.log('  ✓ Cleaned Category collection');

    await User.deleteMany({});
    console.log('  ✓ Cleaned User collection');

    await Counter.deleteMany({});
    console.log('  ✓ Cleaned Counter collection');
    console.log('✓ Database cleaned safely. Structure, indexes and schemas preserved.');

    // ---------------------------------------------------------------------
    // STEP 2: SEED ADMINISTRATOR ACCOUNT
    // ---------------------------------------------------------------------
    console.log('\n--- 2. Creating Administrator Account ---');
    // Primary administrator requested by user: admin@gmail.com / admin123
    const primaryAdmin = new User({
      name: 'System Administrator',
      email: 'admin@gmail.com',
      password: 'admin123', // User model pre('save') hook hashes with bcrypt automatically
      role: 'admin',
      phone: '9876543210',
      isActive: true,
    });
    await primaryAdmin.save();
    console.log('  ✓ Created Primary Admin: admin@gmail.com (Password: admin123)');

    // Secondary administrator for backward-compatible test suites: admin@library.com
    const secondaryAdmin = new User({
      name: 'Library Chief Administrator',
      email: 'admin@library.com',
      password: 'admin123',
      role: 'admin',
      phone: '9876543211',
      isActive: true,
    });
    await secondaryAdmin.save();
    console.log('  ✓ Created Suite Admin: admin@library.com (Password: admin123)');

    // ---------------------------------------------------------------------
    // STEP 3: SEED DIVERSE REALISTIC CATEGORIES
    // ---------------------------------------------------------------------
    console.log('\n--- 3. Creating Realistic Library Categories ---');
    const categoryMap = {};
    for (const cat of categoriesData) {
      const createdCat = await Category.create({
        name: cat.name,
        description: cat.description,
      });
      categoryMap[cat.name] = createdCat._id;
    }
    console.log(`  ✓ Created ${Object.keys(categoryMap).length} academic & literary categories.`);

    // ---------------------------------------------------------------------
    // STEP 4: SEED BOOKS CATALOG & CLEAN PHYSICAL INVENTORIES
    // (Every copy is 100% available in library shelf stock)
    // ---------------------------------------------------------------------
    console.log('\n--- 4. Creating Real-World Books Catalog & Physical Inventory ---');
    const bookMap = {};
    const inventoryMap = {};

    for (const b of booksData) {
      const categoryId = categoryMap[b.categoryName];
      if (!categoryId) {
        throw new Error(`Category "${b.categoryName}" not found in categoryMap`);
      }

      // In a clean production catalog without issued books:
      // availableCopies === totalCopies (all copies are physically available on shelf)
      const createdBook = await Book.create({
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        publisher: b.publisher,
        publicationYear: b.publicationYear,
        category: categoryId,
        totalCopies: b.totalCopies,
        availableCopies: b.totalCopies,
        purchasePrice: b.purchasePrice,
        shelfLocation: b.shelfLocation,
        description: b.description,
        isDeleted: false,
      });
      bookMap[b.isbn] = createdBook;

      // Synchronize 1:1 Physical Inventory
      // Mathematical Invariant: totalCopies === availableCopies + 0 + 0 + 0 + 0
      const inventoryDoc = new Inventory({
        book: createdBook._id,
        totalCopies: b.totalCopies,
        availableCopies: b.totalCopies,
        issuedCopies: 0,
        reservedCopies: 0,
        damagedCopies: 0,
        lostCopies: 0,
        purchasePrice: b.purchasePrice,
        lowStockThreshold: 2,
        isDeleted: false,
      });
      await inventoryDoc.save();
      inventoryMap[createdBook._id.toString()] = inventoryDoc;

      // Record initial audit transaction for inventory stock intake
      await InventoryTransaction.create({
        book: createdBook._id,
        inventory: inventoryDoc._id,
        type: 'STOCK_IN',
        quantity: b.totalCopies,
        previousAvailable: 0,
        newAvailable: b.totalCopies,
        reason: 'Initial catalog acquisition and library stock allocation',
        performedBy: primaryAdmin._id,
      });
    }
    console.log(`  ✓ Created ${booksData.length} diverse books with clean, fully available physical inventory.`);

    // ---------------------------------------------------------------------
    // STEP 5: INITIALIZE CENTRAL LIBRARY CARD COUNTER
    // (Zero students seeded: next registered student receives 000000000001)
    // ---------------------------------------------------------------------
    console.log('\n--- 5. Initializing Central Library Card ID Counter ---');
    await Counter.create({
      name: 'libraryCard',
      sequenceValue: 0,
    });
    console.log('  ✓ Central Library Card counter initialized to 0 (Next student: 000000000001).');

    // ---------------------------------------------------------------------
    // STEP 6: CLEAN OPERATIONAL STATE CONFIRMATION
    // (Zero issues, zero payments, zero purchases, zero student users)
    // ---------------------------------------------------------------------
    console.log('\n--- 6. Clean Operational State ---');
    console.log('  ✓ Issued Books   : 0 (No loan transactions)');
    console.log('  ✓ Student Members: 0 (No mock student accounts)');
    console.log('  ✓ Fine Payments  : 0 (No fine records)');
    console.log('  ✓ Purchases      : 0 (No purchase records)');

    console.log('\n===========================================================');
    console.log('🎉 Production Master Seeding Completed Successfully!');
    console.log('===========================================================');
    console.log('Summary of Clean Database:');
    console.log(`  • Administrators : 2 (Primary: admin@gmail.com / admin123)`);
    console.log(`  • Categories     : ${Object.keys(categoryMap).length}`);
    console.log(`  • Books Catalog  : ${Object.keys(bookMap).length} books`);
    console.log(`  • Inventories    : ${Object.keys(inventoryMap).length} (100% available in stock)`);
    console.log(`  • Students       : 0 (Fresh state)`);
    console.log(`  • Issues/Loans   : 0 (Fresh state)`);
    console.log(`  • Fines          : 0 (Fresh state)`);
    console.log(`  • Purchases      : 0 (Fresh state)`);
    console.log('===========================================================');
  } catch (error) {
    console.error('\n❌ Seeding Error:', error);
    throw error;
  }
};

// Standalone execution wrapper
if (require.main === module) {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/library_management';
  mongoose
    .connect(mongoUri)
    .then(async () => {
      console.log(`Connected to MongoDB at ${mongoUri}`);
      await seedDatabase();
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal connection error during seeding:', err.message);
      process.exit(1);
    });
}

module.exports = seedDatabase;
