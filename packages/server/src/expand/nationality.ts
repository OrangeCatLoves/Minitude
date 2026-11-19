/**
 * Nationality words for the "a <nationality> <occupation>" questions (Batches 25 to 28, 18 Nov 2026).
 * Wikidata's "country of citizenship" is full of honorary and dual citizens (Thomas Paine and Bakunin are "French", Lafayette is "American", a Welsh international
 * is "British"), so a person only counts when the one-line description ALSO names the nationality, in any of the words below. A person with no description at
 * all is kept (the filter in `notDescribedAs` only drops what has a description that says otherwise).
 */

const W: Record<string, string> = {
  English: 'english|england',
  British: 'british|english|scottish|welsh|northern irish|england|scotland|wales|united kingdom',
  American: 'american|united states|u\\.s\\.',
  French: 'french|france',
  German: 'german|germany|prussian|bavarian|saxon',
  Italian: 'italian|italy|florentine|venetian|roman|tuscan|neapolitan|bolognese|milanese|sienese|sicilian|genoese',
  Spanish: 'spanish|spain|catalan|basque|andalusian|castilian|valencian|galician',
  Brazilian: 'brazilian|brazil',
  Argentine: 'argentine|argentinian|argentina',
  Dutch: 'dutch|netherlands|netherlandish',
  Portuguese: 'portuguese|portugal',
  Indian: 'indian|india|bengali|tamil|telugu|marathi|punjabi|malayalam|kannada|hindi|gujarati',
  Australian: 'australian|australia',
  Pakistani: 'pakistani|pakistan',
  Russian: 'russian|russia|soviet',
  Japanese: 'japanese|japan',
  Austrian: 'austrian|austria|viennese',
  Chinese: 'chinese|china',
  'South Korean': 'korean|south korea',
  Turkish: 'turkish|turkey|ottoman',
  Finnish: 'finnish|finland',
  Norwegian: 'norwegian|norway',
  Mexican: 'mexican|mexico',
  Danish: 'danish|denmark',
  Polish: 'polish|poland',
  Thai: 'thai|thailand',
  Canadian: 'canadian|canada',
}

/** the description test for "a <adj> <occupation>": the occupation words AND one of the nationality words */
export const describedAs = (adj: string, occupation: RegExp): RegExp => {
  const words = W[adj]
  if (!words) throw new Error('no nationality words for ' + adj)
  return new RegExp(`^(?=.*(?:${occupation.source}))(?=.*(?:\\b(?:${words})\\b)).*$`, 'i')
}
