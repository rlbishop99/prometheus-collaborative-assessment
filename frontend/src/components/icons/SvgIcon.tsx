import type { ReactNode } from 'react';

import { joinClassNames } from '../../utils/joinClassNames';
import styles from './icons.module.css';

/** Props shared by every icon. */
export interface IconProps {
  /**
   * Accessible name. When given, the icon is announced as an image; when omitted, it is treated
   * as decorative and hidden from assistive technology.
   */
  readonly label?: string;
  readonly className?: string;
  /** Rendered width and height in pixels. */
  readonly size?: number;
}

interface SvgIconProps extends IconProps {
  readonly viewBox: string;
  readonly children: ReactNode;
}

const DEFAULT_SIZE = 20;

/**
 * Rocko Bishop
 * Base for every icon. It centralizes the accessibility rule (labelled means `role="img"`,
 * otherwise `aria-hidden`), so individual icons only describe their shapes.
 * @param props - Label, class, size, viewBox and the SVG shapes.
 * @returns The SVG element.
 */
export function SvgIcon({
  label,
  className,
  size = DEFAULT_SIZE,
  viewBox,
  children,
}: SvgIconProps): ReactNode {
  const accessibility = label
    ? { role: 'img', 'aria-label': label }
    : { 'aria-hidden': true, focusable: false };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      className={joinClassNames(styles.icon, className)}
      {...accessibility}
    >
      {children}
    </svg>
  );
}
