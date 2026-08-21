/**
 * The `**Phase**: <n>` value declared within 8 lines of a capability id's
 * first mention in `prd`, or `null` if the capability isn't mentioned or
 * carries no phase.
 */
export function phaseForCapability(
  prd: string,
  capability: string,
): number | null {
  const lines = prd.split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(capability));
  if (index < 0) return null;
  const nearby = lines.slice(index, index + 8).join(" ");
  const match = /\*\*Phase\*\*:\s*(\d+)/i.exec(nearby)?.[1];
  return match === undefined ? null : Number(match);
}
