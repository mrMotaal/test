// ==========================================================================
// UNIT 1: NUMBERS & OPERATIONS • LESSON ONE: PROPORTION
// Official Egyptian Prep 3 / Grade 9 Mathematics Curriculum (English Edition)
// Prepared for: Mr Ahmed Abd El-Motaal (Math Teacher & Content Creator)
// ==========================================================================
const LESSON_PROPORTION = {
  key: 'proportion',
  unitTag: '<i class="fa-solid fa-scale-balanced"></i> Unit 1 • Numbers and Operations on Them',
  title: 'Lesson One: Proportion',
  subtitle: 'Master the equality of ratios and rates, the cross-multiplication property (Product of Extremes = Product of Means), solving linear and binomial unknowns, real-world proportional modeling, and graphical coordinate representations.',
  stageBadge: '<i class="fa-solid fa-graduation-cap"></i> Unit 1: Numbers & Operations • Lesson One: Proportion',

  // 1. Diagnostic Pre-Study & Readiness Review
  preStudy: {
    title: 'Pre-Study: Check Your Readiness',
    subtitle: 'Review essential prerequisite concepts: simplifying fractions, ratio equivalence, and rates before studying proportion.',
    cards: [
      {
        icon: 'fa-solid fa-divide',
        iconBg: '#6c5ce7',
        title: '1. Simplifying Fractions to Lowest Terms',
        desc: `
          Divide the numerator and denominator by their greatest common divisor (GCD):
          <div class="pre-study-formula-box">
            • $\\frac{12}{18} = \\frac{12 \\div 6}{18 \\div 6} = \\frac{2}{3}$<br>
            • Ratios with identical irreducible fractions represent equivalent quantities.
          </div>
        `
      },
      {
        icon: 'fa-solid fa-scale-balanced',
        iconBg: '#00b894',
        title: '2. Understanding Ratios & Rates',
        desc: `
          A ratio compares quantities of the same unit, while a rate compares different units:
          <div class="pre-study-formula-box">
            • <strong>Ratio:</strong> 4 pens to 6 pens &rarr; $4 : 6 = 2 : 3$<br>
            • <strong>Rate:</strong> 150 kilometers in 2 hours &rarr; $75\\text{ km/h}$
          </div>
        `
      },
      {
        icon: 'fa-solid fa-xmark',
        iconBg: '#fdcb6e',
        title: '3. Cross-Multiplication Principle',
        desc: `
          If two fractions are equal $\\frac{a}{b} = \\frac{c}{d}$, their cross products are equal:
          <div class="pre-study-formula-box">
            $$a \\times d = b \\times c$$
            If $\\frac{x}{8} = \\frac{3}{4}$, then $4x = 24 \\implies x = 6$.
          </div>
        `
      }
    ],
    diagnosticQuestions: [
      {
        id: 'diag-prop-1',
        text: '1. Which ratio is equivalent to $3 : 5$?',
        options: ['6 : 8', '9 : 15', '5 : 3', '12 : 15'],
        correct: 1,
        explanation: 'Multiply both terms of $3:5$ by 3: $3 \\times 3 = 9$ and $5 \\times 3 = 15$. Thus $9:15$ is equivalent.'
      },
      {
        id: 'diag-prop-2',
        text: '2. If $\\frac{x}{6} = \\frac{10}{15}$, what is the value of $x$?',
        options: ['4', '5', '3', '6'],
        correct: 0,
        explanation: 'Simplify $\\frac{10}{15} = \\frac{2}{3}$. Then $\\frac{x}{6} = \\frac{2}{3} \\implies 3x = 12 \\implies x = 4$.'
      },
      {
        id: 'diag-prop-3',
        text: '3. If a vehicle travels 180 km in 3 hours, what is its uniform speed rate?',
        options: ['50 km/h', '45 km/h', '60 km/h', '55 km/h'],
        correct: 2,
        explanation: 'Rate = $\\frac{\\text{Distance}}{\\text{Time}} = \\frac{180\\text{ km}}{3\\text{ h}} = 60\\text{ km/h}$.'
      }
    ]
  },

  // 2. Real-World Applications (From PDF pages 1, 3, 6)
  realWorldApps: [
    {
      accent: '#6c5ce7',
      accentBg: 'rgba(108, 92, 231, 0.12)',
      icon: 'fa-solid fa-gas-pump',
      tag: 'Automotive & Travel',
      title: 'Car Petrol & Highway Mileage',
      desc: 'In automotive engineering and journey planning, fuel consumption is directly proportional to distance traveled at uniform cruise speeds.',
      svg: `
        <svg width="100%" height="150" viewBox="0 0 300 150">
          <rect x="20" y="95" width="260" height="8" rx="4" fill="#dfe6e9"/>
          <!-- Car Silhouette -->
          <rect x="70" y="65" width="75" height="30" rx="8" fill="#6c5ce7"/>
          <circle cx="90" cy="98" r="10" fill="#2d3436"/>
          <circle cx="130" cy="98" r="10" fill="#2d3436"/>
          <polygon points="85,65 100,45 130,45 140,65" fill="#a29bfe"/>
          <!-- Fuel Gauge Box -->
          <rect x="185" y="30" width="85" height="60" rx="10" fill="#ffffff" stroke="#6c5ce7" stroke-width="2"/>
          <text x="195" y="52" fill="#6c5ce7" font-size="11" font-weight="800">3 L = 33 km</text>
          <text x="195" y="74" fill="#00b894" font-size="12" font-weight="900">11 L = 121 km</text>
          <line x1="145" y1="80" x2="185" y2="80" stroke="#6c5ce7" stroke-dasharray="3,3" stroke-width="2"/>
        </svg>
      `,
      commentaryHtml: `
        <strong>Mathematical Proportional Modeling:</strong><br>
        Setting up the rate proportion $\\frac{x}{121} = \\frac{3}{33}$ yields $33x = 363 \\implies x = 11\\text{ liters}$. Modern vehicle dashboard telemetry continuously evaluates this direct proportion to calculate real-time driving range.
      `
    },
    {
      accent: '#00b894',
      accentBg: 'rgba(0, 184, 148, 0.12)',
      icon: 'fa-solid fa-cake-candles',
      tag: 'Culinary Chemistry',
      title: 'Smart Bakery Recipe Scaling',
      desc: 'Culinary chemistry and commercial bakery operations rely on exact proportional scaling to ensure recipe consistency from small batches to banquet orders.',
      svg: `
        <svg width="100%" height="150" viewBox="0 0 300 150">
          <!-- 3 cakes vs 15 cakes visual -->
          <g transform="translate(40, 40)">
            <rect x="0" y="30" width="40" height="25" rx="5" fill="#fdcb6e"/>
            <rect x="5" y="15" width="30" height="18" rx="4" fill="#ff7675"/>
            <text x="-5" y="75" fill="#2d3436" font-size="11" font-weight="800">3 Cakes = 5 Cups</text>
          </g>
          <line x1="125" y1="65" x2="165" y2="65" stroke="#00b894" stroke-width="3" stroke-dasharray="4,4"/>
          <polygon points="165,65 155,59 155,71" fill="#00b894"/>
          <g transform="translate(180, 25)">
            <rect x="0" y="45" width="70" height="30" rx="6" fill="#fdcb6e"/>
            <rect x="10" y="25" width="50" height="23" rx="5" fill="#ff7675"/>
            <rect x="20" y="10" width="30" height="18" rx="4" fill="#74b9ff"/>
            <text x="-5" y="95" fill="#00b894" font-size="12" font-weight="900">15 Cakes = 25 Cups</text>
          </g>
        </svg>
      `,
      commentaryHtml: `
        <strong>Proportional Scaling Formula:</strong><br>
        With a baseline ratio of $\\frac{5\\text{ cups}}{3\\text{ cakes}}$, producing 15 cakes scales the ingredients by a factor of 5: $S = 15 \\times \\frac{5}{3} = 25\\text{ cups of sugar}$.
      `
    },
    {
      accent: '#e17055',
      accentBg: 'rgba(225, 112, 85, 0.12)',
      icon: 'fa-solid fa-moon',
      tag: 'Space Physics & Gravitation',
      title: 'Earth vs. Moon Gravity Ratio',
      desc: 'Astrophysics and planetary exploration compare gravitational acceleration across celestial bodies through linear proportional relationships.',
      svg: `
        <svg width="100%" height="150" viewBox="0 0 300 150">
          <!-- Earth Circle -->
          <circle cx="75" cy="75" r="45" fill="rgba(9, 132, 227, 0.15)" stroke="#0984e3" stroke-width="2.5"/>
          <text x="50" y="65" fill="#0984e3" font-size="11" font-weight="800">🌍 Earth</text>
          <text x="45" y="85" fill="#2d3436" font-size="11" font-weight="700">90 N ➜ 60 N</text>
          <!-- Moon Circle -->
          <circle cx="225" cy="75" r="30" fill="rgba(253, 203, 110, 0.2)" stroke="#f39c12" stroke-width="2"/>
          <text x="205" y="70" fill="#f39c12" font-size="11" font-weight="800">🌕 Moon</text>
          <text x="205" y="88" fill="#e17055" font-size="11" font-weight="900">15 N ➜ 10 N</text>
          <path d="M 125 75 Q 150 40 185 75" fill="none" stroke="#e17055" stroke-width="2.5" stroke-dasharray="3,3"/>
        </svg>
      `,
      commentaryHtml: `
        <strong>Gravitational Proportionality:</strong><br>
        The lunar surface gravity is directly proportional to Earth gravity by the constant ratio $k = \\frac{15}{90} = \\frac{1}{6}$. A probe weighing 60 N on Earth weighs exactly $60 \\times \\frac{1}{6} = 10\\text{ Newtons}$ on the Moon.
      `
    }
  ],

  // 3. Core Foundation Card (From PDF page 1)
  foundation: {
    badge: 'Core Mathematical Foundation',
    subBadge: 'Equality of Ratios & Cross Multiplication',
    formulaText: '$$\\frac{a}{b} = \\frac{c}{d} \\iff a \\times d = b \\times c$$',
    formulaSubtext: 'A proportion is an equality of at least two ratios or rates. For four quantities $a, b, c, d$ in proportion, the product of extremes equals the product of means.',
    rules: [
      { num: 1, title: 'Extremes & Means Structure', desc: 'In $a:b = c:d$, $a$ and $d$ are the Extremes; $b$ and $c$ are the Means.' },
      { num: 2, title: 'Cross Multiplication Property', desc: 'Product of Extremes = Product of Means: $a \\times d = b \\times c$. If $ad = bc$, then $a, b, c, d$ are proportional.' },
      { num: 3, title: 'Simplest Form Equivalence', desc: 'Two ratios form a proportion if both reduce to the same irreducible fraction (e.g. $\\frac{8}{10} = \\frac{4}{5} = \\frac{12}{15}$).' },
      { num: 4, title: 'Zero Denominator Rule', desc: 'In any proportion $\\frac{a}{b} = \\frac{c}{d}$, denominators must be non-zero ($b \\ne 0, d \\ne 0$).' }
    ]
  },

  // 4. Special Cases Encyclopedic Section (From PDF pages 4 & 7)
  specialCases: [
    {
      icon: 'fa-solid fa-chart-line',
      title: '1. Graphical Representation & Origin Test',
      diagramSvg: `
        <svg width="100%" height="110" viewBox="0 0 240 110">
          <line x1="30" y1="95" x2="220" y2="95" stroke="#b2bec3" stroke-width="1.5"/>
          <line x1="40" y1="10" x2="40" y2="105" stroke="#b2bec3" stroke-width="1.5"/>
          <!-- Proportional line through origin -->
          <line x1="40" y1="95" x2="200" y2="20" stroke="#00b894" stroke-width="2.5"/>
          <circle cx="40" cy="95" r="4" fill="#00b894"/>
          <text x="45" y="105" font-size="10" font-weight="800" fill="#00b894">(0, 0)</text>
          <text x="110" y="35" font-size="10" font-weight="800" fill="#00b894">Proportion: Straight via (0, 0)</text>
        </svg>
      `,
      items: [
        'Points form a straight line passing through $(0, 0) \\implies$ <strong>Proportional</strong> ($y = kx$).',
        'Points do NOT pass through $(0, 0)$ or are curved $\\implies$ <strong>Not Proportional</strong>.'
      ]
    },
    {
      icon: 'fa-solid fa-shapes',
      title: '2. Geometric Perimeter Proportions',
      diagramSvg: `
        <svg width="100%" height="110" viewBox="0 0 240 110">
          <polygon points="60,20 25,85 95,85" fill="rgba(108, 92, 231, 0.15)" stroke="#6c5ce7" stroke-width="2"/>
          <text x="45" y="100" font-size="10" font-weight="800" fill="#6c5ce7">Side s, P = 3s</text>
          <rect x="140" y="30" width="55" height="55" rx="6" fill="rgba(241, 196, 15, 0.15)" stroke="#f1c40f" stroke-width="2"/>
          <text x="135" y="100" font-size="10" font-weight="800" fill="#f1c40f">Square: P = 4s</text>
        </svg>
      `,
      items: [
        '<strong>Equilateral Triangles:</strong> $\\frac{\\text{Perimeter}}{\\text{Side}} = \\frac{3s}{s} = 3$ (Constant ratio $\\implies$ Proportion!).',
        '<strong>Squares:</strong> $\\frac{\\text{Perimeter}}{\\text{Side}} = 4$ (Constant ratio $\\implies$ Proportion!).'
      ]
    },
    {
      icon: 'fa-solid fa-balance-scale',
      title: '3. Rate Equivalence vs Ratio',
      diagramSvg: `
        <svg width="100%" height="110" viewBox="0 0 240 110">
          <rect x="20" y="25" width="90" height="60" rx="8" fill="rgba(0, 184, 148, 0.1)" stroke="#00b894" stroke-width="1.5"/>
          <text x="32" y="50" font-size="11" font-weight="800" fill="#00b894">Ratio:</text>
          <text x="28" y="70" font-size="10" fill="#2d3436">Same Units (4:8)</text>
          <rect x="130" y="25" width="95" height="60" rx="8" fill="rgba(225, 112, 85, 0.1)" stroke="#e17055" stroke-width="1.5"/>
          <text x="145" y="50" font-size="11" font-weight="800" fill="#e17055">Rate:</text>
          <text x="135" y="70" font-size="10" fill="#2d3436">Diff Units (8 eggs/2 c)</text>
        </svg>
      `,
      items: [
        '<strong>Ratio:</strong> Comparison of two quantities of the same kind and same units.',
        '<strong>Rate:</strong> Comparison of two quantities of different kinds/units.'
      ]
    }
  ],

  // 5. Pedagogical Ideas (Flashcard + 2 Solved Examples + 1 Try It Yourself)
  ideas: [
    {
      id: 1,
      badge: '💡',
      flashcardTitle: 'Idea 1: Testing Proportions via Cross Products & Simplification',
      flashcardText: '<strong>Golden Rule:</strong> Cross multiply $(a \\times d)$ and $(b \\times c)$. If the two products are identical, the pair represents a proportion. If they differ by even 1, it is NOT a proportion!',
      ex1Tag: 'Solved Example 1.1 • Non-Proportion Case',
      ex1Q: 'Determine whether the pair of ratios $\\frac{3}{8}$ and $\\frac{6}{10}$ represents a proportion.',
      ex1Steps: [
        { num: 'Step 1', text: 'Multiply the Extremes: $3 \\times 10 = 30$.' },
        { num: 'Step 2', text: 'Multiply the Means: $8 \\times 6 = 48$.' },
        { num: 'Step 3', text: 'Compare the products: $30 \\ne 48$ (Product of extremes $\\ne$ Product of means).' },
        { num: 'Step 4', text: 'Alternative simplification: $\\frac{6}{10} = \\frac{3}{5}$, but $\\frac{3}{8} \\ne \\frac{3}{5}$.' }
      ],
      ex1Ans: 'Therefore, $\\frac{3}{8}$ and $\\frac{6}{10}$ do NOT represent a proportion.',

      ex2Tag: 'Solved Example 1.2 • Verified Proportion Case',
      ex2Q: 'Determine whether the pair of ratios $\\frac{8}{10}$ and $\\frac{12}{15}$ represents a proportion.',
      ex2Steps: [
        { num: 'Step 1', text: 'Multiply the Extremes: $8 \\times 15 = 120$.' },
        { num: 'Step 2', text: 'Multiply the Means: $10 \\times 12 = 120$.' },
        { num: 'Step 3', text: 'Product of Extremes = Product of Means ($120 = 120$).' },
        { num: 'Step 4', text: 'Alternative simplification: $\\frac{8 \\div 2}{10 \\div 2} = \\frac{4}{5}$ and $\\frac{12 \\div 3}{15 \\div 3} = \\frac{4}{5}$. Since $\\frac{4}{5} = \\frac{4}{5}$, they are equivalent.' }
      ],
      ex2Ans: 'Therefore, $\\frac{8}{10}$ and $\\frac{12}{15}$ represent a valid proportion.',

      tryBadge: 'Try It Yourself 1 (Your Turn)',
      tryPrompt: 'Determine which of the following pairs of ratios represents a proportion:<br>1) $\\frac{5}{7}$ and $\\frac{10}{14}$ &nbsp;&nbsp;&nbsp;&nbsp; 2) $\\frac{4}{12}$ and $\\frac{3}{9}$',
      tryCanvasId: 'can-try1',
      trySolId: 'sol-try-1',
      trySolution: '1) $5 \\times 14 = 70$ and $7 \\times 10 = 70 \\implies$ <strong>IS a proportion</strong>.<br>2) $4 \\times 9 = 36$ and $12 \\times 3 = 36 \\implies$ <strong>IS a proportion</strong>.'
    },

    {
      id: 2,
      badge: '🎯',
      flashcardTitle: 'Idea 2: Solving for Unknowns in Proportions (Linear & Binomial Terms)',
      flashcardText: '<strong>Strategy Guide:</strong> When an unknown is inside a binomial like $(x - 3)$ or has a coefficient like $2x$, isolate the group first using cross-multiplication: $x - 3 = \\frac{b \\times c}{d}$, then solve for $x$ by adding 3!',
      ex1Tag: 'Solved Example 2.1 • Direct Linear Variable',
      ex1Q: 'Solve the following proportions for $x$:<br>1) $\\frac{4}{12} = \\frac{20}{x}$ &nbsp;&nbsp;&nbsp;&nbsp; 2) $\\frac{4}{7} = \\frac{x}{35}$',
      ex1Steps: [
        { num: 'Step 1', text: 'For 1: Cross multiply: $4 \\times x = 12 \\times 20 \\implies 4x = 240$.' },
        { num: 'Step 2', text: 'Divide by 4: $x = \\frac{240}{4} = 60$.' },
        { num: 'Step 3', text: 'For 2: Cross multiply: $7 \\times x = 4 \\times 35 \\implies 7x = 140$.' },
        { num: 'Step 4', text: 'Divide by 7: $x = \\frac{140}{7} = 20$.' }
      ],
      ex1Ans: '1) $x = 60$, &nbsp;&nbsp; 2) $x = 20$.',

      ex2Tag: 'Solved Example 2.2 • Binomial & Coefficient Variables',
      ex2Q: 'Solve the following proportions for $x$:<br>1) $\\frac{3}{x - 3} = \\frac{12}{8}$ &nbsp;&nbsp;&nbsp;&nbsp; 2) $\\frac{40}{2x} = \\frac{5}{7}$',
      ex2Steps: [
        { num: 'Step 1', text: 'For 1: Apply cross-multiplication: $12 \\times (x - 3) = 3 \\times 8 = 24$.' },
        { num: 'Step 2', text: 'Divide by 12: $x - 3 = \\frac{24}{12} = 2 \\implies x = 2 + 3 = 5$.' },
        { num: 'Step 3', text: 'For 2: Cross multiply: $5 \\times (2x) = 40 \\times 7 \\implies 10x = 280$.' },
        { num: 'Step 4', text: 'Divide by 10: $x = \\frac{280}{10} = 28$.' }
      ],
      ex2Ans: '1) $x = 5$, &nbsp;&nbsp; 2) $x = 28$.',

      tryBadge: 'Try It Yourself 2 (Your Turn)',
      tryPrompt: 'Find the value of $x$ in each of the following:<br>1) $\\frac{x}{32} = \\frac{9}{36}$ &nbsp;&nbsp;&nbsp;&nbsp; 2) $\\frac{8}{x - 1} = \\frac{16}{10}$',
      tryCanvasId: 'can-try2',
      trySolId: 'sol-try-2',
      trySolution: '1) $x = \\frac{32 \\times 9}{36} = \\frac{32}{4} = 8$.<br>2) $16(x - 1) = 8 \\times 10 = 80 \\implies x - 1 = \\frac{80}{16} = 5 \\implies x = 5 + 1 = 6$.'
    },

    {
      id: 3,
      badge: '📈',
      flashcardTitle: 'Idea 3: Graphical Coordinate Representations & Proportional Tables',
      flashcardText: '<strong>Origin Line Rule:</strong> A table of values represents a proportion if and only if $\\frac{y}{x} = k$ (a constant unit rate) for all pairs, meaning their plotted points lie on a straight line that passes directly through $(0, 0)$.',
      ex1Tag: 'Solved Example 3.1 • Distance vs Time Table',
      ex1Q: 'A car covers distances according to the table: (1 hr, 70 km), (2 hr, 140 km), (3 hr, 210 km), (4 hr, 280 km). Determine whether the relationship represents a proportion.',
      ex1Steps: [
        { num: 'Step 1', text: 'Calculate the ratio $\\frac{\\text{Distance}}{\\text{Time}}$ for each pair: $\\frac{70}{1} = 70$, $\\frac{140}{2} = 70$, $\\frac{210}{3} = 70$, $\\frac{280}{4} = 70$.' },
        { num: 'Step 2', text: 'All pairs have the exact same constant rate $k = 70\\text{ km/h}$.' },
        { num: 'Step 3', text: 'Plotting $(0, 0), (1, 70), (2, 140), (3, 210), (4, 280)$ creates a straight line passing through $(0, 0)$.' }
      ],
      ex1Ans: 'The distance covered is directly proportional to time in hours.',

      ex2Tag: 'Solved Example 3.2 • Non-Proportional Table',
      ex2Q: 'Another vehicle logs: (1 hr, 80 km), (2 hr, 100 km), (3 hr, 190 km), (4 hr, 260 km). Determine if it represents a proportion.',
      ex2Steps: [
        { num: 'Step 1', text: 'Calculate ratios: $\\frac{80}{1} = 80$, $\\frac{100}{2} = 50$, $\\frac{190}{3} \\approx 63.3$.' },
        { num: 'Step 2', text: 'Since $80 \\ne 50 \\ne 63.3$, the ratio $\\frac{y}{x}$ is NOT constant.' },
        { num: 'Step 3', text: 'The points do not form a straight line passing through the origin $(0, 0)$.' }
      ],
      ex2Ans: 'This relationship does NOT represent a proportion.',

      tryBadge: 'Try It Yourself 3 (Your Turn)',
      tryPrompt: 'Adam types pages on a computer: Time (1 hr ➜ 3 p), (2 hr ➜ 6 p), (3 hr ➜ 9 p), (4 hr ➜ 21 p). Determine whether the number of pages is proportional to time.',
      tryCanvasId: 'can-try3',
      trySolId: 'sol-try-3',
      trySolution: 'Check ratios: $\\frac{3}{1} = 3$, $\\frac{6}{2} = 3$, $\\frac{9}{3} = 3$, but for the 4th hour: $\\frac{21}{4} = 5.25 \\ne 3$.<br>Since the 4th pair does not match, the relationship is <strong>NOT proportional</strong>!'
    }
  ],

  // 10 MCQ Questions (From PDF pages 5, 6, 7)
  mcqs: [
    {
      id: 1,
      q: "A proportion is defined as:",
      options: ["The sum of two fractions", "The equality of at least two ratios or rates", "The difference between extremes and means", "A single simplified fraction"],
          correct: 1,
      proof: "By standard mathematical definition: A proportion is an equality of at least two ratios or two rates (e.g. $\\frac{a}{b} = \\frac{c}{d}$)."
    },
    {
      id: 2,
      q: "If $a, b, c, d$ are proportional quantities, then the product of the extremes is equal to:",
      options: ["$a + d$", "$b \\div c$", "$b \\times c$ (product of means)", "$a \\times b$"],
          correct: 2,
      proof: "By the Cross Multiplication Property: In any proportion $\\frac{a}{b} = \\frac{c}{d}$, Product of Extremes ($a \\times d$) = Product of Means ($b \\times c$)."
    },
    {
      id: 3,
      q: "If $\\frac{3}{4} = \\frac{x}{20}$, then $x = $",
      options: ["12", "5", "60", "15"],
          correct: 3,
      proof: "$4x = 3 \\times 20 = 60 \\implies x = \\frac{60}{4} = 15$."
    },
    {
      id: 4,
      q: "If $\\frac{l - 3}{12} = \\frac{5}{4}$, then $l = $",
      options: ["18", "15", "12", "8"],
          correct: 0,
      proof: "$4(l - 3) = 12 \\times 5 = 60 \\implies l - 3 = 15 \\implies l = 15 + 3 = 18$."
    },
    {
      id: 5,
      q: "In a school, there are 221 students and 13 teachers. If the number of students increases to 272, how many teachers are needed to maintain the same ratio?",
      options: ["18 teachers", "14 teachers", "16 teachers", "20 teachers"],
          correct: 2,
      proof: "$\\frac{221}{13} = 17$ students per teacher. To maintain the ratio: $\\frac{272}{x} = 17 \\implies x = \\frac{272}{17} = 16$ teachers."
    },
    {
      id: 6,
      q: "If $\\frac{3}{4}$ liter of milk costs 24 pounds, how much would $1\\frac{3}{4}$ liters of milk cost at the same rate?",
      options: ["48 pounds", "32 pounds", "64 pounds", "56 pounds"],
          correct: 3,
      proof: "Price per liter $= 24 \\div \\frac{3}{4} = 24 \\times \\frac{4}{3} = 32$ pounds/liter. For $1\\frac{3}{4} = \\frac{7}{4}$ liters: $\\frac{7}{4} \\times 32 = 7 \\times 8 = 56$ pounds."
    },
    {
      id: 7,
      q: "Omar bought 8 apples for 60 LE. How many apples of the same type can he buy for 105 LE?",
      options: ["14 apples", "12 apples", "15 apples", "16 apples"],
          correct: 0,
      proof: "$\\frac{8}{60} = \\frac{x}{105} \\implies x = \\frac{8 \\times 105}{60} = \\frac{840}{60} = 14$ apples."
    },
    {
      id: 8,
      q: "A car uses 5 liters of petrol to cover a distance of 40 km. How much petrol would the car need to cover 128 km at the same rate?",
      options: ["20 liters", "16 liters", "12 liters", "25 liters"],
          correct: 1,
      proof: "Fuel consumption rate is $\\frac{5}{40} = \\frac{1}{8}$ liter/km. For 128 km: $128 \\times \\frac{1}{8} = 16$ liters."
    },
    {
      id: 9,
      q: "Eman reads 10 pages in 40 minutes. How many hours would it take her to read a book of 120 pages at the same rate?",
      options: ["12 hours", "4 hours", "6 hours", "8 hours"],
          correct: 3,
      proof: "Time for 120 pages in minutes $= \\frac{40 \\times 120}{10} = 480$ minutes. Convert to hours: $\\frac{480}{60} = 8$ hours."
    },
    {
      id: 10,
      q: "A tractor cultivates 840 square meters of land in 3 hours. What area of land does it cultivate in 5 hours at the same rate?",
      options: ["1,400 square meters", "1,200 square meters", "1,680 square meters", "1,500 square meters"],
          correct: 0,
      proof: "Rate $= \\frac{840}{3} = 280\\text{ m}^2/\\text{hour}$. In 5 hours: $280 \\times 5 = 1,400\\text{ square meters}$."
    }
  ],

  // 3 Timed Quiz Models (30 Questions Total)
  quizModels: [
    {
      title: "Timed Quiz — Model #1 (Definitions & Core Proportions)",
      questions: [
        {
          q: "1. If $\\frac{a}{b} = \\frac{c}{d}$, which of the following statements is always true?",
          options: ["$a + d = b + c$", "$a \\times d = b \\times c$", "$a \\times c = b \\times d$", "$a - b = c - d$"],
          correct: 1,
          proof: "Product of extremes ($ad$) equals product of means ($bc$)."
        },
        {
          q: "2. In the proportion $3 : 4 = 6 : 8$, the extremes are:",
          options: ["4 and 6", "3 and 4", "3 and 8", "6 and 8"],
          correct: 2,
          proof: "The first and fourth terms ($3$ and $8$) are the extremes."
        },
        {
          q: "3. If $\\frac{20}{25} = \\frac{36}{x}$, then $x = $",
          options: ["40", "30", "45", "50"],
          correct: 2,
          proof: "$\\frac{20}{25} = \\frac{4}{5} = \\frac{36}{x} \\implies 4x = 180 \\implies x = 45$."
        },
        {
          q: "4. Which of the following pairs of ratios represents a valid proportion?",
          options: ["$\\frac{2}{5}$ and $\\frac{4}{15}$", "$\\frac{15}{25}$ and $\\frac{30}{50}$", "$\\frac{3}{4}$ and $\\frac{6}{9}$", "$\\frac{10}{3}$ and $\\frac{40}{15}$"],
          correct: 1,
          proof: "$15 \\times 50 = 750$ and $25 \\times 30 = 750$. Both equal $\\frac{3}{5}$."
        },
        {
          q: "5. If $7 : 8 = 21 : m$, then $m = $",
          options: ["24", "28", "16", "32"],
          correct: 0,
          proof: "$7m = 8 \\times 21 = 168 \\implies m = \\frac{168}{7} = 24$."
        },
        {
          q: "6. If $a : 16 = 5 : 4$, then $a = $",
          options: ["24", "15", "18", "20"],
          correct: 3,
          proof: "$4a = 16 \\times 5 = 80 \\implies a = 20$."
        },
        {
          q: "7. If $\\frac{6}{x} = \\frac{12}{14}$, then $x = $",
          options: ["8", "7", "6", "10"],
          correct: 1,
          proof: "$12x = 6 \\times 14 = 84 \\implies x = 7$."
        },
        {
          q: "8. In the proportion $\\frac{1}{3} = \\frac{2}{b + 1}$, the value of $b$ is:",
          options: ["6", "4", "5", "7"],
          correct: 2,
          proof: "$b + 1 = 3 \\times 2 = 6 \\implies b = 6 - 1 = 5$."
        },
        {
          q: "9. If $\\frac{8}{y} = \\frac{y}{2}$ where $y$ is a positive integer, then $y = $",
          options: ["16", "2", "8", "4"],
          correct: 3,
          proof: "$y^2 = 8 \\times 2 = 16 \\implies y = 4$."
        },
        {
          q: "10. Which four numbers are proportional in order?",
          options: ["5, 8, 15, 24", "7, 8, 14, 15", "12, 27, 16, 18", "8, 24, 6, 12"],
          correct: 0,
          proof: "$\\frac{5}{8}$ and $\\frac{15}{24} = \\frac{5}{8}$ (Equal!)."
        }
      ]
    },

    {
      title: "Timed Quiz — Model #2 (Binomials & Algebraic Proportions)",
      questions: [
        {
          q: "1. If $\\frac{16}{3x} = \\frac{8}{12}$, then $x = $",
          options: ["6", "4", "8", "12"],
          correct: 2,
          proof: "$24x = 16 \\times 12 = 192 \\implies x = 8$."
        },
        {
          q: "2. If $\\frac{5}{x - 2} = \\frac{15}{21}$, then $x = $",
          options: ["7", "11", "8", "9"],
          correct: 3,
          proof: "$15(x - 2) = 105 \\implies x - 2 = 7 \\implies x = 9$."
        },
        {
          q: "3. If the ratio of boys to girls in a class is $3 : 5$ and there are 15 boys, the number of girls is:",
          options: ["25", "20", "30", "35"],
          correct: 0,
          proof: "$\\frac{3}{5} = \\frac{15}{G} \\implies 3G = 75 \\implies G = 25$."
        },
        {
          q: "4. If $\\frac{2x + 1}{5} = \\frac{9}{15}$, then $x = $",
          options: ["2", "1", "3", "0"],
          correct: 1,
          proof: "$\\frac{9}{15} = \\frac{3}{5} \\implies 2x + 1 = 3 \\implies 2x = 2 \\implies x = 1$."
        },
        {
          q: "5. If $\\frac{10}{4} = \\frac{x}{14}$, then $x = $",
          options: ["28", "40", "32", "35"],
          correct: 3,
          proof: "$4x = 140 \\implies x = 35$."
        },
        {
          q: "6. If $\\frac{x}{6} = \\frac{12}{x}$ for positive $x$, then $x = $",
          options: ["$\\sqrt{72} = 6\\sqrt{2}$", "72", "6", "12"],
          correct: 0,
          proof: "$x^2 = 72 \\implies x = \\sqrt{72} = 6\\sqrt{2}$."
        },
        {
          q: "7. If $3, x, 12, 20$ are proportional, then $x = $",
          options: ["6", "5", "4", "8"],
          correct: 1,
          proof: "$\\frac{3}{x} = \\frac{12}{20} = \\frac{3}{5} \\implies x = 5$."
        },
        {
          q: "8. If $\\frac{2}{3} = \\frac{0.5}{x}$, then $x = $",
          options: ["1.5", "0.25", "0.75", "1.25"],
          correct: 2,
          proof: "$2x = 3 \\times 0.5 = 1.5 \\implies x = 0.75$."
        },
        {
          q: "9. If $\\frac{1}{2} = \\frac{x}{8} = \\frac{5}{y}$, then $x + y = $",
          options: ["10", "12", "14", "16"],
          correct: 2,
          proof: "$x = 4$, $y = 10 \\implies x + y = 4 + 10 = 14$."
        },
        {
          q: "10. A proportion requires at least how many equal ratios or rates?",
          options: ["Three", "Two", "Four", "One"],
          correct: 1,
          proof: "A proportion requires an equality of at least two ratios."
        }
      ]
    },

    {
      title: "Timed Quiz — Model #3 (Word Problems, Science & Graphs)",
      questions: [
        {
          q: "1. A printer prints 36 pages in 3 minutes. How many pages does it print in 8 minutes?",
          options: ["96 pages", "72 pages", "108 pages", "84 pages"],
          correct: 0,
          proof: "Rate $= 36 \\div 3 = 12$ pages/min. In 8 mins: $12 \\times 8 = 96$ pages."
        },
        {
          q: "2. If a tractor cultivates 840 m² in 3 hours, how many hours are needed to cultivate 1,960 m²?",
          options: ["8 hours", "6 hours", "9 hours", "7 hours"],
          correct: 3,
          proof: "Rate $= 280$ m²/h. Time $= 1960 \\div 280 = 7$ hours."
        },
        {
          q: "3. Ibrahim saves 300 LE in 2 months, 600 LE in 4 months, 900 LE in 6 months. Are the savings proportional to months?",
          options: ["No, savings vary", "Yes, with constant rate 150 LE/month", "Yes, with constant rate 300 LE/month", "No, rate decreases"],
          correct: 1,
          proof: "$\\frac{300}{2} = \\frac{600}{4} = \\frac{900}{6} = 150$ LE/month (Constant!)."
        },
        {
          q: "4. The graph of a proportional relationship between two variables $x$ and $y$ must be:",
          options: ["Any curve", "A straight line that does not pass through origin", "A straight line passing through the origin (0, 0)", "A circle"],
          correct: 2,
          proof: "Direct proportionality graph is always a straight line through $(0, 0)$."
        },
        {
          q: "5. If side length of an equilateral triangle doubles, its perimeter:",
          options: ["Triples", "Quadruples", "Remains unchanged", "Doubles"],
          correct: 3,
          proof: "$P = 3s$. If $s \\to 2s$, $P \\to 3(2s) = 2(3s) = 2P$."
        },
        {
          q: "6. A worker can paint a wall in 4 hours, and another worker can paint it in 2 hours. If they work together, how many minutes will they need?",
          options: ["80 minutes", "90 minutes", "120 minutes", "60 minutes"],
          correct: 0,
          proof: "Combined rate $= \\frac{1}{4} + \\frac{1}{2} = \\frac{3}{4}$ wall/hour. Time $= \\frac{4}{3}$ hours $= \\frac{4}{3} \\times 60 = 80$ minutes."
        },
        {
          q: "7. If 6 pens cost 18 LE, how much do 15 pens cost?",
          options: ["30 LE", "50 LE", "45 LE", "40 LE"],
          correct: 2,
          proof: "$\\frac{18}{6} = 3$ LE/pen. $15 \\times 3 = 45$ LE."
        },
        {
          q: "8. A car covers 180 km in 2 hours. At the same speed, how long will it take to travel 450 km?",
          options: ["4.5 hours", "6 hours", "4 hours", "5 hours"],
          correct: 3,
          proof: "Speed $= 180 \\div 2 = 90$ km/h. Time $= 450 \\div 90 = 5$ hours."
        },
        {
          q: "9. If $\\frac{x}{3} = \\frac{y}{5}$, then $\\frac{x}{y} = $",
          options: ["$\\frac{3}{5}$", "$\\frac{5}{3}$", "$\\frac{15}{1}$", "$\\frac{8}{15}$"],
          correct: 0,
          proof: "$\\frac{x}{3} = \\frac{y}{5} \\implies 5x = 3y \\implies \\frac{x}{y} = \\frac{3}{5}$."
        },
        {
          q: "10. Which table does NOT show a proportional relationship?",
          options: ["Time: 1, 2, 3 | Distance: 6, 12, 18", "Time: 1, 2, 3 | Cost: 25, 45, 65 (Delivery fee added)", "Weight: 1, 2, 3 | Price: 45, 90, 135", "Hours: 2, 4, 6 | Money: 300, 600, 900"],
          correct: 1,
          proof: "$\\frac{25}{1} \\ne \\frac{45}{2} = 22.5$ due to the fixed delivery fee, so it does not pass through $(0, 0)$."
        }
      ]
    }
  ]
};

