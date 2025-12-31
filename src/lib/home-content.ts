import type { Lang } from './i18n-dict';

type WorkflowStep = { title: string; description: string };

type Feature = { title: string; description: string };

type Audience = { title: string; description: string };

type Reason = { title: string; description: string };

type AdSlot = { slotKey: string; title: string; description: string };

type CoinPricingCard = {
  id: string;
  badge: string;
  title: string;
  price: string;
  description: string;
  highlights: string[];
};

type SubscriptionPlanId = 'free' | 'starter' | 'pro' | 'business';

type SubscriptionPlan = {
  id: SubscriptionPlanId;
  badge: string;
  title: string;
  price: string;
  description: string;
  highlights: string[];
};

type PlanFeatureRow = { feature: string; values: Record<SubscriptionPlanId, string> };

export type HomeContent = {
  workflowSteps: WorkflowStep[];
  featureList: Feature[];
  audience: Audience[];
  kiHighlights: string[];
  reasons: Reason[];
  adSlotsLeft: AdSlot[];
  adSlotsRight: AdSlot[];
  coinPricingCards: CoinPricingCard[];
  subscriptionPlans: SubscriptionPlan[];
  subscriptionPlanOrder: SubscriptionPlanId[];
  planFeatureRows: PlanFeatureRow[];
};

const subscriptionPlanOrder: SubscriptionPlanId[] = ['free', 'starter', 'pro', 'business'];

