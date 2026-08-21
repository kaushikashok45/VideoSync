export function loadEither(useLiteral: boolean, path: string) {
  return useLiteral ? import("./literal-target.ts") : import(path);
}
