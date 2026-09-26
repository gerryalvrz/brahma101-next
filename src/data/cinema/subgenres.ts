/**
 * Human-readable subgenres → TMDB keyword IDs.
 *
 * TMDB genres (Horror, Fantasy, …) are too coarse for “Folk Horror” /
 * “Cyberpunk” / etc. Keywords are the right granularity.
 *
 * IDs verified via TMDB `/search/keyword` + discover coverage.
 * Prefer high-coverage tags; OR-pipe synonyms when useful.
 *
 * Edit this file to add/retarget presets. Pipe `|` = OR in discover.
 */

export type CinemaSubgenreGroup =
  | "horror"
  | "speculative"
  | "crime-noir"
  | "action-martial"
  | "style-form"
  | "themes";

export type CinemaSubgenre = {
  /** URL / filter slug */
  id: string;
  label: string;
  description: string;
  group: CinemaSubgenreGroup;
  /**
   * TMDB keyword IDs joined for `with_keywords`.
   * Use `|` for OR (any match), `,` for AND (all must match).
   */
  withKeywords: string;
  /** IDs kept for docs / tooling */
  keywordIds: number[];
  /** Default min votes for Best-of charts (niche tags need lower floors). */
  defaultMinVotes?: number;
};

export const cinemaSubgenreGroups: {
  id: CinemaSubgenreGroup;
  label: string;
}[] = [
  { id: "horror", label: "Horror" },
  { id: "speculative", label: "Sci-Fi & Fantasy" },
  { id: "crime-noir", label: "Crime & Noir" },
  { id: "action-martial", label: "Action & Martial" },
  { id: "style-form", label: "Style & Form" },
  { id: "themes", label: "Themes" },
];

