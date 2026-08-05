// Ambient declarations for untyped third-party modules.

declare module "@fnando/sparkline" {
  /**
   * Renders a sparkline into the given SVG element. See
   * https://github.com/fnando/sparkline — the library ships no types.
   */
  export default function sparkline(
    svg: SVGSVGElement,
    values: unknown[],
    options?: unknown,
  ): void;
}
