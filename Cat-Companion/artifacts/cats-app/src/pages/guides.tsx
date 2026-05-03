import { useState, useMemo } from "react";
import {
  BookOpen, Cat, TreePine, Baby, Home, Shield,
  Eye, AlertCircle, Heart, Clock, Scale, ArrowLeft, Search, Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ─── Data ──────────────────────────────────────────────────────────────── */

type Category = "Getting Started" | "Day-to-Day" | "Health" | "Understanding" | "Life Stages";

interface Guide {
  id: string;
  title: string;
  description: string;
  category: Category;
  icon: React.FC<any>;
  iconBg: string;
  iconColor: string;
  content: React.FC;
  textContent: string;
}

function downloadGuide(guide: Guide) {
  const body = `LOAFING — CARE GUIDE\n${"=".repeat(40)}\n\n${guide.title}\nCategory: ${guide.category}\n\n${guide.description}\n\n${"─".repeat(40)}\n\n${guide.textContent}\n\n${"─".repeat(40)}\nDownloaded from Loafing`;
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${guide.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

const CATEGORIES: Category[] = [
  "Getting Started",
  "Day-to-Day",
  "Health",
  "Understanding",
  "Life Stages",
];

const CATEGORY_COLORS: Record<Category, string> = {
  "Getting Started": "bg-primary/10 text-primary border-primary/20",
  "Day-to-Day":      "bg-amber-100 text-amber-800 border-amber-200",
  "Health":          "bg-rose-100 text-rose-700 border-rose-200",
  "Understanding":   "bg-violet-100 text-violet-700 border-violet-200",
  "Life Stages":     "bg-emerald-100 text-emerald-700 border-emerald-200",
};

/* ─── Article content components ─────────────────────────────────────────── */

function ArticleIntroducingCat() {
  return (
    <div className="space-y-5">
      <Section heading="Scent Before Sight">
        Start with scent swapping. Exchange bedding between cats for 1–2 weeks before any face-to-face
        meeting. This allows them to become familiar with each other in a non-threatening way.
      </Section>
      <Section heading="Create a Basecamp">
        Use a separate room for the new cat initially — equip it with food, water, litter, and
        comfortable hiding spots. This space is their safe haven while they adjust.
      </Section>
      <Section heading="Positive Associations">
        Feed cats on either side of a closed door so they associate each other's scent with something
        positive (dinner time!). Keep sessions short and always end on a calm note.
      </Section>
      <Section heading="Visual Introductions">
        Graduated visual introduction is key: crack the door slightly, then use a baby gate, and finally
        allow supervised short sessions together.
      </Section>
      <Callout>
        <strong>Signs of progress:</strong> slow blinking, relaxed body language, mutual grooming interest.
        <br />
        <strong>Signs to slow down:</strong> hissing, growling, puffed tails — go back a step, don't rush it.
      </Callout>
      <Italic>Timeline: expect 2–4 weeks minimum; some cats take months. Patience is everything.</Italic>
    </div>
  );
}

function ArticleHarnessTraining() {
  return (
    <div className="space-y-5">
      <p className="text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Choose the right harness:</strong> H-style or vest harnesses
        are most secure and escape-proof for cats. Never use a collar and lead alone.
      </p>
      <Section heading="Step 1 — Harness introduction">
        Leave the harness near their bed or food bowl for a few days so they get used to the smell and
        presence without any pressure.
      </Section>
      <Section heading="Step 2 — Wearing indoors">
        Put it on for 5–10 minutes at a time. Reward heavily with treats and calm praise. Build up the
        duration gradually over days.
      </Section>
      <Section heading="Step 3 — Add the lead">
        Let them drag the lead around inside (supervised) before you hold the other end. This removes
        the feeling of being constrained.
      </Section>
      <Section heading="Step 4 — First outdoor trips">
        Start in a quiet garden or enclosed balcony, not a busy street. Let them sniff and explore at
        their own pace.
      </Section>
      <Callout>
        Never pull a cat on a lead like a dog — let them set the pace and direction. If the cat freezes,
        pancakes to the floor, or panics, slow way down and make the process more gradual.
      </Callout>
      <Italic>Ideal age to start: kittens take to it faster, but adult cats can absolutely learn — it
        just takes a little longer.</Italic>
    </div>
  );
}

function ArticleBaby() {
  return (
    <div className="space-y-5">
      <Section heading="Prepare Early">
        Start playing baby sounds and using baby lotion months before the arrival so the cat adjusts
        gradually. Sudden changes are stressful — gradual ones are manageable.
      </Section>
      <Section heading="Create a Safe Zone">
        Designate a room the cat can always retreat to that the baby cannot access. This is non-negotiable
        — the cat must always have somewhere to go where they feel safe.
      </Section>
      <Section heading="Never Force Interaction">
        Let the cat approach the baby on its own terms. Forced proximity creates fear; choice creates
        comfort. Use treats when the baby is present so the association stays positive.
      </Section>
      <Section heading="Supervision">
        Supervise all contact, especially in the first year. Never leave them alone together, no
        matter how calm the relationship seems.
      </Section>
      <Callout>
        <strong>Watch for stress signals:</strong> hiding more than usual, over-grooming, changes in
        litter box habits. These need addressing early — a stressed cat is an unpredictable one.
      </Callout>
      <Italic>Most cats adjust well within a few months. The key is never making the cat feel replaced
        or pushed out.</Italic>
    </div>
  );
}

function ArticleMoving() {
  return (
    <div className="space-y-5">
      <Section heading="Before the Move">
        Keep routines as normal as possible. Cats feel disruption in packing activity. If possible,
        keep one room cat-free until the last moment so they always have a calm base.
      </Section>
      <Section heading="Moving Day">
        Keep the cat in one quiet, closed room with food, water, litter, and familiar bedding. Put a
        note on the door so movers don't accidentally open it.
      </Section>
      <Section heading="Transport">
        Use a secure carrier lined with something that smells of home. Cover it with a blanket — the
        darkness is calming. Drive calmly, don't blast music.
      </Section>
      <Section heading="First Days in the New Home">
        Confine to one room first. Let them explore gradually over days, not hours. Familiar items —
        their bed, blanket, scratching post — placed early make a huge difference.
      </Section>
      <Section heading="Outdoor Access">
        Keep windows and doors closed for at least two weeks before allowing any outdoor access. They
        need to imprint the new home as their territory first.
      </Section>
      <Callout>
        Scent marking (rubbing against everything) is healthy — let them do it. It's how they make
        the new place feel like theirs.
      </Callout>
      <Italic>Some cats settle in days; others take weeks. Don't panic if they hide a lot initially.</Italic>
    </div>
  );
}

function ArticleCatProofing() {
  return (
    <div className="space-y-5">
      <Section heading="Balconies and High Windows">
        Cats can and do fall from height — high-rise syndrome is real. Use mesh or cat nets on
        balconies and keep high windows restricted. This is the single most important safety step for
        flat-dwelling cats.
      </Section>
      <Section heading="Toxic Plants">
        Remove lilies (especially), aloe vera, pothos, and peace lily — all are dangerous to cats.
        When in doubt, check before buying a new plant.
      </Section>
      <Section heading="Cables and Electrics">
        Hide cables and chargers. Cats chew them, which is both a fire and electrocution risk. Cable
        management sleeves are cheap and effective.
      </Section>
      <Section heading="Appliances">
        Check washing machines and tumble dryers before every single use. Cats sleep inside them. This
        is not an exaggeration — it happens more than people think.
      </Section>
      <Section heading="Storage and Chemicals">
        Store cleaning products, medications, rubber bands, and string out of reach. Ingested string
        can cause fatal intestinal blockages.
      </Section>
      <Callout>
        <strong>Provide vertical space:</strong> shelves, cat trees, window perches. An understimulated
        indoor cat will find its own entertainment — usually destructive.
        Two cats are often happier than one indoors.
      </Callout>
    </div>
  );
}

function ArticleBodyLanguage() {
  return (
    <div className="space-y-5">
      <Section heading="Eyes and Face">
        A <strong>slow blink</strong> means "I trust you completely." Blink back slowly — it's the cat
        equivalent of a hug. <strong>Dilated pupils</strong> signal either excitement or fear; context
        matters. <strong>Half-closed eyes</strong> mean they're relaxed and content.
      </Section>
      <Section heading="Ears">
        <strong>Ears forward:</strong> curious and engaged. <strong>Flattened ears (airplane ears):</strong> fear
        or aggression — back off and give space. <strong>Ears swivelling independently:</strong> alert and
        gathering information.
      </Section>
      <Section heading="Tail">
        <strong>Tail held high:</strong> confident, happy, greeting you warmly. <strong>Puffed tail:</strong> frightened
        or startled — not aggression, don't approach. <strong>Low tail tucked:</strong> anxious or
        submissive. <strong>Lashing tail:</strong> overstimulated or irritated — stop what you're doing.
      </Section>
      <Section heading="Body">
        <strong>Belly exposed</strong> signals trust, but swatting when touched is not a contradiction —
        it means "I trust you but this is not an invitation." The belly trap is real. <strong>Sitting
        with back to you</strong> is the highest compliment: they feel completely safe with you behind them.
      </Section>
      <Callout>
        <strong>Slow rhythmic kneading</strong> (making biscuits) = deep contentment. They're happy.
        <br />
        <strong>Chattering at birds</strong> through the window = excitement and frustration. Completely normal.
      </Callout>
    </div>
  );
}

function ArticleWhenToWorry() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="font-semibold text-destructive text-base">See a vet today</h3>
        <div className="space-y-2">
          {[
            "Straining to urinate, especially male cats — can be fatal within hours.",
            "Any difficulty breathing, laboured or open-mouth breathing.",
            "Collapse, seizures, or sudden inability to use back legs.",
            "Not eaten for more than 48 hours.",
            "Third eyelid (inner eyelid) visible and staying visible.",
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
              <p className="text-muted-foreground leading-relaxed text-sm">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-amber-700 text-base">Worth a vet call (same week)</h3>
        <div className="space-y-2">
          {[
            "Vomiting more than 2–3 times a week.",
            "Noticeable weight loss over a few weeks.",
            "Drinking significantly more water than usual.",
            "Sneezing or runny nose lasting more than a week.",
            "Limping that doesn't resolve in a day or two.",
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <p className="text-muted-foreground leading-relaxed text-sm">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-foreground text-base">Watch and wait (a few days)</h3>
        <div className="space-y-2">
          {[
            "One vomit after eating too fast.",
            "Single loose stool with no other symptoms.",
            "One sneeze or two.",
            "Slightly reduced appetite for a day (especially in hot weather).",
            "Sleeping more than usual on a cold or rainy day.",
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 shrink-0" />
              <p className="text-muted-foreground leading-relaxed text-sm">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <Italic>The golden rule: you know your cat. If something feels off, it probably is.</Italic>
    </div>
  );
}

function ArticleGrief() {
  return (
    <div className="space-y-5">
      <Section heading="The Grief Is Real">
        Losing a cat is losing a family member, a daily ritual, a presence that shaped your home.
        It doesn't matter what anyone else says about "just a cat." The grief is proportional to the
        love, and that makes it legitimate.
      </Section>
      <Section heading="What to Expect">
        Physical symptoms are normal: disrupted sleep, reduced appetite, a persistent low feeling.
        The house feels different — quieter in a way that's hard to describe. This is part of it.
      </Section>
      <Section heading="Your Other Pets">
        Other pets grieve too. Watch them; they may need extra attention, routine, and gentle
        reassurance. Some pets search for weeks. Give them time.
      </Section>
      <Section heading="No Timeline">
        Some people feel better in weeks; others carry it for years. Both are valid. Don't let anyone
        rush you, and don't rush yourself.
      </Section>
      <Section heading="When to Consider Another Cat">
        Only when you genuinely want to — not to "fill the gap." No cat replaces another.
        When you're ready, giving a new cat a home is a beautiful thing. But there's no hurry.
      </Section>
      <Callout>
        Memorialising helps many people: a plant, a photo album, a small ritual on the anniversary
        of when they came home.
        The fact that it hurts this much means you gave them a wonderful life. That matters.
      </Callout>
    </div>
  );
}

function ArticleSenior() {
  return (
    <div className="space-y-5">
      <p className="text-muted-foreground leading-relaxed">
        Cats are generally considered senior from age 11, and geriatric from 15. A healthy 15-year-old
        cat is a real achievement — and the result of years of attentive care.
      </p>
      <Section heading="What Changes">
        They sleep more (up to 20 hours a day), show less interest in play, and may become more vocal —
        especially at night. Increased night-time vocalisation is worth a vet check; it can indicate
        cognitive changes or pain.
      </Section>
      <Section heading="Joints and Mobility">
        Joint stiffness is common and underdiagnosed in cats. Watch for reluctance to jump, a stiff
        gait in the morning, or avoiding stairs. Steps, ramps, and lower-sided litter trays make a
        real difference.
      </Section>
      <Section heading="Kidney Health">
        Kidney disease is the leading cause of death in senior cats. Annual blood work is genuinely
        important — many cases are manageable when caught early. Increased water intake is a key sign.
      </Section>
      <Section heading="Dental and Diet">
        Dental disease worsens with age — bad breath, drooling, or pawing at the mouth needs attention.
        Senior-specific food is often lower in phosphorus (kidney support) and easier to digest.
      </Section>
      <Callout>
        <strong>Warmth matters more as they age:</strong> heated beds, draft-free spots, a ramp or
        steps to favourite high places.
        More vet visits (every 6 months ideally) aren't pessimistic — they're how you catch things early.
      </Callout>
      <Italic>Mental engagement still matters — gentle play, new smells, window access. Don't stop
        just because they're older.</Italic>
    </div>
  );
}

function ArticleWeight() {
  return (
    <div className="space-y-5">
      <Section heading="Why It Happens">
        Indoor cats are prone to weight gain — it's a structural problem of modern pet-keeping, not a
        character flaw. Theirs or yours. Limited activity, calorie-dense food, and free-feeding are the
        usual culprits.
      </Section>
      <Section heading="How to Tell">
        You should be able to feel (not see) their ribs with gentle pressure. They should have a visible
        waist from above. If they look like a furry loaf from every angle, it's worth checking with
        your vet.
      </Section>
      <Section heading="Why It Matters">
        Excess weight stresses joints, the heart, and kidneys. Even 500g over ideal matters in a small
        animal — that's proportionally significant. Overweight cats also tend to groom less effectively
        and have reduced quality of life.
      </Section>
      <Section heading="What Actually Helps">
        Measured meals twice daily (weigh the food — guessing doesn't work), puzzle feeders to slow
        eating and add mental stimulation, and more active play. Use part of their daily food allowance
        as treats instead of adding on top.
      </Section>
      <Callout>
        <strong>Weight loss must be slow.</strong> Rapid weight loss in cats causes hepatic lipidosis
        (fatty liver disease), which is serious and sometimes fatal. A target of 1–2% body weight
        loss per week is safe. Work with your vet — they can calculate a daily calorie target.
      </Callout>
      <Italic>It takes a few months. It's absolutely worth it.</Italic>
    </div>
  );
}

/* ─── Guide definitions ──────────────────────────────────────────────────── */

const GUIDES: Guide[] = [
  {
    id: "introducing-cat",
    title: "Introducing a New Cat to Your Home",
    description: "A gradual, patient approach to building a lifelong feline friendship.",
    category: "Getting Started",
    icon: Cat,
    iconBg: "bg-primary/8",
    iconColor: "text-primary",
    content: ArticleIntroducingCat,
    textContent: `SCENT BEFORE SIGHT
Start with scent swapping. Exchange bedding between cats for 1–2 weeks before any face-to-face meeting. This allows them to become familiar with each other in a non-threatening way.

CREATE A BASECAMP
Use a separate room for the new cat initially — equip it with food, water, litter, and comfortable hiding spots. This space is their safe haven while they adjust.

POSITIVE ASSOCIATIONS
Feed cats on either side of a closed door so they associate each other's scent with something positive (dinner time!). Keep sessions short and always end on a calm note.

VISUAL INTRODUCTIONS
Graduated visual introduction is key: crack the door slightly, then use a baby gate, and finally allow supervised short sessions together.

Note: Signs of progress: slow blinking, relaxed body language, mutual grooming interest. Signs to slow down: hissing, growling, puffed tails — go back a step, don't rush it.

Timeline: expect 2–4 weeks minimum; some cats take months. Patience is everything.`,
  },
  {
    id: "harness-training",
    title: "How to Harness Train Your Cat",
    description: "Safe outdoor adventures start with the right preparation.",
    category: "Day-to-Day",
    icon: TreePine,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    content: ArticleHarnessTraining,
    textContent: `Choose the right harness: H-style or vest harnesses are most secure and escape-proof for cats. Never use a collar and lead alone.

STEP 1 — HARNESS INTRODUCTION
Leave the harness near their bed or food bowl for a few days so they get used to the smell and presence without any pressure.

STEP 2 — WEARING INDOORS
Put it on for 5–10 minutes at a time. Reward heavily with treats and calm praise. Build up the duration gradually over days.

STEP 3 — ADD THE LEAD
Let them drag the lead around inside (supervised) before you hold the other end. This removes the feeling of being constrained.

STEP 4 — FIRST OUTDOOR TRIPS
Start in a quiet garden or enclosed balcony, not a busy street. Let them sniff and explore at their own pace.

Note: Never pull a cat on a lead like a dog — let them set the pace and direction. If the cat freezes, pancakes to the floor, or panics, slow way down and make the process more gradual.

Ideal age to start: kittens take to it faster, but adult cats can absolutely learn — it just takes a little longer.`,
  },
  {
    id: "cat-baby",
    title: "Introducing a Cat to a Baby",
    description: "Preparing your feline friend for a new human family member.",
    category: "Getting Started",
    icon: Baby,
    iconBg: "bg-primary/8",
    iconColor: "text-primary",
    content: ArticleBaby,
    textContent: `PREPARE EARLY
Start playing baby sounds and using baby lotion months before the arrival so the cat adjusts gradually. Sudden changes are stressful — gradual ones are manageable.

CREATE A SAFE ZONE
Designate a room the cat can always retreat to that the baby cannot access. This is non-negotiable — the cat must always have somewhere to go where they feel safe.

NEVER FORCE INTERACTION
Let the cat approach the baby on its own terms. Forced proximity creates fear; choice creates comfort. Use treats when the baby is present so the association stays positive.

SUPERVISION
Supervise all contact, especially in the first year. Never leave them alone together, no matter how calm the relationship seems.

Note: Watch for stress signals: hiding more than usual, over-grooming, changes in litter box habits. These need addressing early — a stressed cat is an unpredictable one.

Most cats adjust well within a few months. The key is never making the cat feel replaced or pushed out.`,
  },
  {
    id: "moving-house",
    title: "Moving House with a Cat",
    description: "Minimising stress during a big transition.",
    category: "Day-to-Day",
    icon: Home,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    content: ArticleMoving,
    textContent: `BEFORE THE MOVE
Keep routines as normal as possible. Cats feel disruption in packing activity. If possible, keep one room cat-free until the last moment so they always have a calm base.

MOVING DAY
Keep the cat in one quiet, closed room with food, water, litter, and familiar bedding. Put a note on the door so movers don't accidentally open it.

TRANSPORT
Use a secure carrier lined with something that smells of home. Cover it with a blanket — the darkness is calming. Drive calmly, don't blast music.

FIRST DAYS IN THE NEW HOME
Confine to one room first. Let them explore gradually over days, not hours. Familiar items — their bed, blanket, scratching post — placed early make a huge difference.

OUTDOOR ACCESS
Keep windows and doors closed for at least two weeks before allowing any outdoor access. They need to imprint the new home as their territory first.

Note: Scent marking (rubbing against everything) is healthy — let them do it. It's how they make the new place feel like theirs.

Some cats settle in days; others take weeks. Don't panic if they hide a lot initially.`,
  },
  {
    id: "cat-proofing",
    title: "Cat-Proofing a Flat",
    description: "Essential safety tips specifically for indoor cats.",
    category: "Getting Started",
    icon: Shield,
    iconBg: "bg-primary/8",
    iconColor: "text-primary",
    content: ArticleCatProofing,
    textContent: `BALCONIES AND HIGH WINDOWS
Cats can and do fall from height — high-rise syndrome is real. Use mesh or cat nets on balconies and keep high windows restricted. This is the single most important safety step for flat-dwelling cats.

TOXIC PLANTS
Remove lilies (especially), aloe vera, pothos, and peace lily — all are dangerous to cats. When in doubt, check before buying a new plant.

CABLES AND ELECTRICS
Hide cables and chargers. Cats chew them, which is both a fire and electrocution risk. Cable management sleeves are cheap and effective.

APPLIANCES
Check washing machines and tumble dryers before every single use. Cats sleep inside them. This is not an exaggeration — it happens more than people think.

STORAGE AND CHEMICALS
Store cleaning products, medications, rubber bands, and string out of reach. Ingested string can cause fatal intestinal blockages.

Note: Provide vertical space: shelves, cat trees, window perches. An understimulated indoor cat will find its own entertainment — usually destructive. Two cats are often happier than one indoors.`,
  },
  {
    id: "body-language",
    title: "Reading Cat Body Language",
    description: "What your cat is actually saying.",
    category: "Understanding",
    icon: Eye,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-700",
    content: ArticleBodyLanguage,
    textContent: `EYES AND FACE
A slow blink means "I trust you completely." Blink back slowly — it's the cat equivalent of a hug. Dilated pupils signal either excitement or fear; context matters. Half-closed eyes mean they're relaxed and content.

EARS
Ears forward: curious and engaged. Flattened ears (airplane ears): fear or aggression — back off and give space. Ears swivelling independently: alert and gathering information.

TAIL
Tail held high: confident, happy, greeting you warmly. Puffed tail: frightened or startled — not aggression, don't approach. Low tail tucked: anxious or submissive. Lashing tail: overstimulated or irritated — stop what you're doing.

BODY
Belly exposed signals trust, but swatting when touched is not a contradiction — it means "I trust you but this is not an invitation." The belly trap is real. Sitting with back to you is the highest compliment: they feel completely safe with you behind them.

Note: Slow rhythmic kneading (making biscuits) = deep contentment. They're happy. Chattering at birds through the window = excitement and frustration. Completely normal.`,
  },
  {
    id: "when-to-worry",
    title: "When to Worry vs. Wait",
    description: "A practical, non-alarmist symptom guide.",
    category: "Health",
    icon: AlertCircle,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    content: ArticleWhenToWorry,
    textContent: `SEE A VET TODAY
- Straining to urinate, especially male cats — can be fatal within hours.
- Any difficulty breathing, laboured or open-mouth breathing.
- Collapse, seizures, or sudden inability to use back legs.
- Not eaten for more than 48 hours.
- Third eyelid (inner eyelid) visible and staying visible.

WORTH A VET CALL (SAME WEEK)
- Vomiting more than 2–3 times a week.
- Noticeable weight loss over a few weeks.
- Drinking significantly more water than usual.
- Sneezing or runny nose lasting more than a week.
- Limping that doesn't resolve in a day or two.

WATCH AND WAIT (A FEW DAYS)
- One vomit after eating too fast.
- Single loose stool with no other symptoms.
- One sneeze or two.
- Slightly reduced appetite for a day (especially in hot weather).
- Sleeping more than usual on a cold or rainy day.

The golden rule: you know your cat. If something feels off, it probably is.`,
  },
  {
    id: "grief",
    title: "Grief and Losing a Pet",
    description: "Navigating the quiet space they leave behind.",
    category: "Life Stages",
    icon: Heart,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-400",
    content: ArticleGrief,
    textContent: `THE GRIEF IS REAL
Losing a cat is losing a family member, a daily ritual, a presence that shaped your home. It doesn't matter what anyone else says about "just a cat." The grief is proportional to the love, and that makes it legitimate.

WHAT TO EXPECT
Physical symptoms are normal: disrupted sleep, reduced appetite, a persistent low feeling. The house feels different — quieter in a way that's hard to describe. This is part of it.

YOUR OTHER PETS
Other pets grieve too. Watch them; they may need extra attention, routine, and gentle reassurance. Some pets search for weeks. Give them time.

NO TIMELINE
Some people feel better in weeks; others carry it for years. Both are valid. Don't let anyone rush you, and don't rush yourself.

WHEN TO CONSIDER ANOTHER CAT
Only when you genuinely want to — not to "fill the gap." No cat replaces another. When you're ready, giving a new cat a home is a beautiful thing. But there's no hurry.

Note: Memorialising helps many people: a plant, a photo album, a small ritual on the anniversary of when they came home. The fact that it hurts this much means you gave them a wonderful life. That matters.`,
  },
  {
    id: "senior-care",
    title: "Senior Cat Care",
    description: "Supporting them through their golden years.",
    category: "Life Stages",
    icon: Clock,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    content: ArticleSenior,
    textContent: `Cats are generally considered senior from age 11, and geriatric from 15. A healthy 15-year-old cat is a real achievement — and the result of years of attentive care.

WHAT CHANGES
They sleep more (up to 20 hours a day), show less interest in play, and may become more vocal — especially at night. Increased night-time vocalisation is worth a vet check; it can indicate cognitive changes or pain.

JOINTS AND MOBILITY
Joint stiffness is common and underdiagnosed in cats. Watch for reluctance to jump, a stiff gait in the morning, or avoiding stairs. Steps, ramps, and lower-sided litter trays make a real difference.

KIDNEY HEALTH
Kidney disease is the leading cause of death in senior cats. Annual blood work is genuinely important — many cases are manageable when caught early. Increased water intake is a key sign.

DENTAL AND DIET
Dental disease worsens with age — bad breath, drooling, or pawing at the mouth needs attention. Senior-specific food is often lower in phosphorus (kidney support) and easier to digest.

Note: Warmth matters more as they age: heated beds, draft-free spots, a ramp or steps to favourite high places. More vet visits (every 6 months ideally) aren't pessimistic — they're how you catch things early.

Mental engagement still matters — gentle play, new smells, window access. Don't stop just because they're older.`,
  },
  {
    id: "weight",
    title: "Weight Management",
    description: "A warm, no-shame approach to keeping them healthy.",
    category: "Health",
    icon: Scale,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    content: ArticleWeight,
    textContent: `WHY IT HAPPENS
Indoor cats are prone to weight gain — it's a structural problem of modern pet-keeping, not a character flaw. Theirs or yours. Limited activity, calorie-dense food, and free-feeding are the usual culprits.

HOW TO TELL
You should be able to feel (not see) their ribs with gentle pressure. They should have a visible waist from above. If they look like a furry loaf from every angle, it's worth checking with your vet.

WHY IT MATTERS
Excess weight stresses joints, the heart, and kidneys. Even 500g over ideal matters in a small animal — that's proportionally significant. Overweight cats also tend to groom less effectively and have reduced quality of life.

WHAT ACTUALLY HELPS
Measured meals twice daily (weigh the food — guessing doesn't work), puzzle feeders to slow eating and add mental stimulation, and more active play. Use part of their daily food allowance as treats instead of adding on top.

Note: Weight loss must be slow. Rapid weight loss in cats causes hepatic lipidosis (fatty liver disease), which is serious and sometimes fatal. A target of 1–2% body weight loss per week is safe. Work with your vet — they can calculate a daily calorie target.

It takes a few months. It's absolutely worth it.`,
  },
];

/* ─── Shared prose helpers ───────────────────────────────────────────────── */

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="font-semibold text-foreground">{heading}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">{children}</p>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-secondary/20 border border-secondary/30 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed space-y-1">
      {children}
    </div>
  );
}

function Italic({ children }: { children: React.ReactNode }) {
  return (
    <p className="italic text-sm text-muted-foreground/80 leading-relaxed">{children}</p>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function Guides() {
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const openGuide = GUIDES.find((g) => g.id === openId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return GUIDES.filter((g) => {
      const matchesCat = activeCategory === "All" || g.category === activeCategory;
      const matchesSearch =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, search]);

  // Group for the "All" view
  const grouped: Partial<Record<Category, Guide[]>> = {};
  for (const g of filtered) {
    if (!grouped[g.category]) grouped[g.category] = [];
    grouped[g.category]!.push(g);
  }

  if (openGuide) {
    const Content = openGuide.content;
    const Icon = openGuide.icon;
    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="pl-0 text-muted-foreground hover:text-foreground -ml-1"
            onClick={() => setOpenId(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Library
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => downloadGuide(openGuide)}
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>

        <div className={cn("rounded-2xl p-8 flex justify-center items-center", openGuide.iconBg)}>
          <Icon className={cn("w-20 h-20 opacity-80", openGuide.iconColor)} strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className={cn("font-normal text-xs", CATEGORY_COLORS[openGuide.category])}>
            {openGuide.category}
          </Badge>
          <h1 className="text-3xl font-serif font-medium text-foreground leading-tight">
            {openGuide.title}
          </h1>
          <p className="text-muted-foreground">{openGuide.description}</p>
        </div>

        <div className="pt-2">
          <Content />
        </div>

        <div className="pt-4 border-t border-border/60">
          <Button
            variant="outline"
            className="w-full gap-2 text-muted-foreground"
            onClick={() => downloadGuide(openGuide)}
          >
            <Download className="h-4 w-4" />
            Download this guide as a text file
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-serif font-medium text-foreground">Care Guides</h1>
        <p className="text-muted-foreground mt-1">Essential reading for a happy, healthy cat.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search guides..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {(["All", ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Guide grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-card/30">
          <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground font-medium">No guides match "{search}"</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Try a different word or clear the search.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>Clear search</Button>
        </div>
      ) : activeCategory === "All" && !search ? (
        <div className="space-y-10">
          {(Object.entries(grouped) as [Category, Guide[]][]).map(([cat, guides]) => (
            <div key={cat} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {cat}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guides.map((g) => <GuideCard key={g.id} guide={g} onOpen={setOpenId} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((g) => <GuideCard key={g.id} guide={g} onOpen={setOpenId} />)}
        </div>
      )}
    </div>
  );
}

function GuideCard({ guide, onOpen }: { guide: Guide; onOpen: (id: string) => void }) {
  const Icon = guide.icon;
  return (
    <button
      onClick={() => onOpen(guide.id)}
      className="text-left w-full rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all p-4 flex gap-4 items-start group"
    >
      <div className={cn("rounded-xl p-3 shrink-0", guide.iconBg)}>
        <Icon className={cn("w-6 h-6", guide.iconColor)} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors">
            {guide.title}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{guide.description}</p>
        <Badge
          variant="outline"
          className={cn("font-normal text-xs mt-1", CATEGORY_COLORS[guide.category])}
        >
          {guide.category}
        </Badge>
      </div>
    </button>
  );
}