export const cinemaSubgenres: CinemaSubgenre[] = [
  // —— Horror ——
  {
    id: "dark-fantasy",
    label: "Dark Fantasy",
    description: "Fantasy with dread, shadow, and moral ambiguity.",
    group: "horror",
    keywordIds: [177895, 380804],
    withKeywords: "177895|380804",
    defaultMinVotes: 50,
  },
  {
    id: "folk-horror",
    label: "Folk Horror",
    description: "Rural rites, pagan dread, landscape as antagonist.",
    group: "horror",
    keywordIds: [209568, 362881],
    withKeywords: "209568|362881",
    defaultMinVotes: 40,
  },
  {
    id: "psychological-horror",
    label: "Psychological Horror",
    description: "Fear from mind, guilt, perception — not jump scares alone.",
    group: "horror",
    keywordIds: [295907],
    withKeywords: "295907",
    defaultMinVotes: 50,
  },
  {
    id: "body-horror",
    label: "Body Horror",
    description: "Flesh, mutation, and the body as site of terror.",
    group: "horror",
    keywordIds: [283085],
    withKeywords: "283085",
    defaultMinVotes: 40,
  },
  {
    id: "cosmic-horror",
    label: "Cosmic Horror",
    description: "Inhuman scale, unknowable dread, Lovecraftian chill.",
    group: "horror",
    keywordIds: [215959],
    withKeywords: "215959",
    defaultMinVotes: 20,
  },
  {
    id: "gothic-horror",
    label: "Gothic Horror",
    description: "Castles, curses, romance twisted into nightmare.",
    group: "horror",
    keywordIds: [15032],
    withKeywords: "15032",
    defaultMinVotes: 40,
  },
  {
    id: "slasher",
    label: "Slasher",
    description: "Masked killers, final girls, stalk-and-slash set pieces.",
    group: "horror",
    keywordIds: [12339],
    withKeywords: "12339",
    defaultMinVotes: 80,
  },
  {
    id: "found-footage",
    label: "Found Footage",
    description: "Horror through the diegetic camera.",
    group: "horror",
    keywordIds: [163053],
    withKeywords: "163053",
    defaultMinVotes: 60,
  },
  {
    id: "giallo",
    label: "Giallo",
    description: "Italian stylish murder mysteries — gloves, blood, glam.",
    group: "horror",
    keywordIds: [361094],
    withKeywords: "361094",
    defaultMinVotes: 20,
  },
  {
    id: "occult",
    label: "Occult",
    description: "Rituals, cults, and forbidden knowledge.",
    group: "horror",
    keywordIds: [156174],
    withKeywords: "156174",
    defaultMinVotes: 50,
  },
  {
    id: "witchcraft",
    label: "Witchcraft",
    description: "Witches, covens, and folk magic turned dark.",
    group: "horror",
    keywordIds: [40931],
    withKeywords: "40931",
    defaultMinVotes: 40,
  },
  {
    id: "haunted-house",
    label: "Haunted House",
    description: "Architecture that wants you gone.",
    group: "horror",
    keywordIds: [3358],
    withKeywords: "3358",
    defaultMinVotes: 60,
  },
  {
    id: "ghost",
    label: "Ghost",
    description: "Hauntings, spirits, unfinished business.",
    group: "horror",
    keywordIds: [162846],
    withKeywords: "162846",
    defaultMinVotes: 80,
  },
  {
    id: "vampire",
    label: "Vampire",
    description: "Blood, immortality, and nocturnal hunger.",
    group: "horror",
    keywordIds: [3133],
    withKeywords: "3133",
    defaultMinVotes: 80,
  },
  {
    id: "werewolf",
    label: "Werewolf",
    description: "Lunar transformations and beast within.",
    group: "horror",
    keywordIds: [12564],
    withKeywords: "12564",
    defaultMinVotes: 40,
  },
  {
    id: "zombie",
    label: "Zombie",
    description: "The hungry dead — outbreak to apocalypse.",
    group: "horror",
    keywordIds: [12377],
    withKeywords: "12377",
    defaultMinVotes: 80,
  },

  // —— Sci-Fi & Fantasy ——
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    description: "High tech, low life — neon cities and body/machine blur.",
    group: "speculative",
    keywordIds: [12190],
    withKeywords: "12190",
    defaultMinVotes: 50,
  },
  {
    id: "steampunk",
    label: "Steampunk",
    description: "Brass, steam, retro-futurist machines.",
    group: "speculative",
    keywordIds: [10028],
    withKeywords: "10028",
    defaultMinVotes: 20,
  },
  {
    id: "dystopia",
    label: "Dystopia",
    description: "Broken futures and authoritarian worlds.",
    group: "speculative",
    keywordIds: [4565],
    withKeywords: "4565",
    defaultMinVotes: 80,
  },
  {
    id: "post-apocalyptic",
    label: "Post-Apocalyptic",
    description: "After the end — ruins, survival, remaking.",
    group: "speculative",
    keywordIds: [4458, 359337],
    withKeywords: "4458|359337",
    defaultMinVotes: 60,
  },
  {
    id: "time-travel",
    label: "Time Travel",
    description: "Loops, paradoxes, and rewriting history.",
    group: "speculative",
    keywordIds: [4379],
    withKeywords: "4379",
    defaultMinVotes: 80,
  },
  {
    id: "space-opera",
    label: "Space Opera",
    description: "Galactic stakes, fleets, and mythic sci-fi.",
    group: "speculative",
    keywordIds: [161176],
    withKeywords: "161176",
    defaultMinVotes: 40,
  },
  {
    id: "kaiju",
    label: "Kaiju",
    description: "Giant monsters vs cities (and each other).",
    group: "speculative",
    keywordIds: [161791],
    withKeywords: "161791",
    defaultMinVotes: 40,
  },
  {
    id: "sword-and-sorcery",
    label: "Sword & Sorcery",
    description: "Heroes, blades, and sorcery in pulp-mythic worlds.",
    group: "speculative",
    keywordIds: [234213],
    withKeywords: "234213",
    defaultMinVotes: 30,
  },
  {
    id: "magical-realism",
    label: "Magical Realism",
    description: "The marvelous folded into everyday life.",
    group: "speculative",
    keywordIds: [333529, 156597],
    withKeywords: "333529|156597",
    defaultMinVotes: 40,
  },
  {
    id: "superhero",
    label: "Superhero",
    description: "Capes, powers, and origin myths — worldwide.",
    group: "speculative",
    keywordIds: [9715],
    withKeywords: "9715",
    defaultMinVotes: 100,
  },

  // —— Crime & Noir ——
  {
    id: "neo-noir",
    label: "Neo-Noir",
    description: "Modern noir: moral fog, crime, and stylized night.",
    group: "crime-noir",
    keywordIds: [207268],
    withKeywords: "207268",
    defaultMinVotes: 50,
  },
  {
    id: "film-noir",
    label: "Film Noir",
    description: "Classic shadow cinema — femmes, cops, doom.",
    group: "crime-noir",
    keywordIds: [9807],
    withKeywords: "9807",
    defaultMinVotes: 80,
  },
  {
    id: "tech-noir",
    label: "Tech Noir",
    description: "Noir mood meets machines and neon futures.",
    group: "crime-noir",
    keywordIds: [178657],
    withKeywords: "178657",
    defaultMinVotes: 15,
  },
  {
    id: "heist",
    label: "Heist",
    description: "The plan, the crew, the inevitable crack.",
    group: "crime-noir",
    keywordIds: [10051],
    withKeywords: "10051",
    defaultMinVotes: 60,
  },
  {
    id: "whodunit",
    label: "Whodunit",
    description: "Puzzle mysteries and drawing-room reveals.",
    group: "crime-noir",
    keywordIds: [12570],
    withKeywords: "12570",
    defaultMinVotes: 50,
  },
  {
    id: "espionage",
    label: "Espionage",
    description: "Spies, tradecraft, and double agents.",
    group: "crime-noir",
    keywordIds: [5265],
    withKeywords: "5265",
    defaultMinVotes: 60,
  },
  {
    id: "revenge",
    label: "Revenge",
    description: "Payback narratives across genres.",
    group: "crime-noir",
    keywordIds: [9748],
    withKeywords: "9748",
    defaultMinVotes: 100,
  },
  {
    id: "prison",
    label: "Prison",
    description: "Bars, codes, and escape — or endurance.",
    group: "crime-noir",
    keywordIds: [378],
    withKeywords: "378",
    defaultMinVotes: 80,
  },

  // —— Action & Martial ——
  {
    id: "samurai",
    label: "Samurai",
    description: "Bushido, blades, and feudal Japan cinema.",
    group: "action-martial",
    keywordIds: [1462],
    withKeywords: "1462",
    defaultMinVotes: 40,
  },
  {
    id: "wuxia",
    label: "Wuxia",
    description: "Martial chivalry, flying blades, honor codes.",
    group: "action-martial",
    keywordIds: [184656],
    withKeywords: "184656",
    defaultMinVotes: 30,
  },
  {
    id: "kung-fu",
    label: "Kung Fu",
    description: "Martial arts mastery and fight choreography.",
    group: "action-martial",
    keywordIds: [780],
    withKeywords: "780",
    defaultMinVotes: 50,
  },
  {
    id: "spaghetti-western",
    label: "Spaghetti Western",
    description: "Euro-western dust, morality, and Ennio vibes.",
    group: "action-martial",
    keywordIds: [156212],
    withKeywords: "156212",
    defaultMinVotes: 40,
  },

  // —— Style & Form ——
  {
    id: "surrealism",
    label: "Surrealism",
    description: "Dream logic, irrational images, anti-realism.",
    group: "style-form",
    keywordIds: [9887],
    withKeywords: "9887",
    defaultMinVotes: 60,
  },
  {
    id: "anthology",
    label: "Anthology",
    description: "Portmanteau films — many stories, one frame.",
    group: "style-form",
    keywordIds: [9706],
    withKeywords: "9706",
    defaultMinVotes: 50,
  },
  {
    id: "mockumentary",
    label: "Mockumentary",
    description: "Fiction wearing documentary clothes.",
    group: "style-form",
    keywordIds: [11800],
    withKeywords: "11800",
    defaultMinVotes: 50,
  },
  {
    id: "slow-cinema",
    label: "Slow Cinema",
    description: "Long takes, patience, duration as meaning.",
    group: "style-form",
    keywordIds: [228988],
    withKeywords: "228988",
    defaultMinVotes: 20,
  },
  {
    id: "grindhouse",
    label: "Grindhouse",
    description: "Exploitation grit, pulp energy, midnight fare.",
    group: "style-form",
    keywordIds: [11532],
    withKeywords: "11532",
    defaultMinVotes: 20,
  },
  {
    id: "road-movie",
    label: "Road Movie",
    description: "Highways, escape, and becoming someone else.",
    group: "style-form",
    keywordIds: [167043],
    withKeywords: "167043",
    defaultMinVotes: 50,
  },

  // —— Themes ——
  {
    id: "coming-of-age",
    label: "Coming of Age",
    description: "Youth, thresholds, and first fractures.",
    group: "themes",
    keywordIds: [10683],
    withKeywords: "10683",
    defaultMinVotes: 100,
  },
  {
    id: "biopic",
    label: "Biopic",
    description: "Lives retold — biography on screen.",
    group: "themes",
    keywordIds: [5565, 360939, 345513],
    withKeywords: "5565|360939|345513",
    defaultMinVotes: 80,
  },
  {
    id: "cold-war",
    label: "Cold War",
    description: "Iron Curtain tensions and spy-era dread.",
    group: "themes",
    keywordIds: [2106],
    withKeywords: "2106",
    defaultMinVotes: 50,
  },
];

// Deduplicate by id (found-footage was accidentally listed twice above in draft —
// keep a single clean array builder instead).
const seen = new Set<string>();
export const cinemaSubgenresUnique: CinemaSubgenre[] = [];
for (const s of cinemaSubgenres) {
  if (seen.has(s.id)) continue;
  seen.add(s.id);
  cinemaSubgenresUnique.push(s);
}

// Re-export cleaned list as the canonical array used by the app.
// (Overwrite meaning: importers use getSubgenreById / cinemaSubgenresClean.)
export { cinemaSubgenresUnique as cinemaSubgenresList };

export function getSubgenreById(id: string): CinemaSubgenre | undefined {
  return cinemaSubgenresUnique.find((s) => s.id === id);
}

export function subgenresByGroup(
  group: CinemaSubgenreGroup
): CinemaSubgenre[] {
  return cinemaSubgenresUnique.filter((s) => s.group === group);
}
