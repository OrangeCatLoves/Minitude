/** The 11 approved categories (project notes, section 4). The scope text is given to the model when it writes questions. */
export const CATEGORIES: { name: string; scope: string; example: string }[] = [
  { name: 'Places', scope: 'countries, cities, landmarks, rivers, mountains, islands and other geographic places', example: 'Name a landlocked country.' },
  { name: 'Food', scope: 'dishes, ingredients, beverages, cuisines, cooking methods and food varieties', example: 'Name a type of cheese.' },
  { name: 'Music', scope: 'artists, bands, songs, albums, instruments and musical genres', example: 'Name a percussion instrument.' },
  { name: 'Miscellaneous', scope: 'everyday objects, occupations, hobbies, household products and approachable unusual categories', example: 'Name something commonly sold in a tube.' },
  { name: 'Animals & Nature', scope: 'animals, plants, habitats and natural phenomena', example: 'Name a living species of flightless bird.' },
  { name: 'Movies & TV', scope: 'films, television shows, actors, directors and fictional characters', example: 'Name a Pixar feature film.' },
  { name: 'Sports', scope: 'sports, athletes, teams, competitions and sporting equipment', example: 'Name a racket sport.' },
  { name: 'Games', scope: 'video games, board games, card games, franchises and game characters', example: 'Name a video-game franchise.' },
  { name: 'Science & Technology', scope: 'chemistry, space, inventions, computing, devices and related subjects', example: 'Name a chemical element.' },
  { name: 'History & Mythology', scope: 'historical people, rulers, civilizations, events and mythological beings', example: 'Name an ancient Greek deity.' },
  { name: 'Transport & Vehicles', scope: 'vehicles, manufacturers, transport modes, vessels and transport infrastructure', example: 'Name a car manufacturer.' },
]

export function categoryByName(name: string) {
  const n = name.trim().toLowerCase()
  return CATEGORIES.find((c) => c.name.toLowerCase() === n)
}
