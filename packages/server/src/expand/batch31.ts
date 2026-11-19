/**
 * Batch 31: a fourth top-up (Food) for the last 228 questions towards 1,000 (owner, 18 Nov 2026). Wikidata holds fruit and vegetable cultivars in bulk
 * (the live game already has "apple variety" and "grape variety" built the same way), so: pears, potatoes, tomatoes, mangoes, plums, peaches, strawberries,
 * olives, apricots, figs, citrus, bananas.
 * Build with: npx tsx src/expand/newq.ts --batch batch31 --out C:/Users/weibi/minitude/list-build/batch31
 */
import type { NewQuestion } from './newq'
import { mk } from './batch8'

const an = (w: string): string => (/^[aeiou]/i.test(w) ? 'an' : 'a')

/** a cultivar (variety) of a crop */
const VARIETY = (id: string, crop: string, classes: string[], minSignal: number, mustHave: string[]): NewQuestion =>
  mk('Food', {
    id: `food-${id}-variety`, prompt: `Name ${an(crop)} ${crop} variety.`, what: `any named variety or cultivar of ${crop}, such as the ones sold in shops or grown by gardeners, with or without the word ${crop}`,
    not: `The ${crop} species itself and varieties of other crops do not count.`,
    source: `Wikidata cultivars of the crop, known in at least ${minSignal} language${minSignal > 1 ? 's' : ''}.`,
    pattern: `?item wdt:P31/wdt:P279* ?cls . VALUES ?cls { ${classes.map((c) => 'wd:' + c).join(' ')} } .`, minSignal, mustHave,
  })

export const BATCH: NewQuestion[] = [
  VARIETY('pear', 'pear', ['Q20898395'], 1, ['Conference', 'Bartlett', 'Williams\' Bon Chrétien', 'Anjou', 'Bosc', 'Comice', 'Concorde', 'Forelle', 'Rocha', 'Seckel', 'Nashi', 'Packham\'s Triumph', 'Abate Fetel', 'Beurré Hardy', 'Red Williams', 'Asian pear']),
  VARIETY('potato', 'potato', ['Q132567429', 'Q16682342'], 1, ['Russet Burbank', 'King Edward', 'Maris Piper', 'Yukon Gold', 'Desiree', 'Charlotte', 'Jersey Royal', 'Kennebec', 'Pink Fir Apple', 'Red Pontiac', 'Idaho', 'Estima', 'Agria', 'Bintje', 'Shetland Black', 'Russet']),
  VARIETY('tomato', 'tomato', ['Q109122706'], 1, ['Roma', 'Beefsteak', 'San Marzano', 'Cherry tomato', 'Brandywine', 'Moneymaker', 'Better Boy', 'Early Girl', 'Cherokee Purple', 'Gardener\'s Delight', 'Black Krim', 'Green Zebra', 'Sungold', 'Marmande', 'Tigerella', 'Heirloom']),
  VARIETY('mango', 'mango', ['Q27068180'], 1, ['Alphonso', 'Tommy Atkins', 'Haden', 'Kent', 'Keitt', 'Ataulfo', 'Kesar', 'Chaunsa', 'Langra', 'Dasheri', 'Carabao', 'Nam Dok Mai', 'Totapuri', 'Banganapalli', 'Irwin', 'Palmer']),
  VARIETY('plum', 'plum', ['Q115606891'], 1, ['Victoria', 'Damson', 'Greengage', 'Mirabelle', 'Santa Rosa', 'Opal', 'Czar', 'Marjorie\'s Seedling', 'Stanley', 'Italian prune', 'Angeleno', 'Black Amber', 'Satsuma', 'Methley', 'President', 'Pershore Yellow Egg']),
  VARIETY('peach', 'peach', ['Q134454354'], 1, ['Elberta', 'Redhaven', 'Georgia Belle', 'Suncrest', 'Frost', 'Peregrine', 'Rochester', 'Nectarine', 'Flat peach', 'Saturn', 'Early Elberta', 'Cresthaven', 'Madame Moulin', 'White Lady', 'Bonanza', 'Sunhigh']),
  VARIETY('strawberry', 'strawberry', ['Q133300398'], 1, ['Albion', 'Camarosa', 'Elsanta', 'Cambridge Favourite', 'Honeoye', 'Chandler', 'Seascape', 'Sweet Charlie', 'Earliglow', 'Hapil', 'Symphony', 'Eros', 'Florence', 'Evie 2', 'Flamenco', 'Fragaria × ananassa']),
  VARIETY('olive', 'olive', ['Q12179886'], 1, ['Arbequina', 'Kalamata', 'Picual', 'Manzanilla', 'Koroneiki', 'Frantoio', 'Leccino', 'Hojiblanca', 'Mission', 'Nocellara del Belice', 'Cornicabra', 'Gordal', 'Coratina', 'Taggiasca', 'Ascolana', 'Cerignola']),
  VARIETY('apricot', 'apricot', ['Q133455038'], 1, ['Moorpark', 'Blenheim', 'Royal', 'Tilton', 'Goldcot', 'Hargrand', 'Harcot', 'Early Golden', 'Moongold', 'Perfection', 'Rival', 'Alfred', 'Tomcot', 'Orangered', 'Bergeron', 'Luizet']),
  VARIETY('fig', 'fig', ['Q83393031'], 1, ['Brown Turkey', 'Black Mission', 'Kadota', 'Calimyrna', 'Smyrna', 'Adriatic', 'Celeste', 'Brunswick', 'Violette de Bordeaux', 'Negronne', 'White Marseilles', 'Ventura', 'Panachée', 'Texas Everbearing', 'Genoa', 'Sultane']),
  VARIETY('citrus', 'citrus fruit', ['Q110526701'], 1, ['Valencia orange', 'Navel orange', 'Meyer lemon', 'Eureka lemon', 'Satsuma', 'Clementine', 'Tangelo', 'Bergamot orange', 'Blood orange', 'Seville orange', 'Key lime', 'Bearss lime', 'Ruby Red grapefruit', 'Cara Cara', 'Kumquat', 'Yuzu']),
  VARIETY('banana', 'banana', ['Q133305909'], 1, ['Cavendish', 'Gros Michel', 'Lady Finger', 'Plantain', 'Red banana', 'Blue Java', 'Pisang Awak', 'Manzano', 'Burro', 'Goldfinger', 'Orinoco', 'Rajapuri', 'Dwarf Cavendish', 'Williams', 'Latundan', 'Saba']),
]