const de: HomeContent = {
  workflowSteps: [
    {
      title: 'Template auswählen',
      description:
        'Starte mit einer Vorlage für dein Use-Case: Support-Chat, Aufgabenverwaltung, Zeiterfassung, Analytics, Dokumentation und mehr. Ein Klick – und dein erstes Projekt ist angelegt.',
    },
    {
      title: 'Mit KI erweitern',
      description:
        'Beschreibe in eigenen Worten, was deine App können soll. Die KI legt passende Seiten, Abschnitte und Inhalte an – inklusive Farben, Layouts und Strukturen, die zu deinem Projekt passen.',
    },
    {
      title: 'Im Editor anpassen & testen',
      description:
        'Feinschliff machst du im visuellen Editor: Texte, Buttons, Abschnitte, Layout – alles per Drag & Drop. Mit QR-Code öffnest du deine App direkt auf dem Smartphone und testest sie live.',
    },
  ],
  featureList: [
    {
      title: 'Projekt-Dashboard',
      description:
        'Verwalte alle deine App-Projekte an einem Ort, filtere nach Status und öffne jede App mit einem Klick im Editor.',
    },
    {
      title: 'Visueller Editor',
      description:
        'Bearbeite Seiten im Phone-Frame, verschiebe Elemente per Drag & Drop, passe Eigenschaften im Property-Panel an und wechsle schnell zwischen Seiten.',
    },
    {
      title: 'KI-gestützte Seitenerstellung',
      description:
        'Lass aus einer einfachen Beschreibung komplette App-Strukturen generieren: Startseiten, Sektionen, CTAs, Tools – abgestimmt auf deine Branche.',
    },
    {
      title: 'Spezielle Tool-Seiten',
      description:
        'Greife auf fertige Bausteine zu: Chat-Support, Aufgabenverwaltung, Zeiterfassung, Analytics-Dashboard, Support-Doku, QR-Tools und mehr.',
    },
    {
      title: 'Öffentliche Vorschau & QR-Code',
      description:
        'Teile deine App über eine Vorschau-URL oder QR-Code. Ideal, um Feedback von Team, Kund:innen oder Tester:innen einzuholen.',
    },
    {
      title: 'Abrechnung & Billing-Bereich',
      description:
        'Upgrade dein Konto, wenn du mehr brauchst: Integriertes Billing mit Stripe, klar getrennte Projekte und jederzeit erweiterbar.',
    },
    {
      title: 'Rechtlich sauber unterwegs',
      description:
        'Impressum, Datenschutz und Legal-Modal sind eingebaut – so kannst du deine App professionell präsentieren und bleibst auf der sicheren Seite.',
    },
  ],
  audience: [
    {
      title: 'Gründer:innen & Solo-Selbstständige',
      description:
        'Baue in wenigen Stunden einen klickbaren Prototypen für dein Produkt, teste dein Angebot mit echten Nutzer:innen und überzeuge Investor:innen oder Partner.',
    },
    {
      title: 'Agenturen & Freelancer',
      description:
        'Erstelle Demo-Apps für Kund:innen, präsentiere Varianten im Browser und passe Layouts live im Gespräch an – ohne jedes Mal bei null anzufangen.',
    },
    {
      title: 'Unternehmen & Teams',
      description:
        'Setze interne Tools wie Zeiterfassung, Aufgabenboards, Support-Apps oder Dashboards um, ohne deine IT-Abteilung zu blockieren.',
    },
  ],
  kiHighlights: [
    'Erkennt Branche, Farben & Stil automatisch',
    'Generiert mehrere Seiten auf einmal',
    'Ideal für erste Versionen, Pitches und interne Tools',
  ],
  reasons: [
    {
      title: 'Schneller Start statt leere Leinwand',
      description:
        'Templates und Tool-Seiten geben dir Struktur, bevor du überhaupt eine Zeile Text geschrieben hast.',
    },
    {
      title: 'Alles in einer Plattform',
      description:
        'Vom Projektmanagement über den Editor bis zur Vorschau: Du musst nicht zwischen fünf Tools springen.',
    },
    {
      title: 'Echte Apps testen, nicht nur Konzepte',
      description:
        'Teile deine Vorschau mit Kund:innen oder Kolleg:innen – per Link oder QR-Code – und sammle Feedback, bevor du groß investierst.',
    },
    {
      title: 'Skalierbar durch Abos & Funktionen',
      description: 'Starte klein, erweitere bei Bedarf – ohne den Überblick über deine Projekte zu verlieren.',
    },
  ],
  adSlotsLeft: [
    {
      slotKey: 'HOME_LEFT_PRIMARY',
      title: 'Partner-Spot 01',
      description: 'Zeig dein Lieblings-Plugin für Prototyping und sichere dir Leads direkt im Editor.',
    },
    {
      slotKey: 'HOME_LEFT_SECONDARY',
      title: 'Early-Bird Deal',
      description: '20 % Rabatt auf Illustrationen & Mockups von Studio Forma – nur diese Woche.',
    },
  ],
  adSlotsRight: [
    {
      slotKey: 'HOME_RIGHT_PRIMARY',
      title: 'KI-Workshop',
      description: 'Live-Session: Konzepte in 60 Minuten zur klickbaren App. Jetzt Platz sichern.',
    },
    {
      slotKey: 'HOME_RIGHT_SECONDARY',
      title: 'Template-Marktplatz',
      description: 'Verkaufe deine App-Schablonen direkt in der AppSchmiede Community.',
    },
  ],
  coinPricingCards: [
    {
      id: 'coins-50',
      badge: 'Einsteiger',
      title: '50 Coins',
      price: '6,99 €',
      description: 'Perfekt, um einzelne Bausteine, Seiten oder KI-Läufe zu testen.',
      highlights: ['Bis zu 50 Komponenten oder Seiten', 'Ideal für Solo-Prototypen', 'Checkout via Karte oder PayPal'],
    },
    {
      id: 'coins-80',
      badge: 'Beliebt',
      title: '80 Coins',
      price: '8,99 €',
      description: 'Für kleine Projekte, die jede Woche neue Ideen ausprobieren.',
      highlights: ['Mehr Seiten für weniger Euro', 'Templates & KI beliebig kombinieren', 'Coins verfallen nicht'],
    },
    {
      id: 'coins-100',
      badge: 'Teams',
      title: '100 Coins',
      price: '9,49 €',
      description: 'Creator-Paket für wiederkehrende Sprints und Tests.',
      highlights: ['Reicht für viele Vorlagen-Imports', 'Coins teilbar im Workspace', 'Support bei Fragen'],
    },
    {
      id: 'coins-150',
      badge: 'Agenturen',
      title: '150 Coins',
      price: '13,99 €',
      description: 'Für Launch-Phasen mit mehr Seiten, KI und Assets.',
      highlights: ['Attraktiver Paketpreis je Coin', 'Luft für mehrere Projekte', 'Priorisierter Support'],
    },
    {
      id: 'coins-300',
      badge: 'Scale',
      title: '300 Coins',
      price: '26,99 €',
      description: 'Wenn mehrere Teams parallel an Templates & KI arbeiten.',
      highlights: ['Günstigster Coin-Preis pro Einheit', 'Perfekt für Agenturen', 'Sofort nach Kauf verfügbar'],
    },
  ],
  subscriptionPlans: [
    {
      id: 'free',
      badge: 'Kostenlos',
      title: 'Ohne Abo',
      price: '0 € pro Monat',
      description: 'Starte mit 30 Start-Coins und zahle nur, wenn du mehr benötigst.',
      highlights: ['1 Projekt verwalten', 'Basis-Bausteine & Vorlagen', 'Community-Support'],
    },
    {
      id: 'starter',
      badge: 'Neu',
      title: 'Spar Abo',
      price: '9,99 € pro Monat',
      description: 'Regelmäßige Coin-Aufladung für Solo-Maker:innen und kleine Teams.',
      highlights: ['80 Coins pro Monat inklusive', 'Bis zu 3 aktive Projekte', 'Alle Templates & KI-Tools'],
    },
    {
      id: 'pro',
      badge: 'Beliebt',
      title: 'Standard Abo',
      price: '19,99 € pro Monat',
      description: 'Für Teams, die parallel mehrere Konzepte testen und launchen.',
      highlights: ['150 Coins pro Monat inklusive', 'Bis zu 6 parallele Projekte', 'Priorisierte QR- & Export-Links'],
    },
    {
      id: 'business',
      badge: 'Premium',
      title: 'Premium Abo',
      price: '59,99 € pro Monat',
      description: 'Agenturen & Corporates mit individuellen Coin- und Support-Bedürfnissen.',
      highlights: ['Individuelle Coin-Budgets', 'Unbegrenzte Projekte', 'Bevorzugter Support & Workshops'],
    },
  ],
  subscriptionPlanOrder,
  planFeatureRows: [
    {
      feature: 'Coins pro Monat',
      values: {
        free: '0 (nur Startguthaben)',
        starter: '80 Coins',
        pro: '150 Coins',
        business: 'Individuell vereinbar',
      },
    },
    {
      feature: 'Aktive Projekte',
      values: {
        free: '1 Projekt',
        starter: '3 Projekte',
        pro: '6 Projekte',
        business: 'Unbegrenzt',
      },
    },
    {
      feature: 'Vorlagen & Bausteine',
      values: {
        free: 'Basis-Bibliothek',
        starter: 'Alle Templates',
        pro: 'Alle + KI-Varianten',
        business: 'Alle + Custom Libraries',
      },
    },
    {
      feature: 'Smartphone-Vorschau & QR',
      values: {
        free: '✓ (mit Branding)',
        starter: '✓',
        pro: '✓',
        business: '✓',
      },
    },
  ],
};

