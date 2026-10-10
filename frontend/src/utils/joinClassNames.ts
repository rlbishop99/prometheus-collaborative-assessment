/**
 * Rocko Bishop
 * Joins CSS class names and skips empty or missing entries, so components can compose a base
 * class with optional or conditional ones without string juggling.
 * @param classNames - Class names; falsy values are ignored.
 * @returns A space-separated class string (empty when nothing remains).
 */
export function joinClassNames(...classNames: (string | false | null | undefined)[]): string {
  return classNames.filter(Boolean).join(' ');
}
