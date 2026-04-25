export type DiceRoller = (sides: number) => number;

export const defaultRoller: DiceRoller = (sides) =>
    Math.floor(Math.random() * sides) + 1;

export function rollDice(count: number, sides: number, roller: DiceRoller = defaultRoller): number[] {
    return Array.from({ length: count }, () => roller(sides));
}
