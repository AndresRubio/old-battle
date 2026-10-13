/**
 * Movement in centimetres, exactly as the Spanish army books print it, keyed by
 * the inches the data stores (OLD-46). The books give M in cm; the data files
 * hold it converted to inches, and the Spanish stat strip converts it back
 * through this table so it shows the book's own number.
 *
 * Not a formula: GW España rounded 2.5 cm/inch both ways (3"→8, 5"→12, 7"→18,
 * 9"→22). Every pair is read off the books, and the table is one-to-one over
 * every value they print — cross-checked against 294 profiles in the Spanish
 * transcriptions, so inverting it returns exactly what the book shows. 0 is a
 * profile that does not move. The English-source armies (Bretonnia, Lizardmen,
 * Norse, Halflings, Dogs of War) go through the same table, so the Spanish UI
 * is in centimetres throughout.
 *
 * `assertArmyIntegrity` requires every M in the data to be a key here.
 */
export const MOVEMENT_CM: Readonly<Partial<Record<number, number>>> = {
  0: 0,
  2: 5,
  3: 8,
  4: 10,
  5: 12,
  6: 15,
  7: 18,
  8: 20,
  9: 22,
  10: 25,
  12: 30,
  24: 60,
}
