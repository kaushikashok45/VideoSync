/**
 * Names the "this catch is deliberate, not an oversight" acknowledgment a
 * fail-closed catch block needs. Several sites here treat a missing file, an
 * unresolvable specifier, or malformed input as an ordinary, expected
 * outcome rather than a bug -- routing it through the structured logger
 * would be noise on every normal run, and rethrowing would defeat the
 * fail-closed contract those callers document. This call is the record that
 * the omission was considered, not silent by accident.
 */
export function ignoreExpectedFailure(_error: unknown): void {}