const en: HomeContent = {
  workflowSteps: [
    {
      title: 'Pick a template',
      description:
        'Start from a ready-made template for your use case: support chat, task management, time tracking, analytics, documentation, and more. One click — and your first project is created.',
    },
    {
      title: 'Extend with AI',
      description:
        'Describe in your own words what your app should do. The AI generates matching pages, sections and content — including colors, layouts and structure that fit your project.',
    },
    {
      title: 'Customize & test in the editor',
      description:
        'Finish the details in the visual editor: text, buttons, sections, layouts — all via drag & drop. With a QR code you can open your app on your phone and test it live.',
    },
  ],
  featureList: [
    {
      title: 'Project dashboard',
      description:
        'Manage all your app projects in one place, filter by status, and open any app in the editor with one click.',
    },
    {
      title: 'Visual editor',
      description:
        'Edit pages inside a phone frame, move elements via drag & drop, tweak properties in the panel, and switch quickly between pages.',
    },
    {
      title: 'AI-powered page generation',
      description:
        'Generate complete app structures from a simple prompt: home screens, sections, CTAs, tools — tailored to your industry.',
    },
    {
      title: 'Built-in tool pages',
      description:
        'Use ready-made building blocks: support chat, tasks, time tracking, analytics dashboard, support docs, QR tools, and more.',
    },
    {
      title: 'Public preview & QR code',
      description:
        'Share your app via a preview URL or QR code. Perfect for collecting feedback from your team, clients, or testers.',
    },
    {
      title: 'Billing & payments',
      description:
        'Upgrade whenever you need more: integrated Stripe billing, clearly separated projects, and scalable as you grow.',
    },
    {
      title: 'Legal pages included',
      description:
        'Imprint, privacy and a legal modal are included — so you can ship professionally and stay on the safe side.',
    },
  ],
  audience: [
    {
      title: 'Founders & solo makers',
      description:
        'Build a clickable prototype in hours, validate your offer with real users, and convince investors or partners.',
    },
    {
      title: 'Agencies & freelancers',
      description:
        'Create demo apps for clients, present variants in the browser, and adjust layouts live — without starting from scratch.',
    },
    {
      title: 'Companies & teams',
      description:
        'Build internal tools like time tracking, task boards, support apps or dashboards without blocking your IT department.',
    },
  ],
  kiHighlights: [
    'Auto-detects industry, colors & style',
    'Generates multiple pages at once',
    'Great for first versions, pitches and internal tools',
  ],
  reasons: [
    {
      title: 'Start fast, not from a blank canvas',
      description: 'Templates and tool pages give you structure before you write a single line of copy.',
    },
    {
      title: 'Everything in one platform',
      description: 'From project management to editor and preview: no tool-hopping between five apps.',
    },
    {
      title: 'Test real apps, not just concepts',
      description: 'Share a link or QR code and collect feedback early — before you invest big.',
    },
    {
      title: 'Scales with subscriptions & features',
      description: 'Start small and expand when needed — without losing track of your projects.',
    },
  ],
  adSlotsLeft: [
    {
      slotKey: 'HOME_LEFT_PRIMARY',
      title: 'Partner spot 01',
      description: 'Show your favorite prototyping plugin and get leads right inside the editor.',
    },
    {
      slotKey: 'HOME_LEFT_SECONDARY',
      title: 'Early-bird deal',
      description: '20% off illustrations & mockups from Studio Forma — this week only.',
    },
  ],
  adSlotsRight: [
    {
      slotKey: 'HOME_RIGHT_PRIMARY',
      title: 'AI workshop',
      description: 'Live session: turn concepts into a clickable app in 60 minutes. Reserve your seat now.',
    },
    {
      slotKey: 'HOME_RIGHT_SECONDARY',
      title: 'Template marketplace',
      description: 'Sell your app templates directly in the AppSchmiede community.',
    },
  ],
  coinPricingCards: [
    {
      id: 'coins-50',
      badge: 'Starter',
      title: '50 Coins',
      price: '€6.99',
      description: 'Perfect to try individual building blocks, pages, or AI runs.',
      highlights: ['Up to ~50 components or pages', 'Great for solo prototypes', 'Checkout via card or PayPal'],
    },
    {
      id: 'coins-80',
      badge: 'Popular',
      title: '80 Coins',
      price: '€8.99',
      description: 'For small projects that iterate on new ideas every week.',
      highlights: ['More pages for fewer euros', 'Mix templates & AI freely', 'Coins do not expire'],
    },
    {
      id: 'coins-100',
      badge: 'Teams',
      title: '100 Coins',
      price: '€9.49',
      description: 'A creator pack for recurring sprints and experiments.',
      highlights: ['Enough for lots of template imports', 'Shareable within your workspace', 'Support when you need it'],
    },
    {
      id: 'coins-150',
      badge: 'Agencies',
      title: '150 Coins',
      price: '€13.99',
      description: 'More headroom for launch phases with extra pages, AI and assets.',
      highlights: ['Better value per coin', 'Room for multiple projects', 'Priority support'],
    },
    {
      id: 'coins-300',
      badge: 'Scale',
      title: '300 Coins',
      price: '€26.99',
      description: 'When multiple teams work on templates & AI in parallel.',
      highlights: ['Best value per coin', 'Perfect for agencies', 'Available instantly after purchase'],
    },
  ],
  subscriptionPlans: [
    {
      id: 'free',
      badge: 'Free',
      title: 'No subscription',
      price: '€0 / month',
      description: 'Start with 30 starter coins and pay only when you need more.',
      highlights: ['Manage 1 project', 'Basic building blocks & templates', 'Community support'],
    },
    {
      id: 'starter',
      badge: 'New',
      title: 'Saver plan',
      price: '€9.99 / month',
      description: 'Regular coin top-ups for solo makers and small teams.',
      highlights: ['80 coins per month included', 'Up to 3 active projects', 'All templates & AI tools'],
    },
    {
      id: 'pro',
      badge: 'Popular',
      title: 'Standard plan',
      price: '€19.99 / month',
      description: 'For teams testing and launching multiple concepts in parallel.',
      highlights: ['150 coins per month included', 'Up to 6 parallel projects', 'Priority QR & export links'],
    },
    {
      id: 'business',
      badge: 'Premium',
      title: 'Premium plan',
      price: '€59.99 / month',
      description: 'Agencies & corporates with custom coin and support needs.',
      highlights: ['Custom coin budgets', 'Unlimited projects', 'Priority support & workshops'],
    },
  ],
  subscriptionPlanOrder,
  planFeatureRows: [
    {
      feature: 'Coins per month',
      values: {
        free: '0 (starter coins only)',
        starter: '80 coins',
        pro: '150 coins',
        business: 'Custom',
      },
    },
    {
      feature: 'Active projects',
      values: {
        free: '1 project',
        starter: '3 projects',
        pro: '6 projects',
        business: 'Unlimited',
      },
    },
    {
      feature: 'Templates & building blocks',
      values: {
        free: 'Basic library',
        starter: 'All templates',
        pro: 'All + AI variants',
        business: 'All + custom libraries',
      },
    },
    {
      feature: 'Mobile preview & QR',
      values: {
        free: '✓ (with branding)',
        starter: '✓',
        pro: '✓',
        business: '✓',
      },
    },
  ],
};

export function getHomeContent(lang: Lang): HomeContent {
  return lang === 'en' ? en : de;
}
