import { render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';

import { ArrowDownIcon } from '../../../src/components/icons/ArrowDownIcon';
import { ArrowUpIcon } from '../../../src/components/icons/ArrowUpIcon';
import { LogoMarkIcon } from '../../../src/components/icons/LogoMarkIcon';
import { NeutralDotIcon } from '../../../src/components/icons/NeutralDotIcon';
import { SearchIcon } from '../../../src/components/icons/SearchIcon';
import type { IconProps } from '../../../src/components/icons/SvgIcon';
import { WarningIcon } from '../../../src/components/icons/WarningIcon';

const icons: [string, ComponentType<IconProps>, string | undefined][] = [
  ['ArrowUpIcon', ArrowUpIcon, 'trendUp'],
  ['ArrowDownIcon', ArrowDownIcon, 'trendDown'],
  ['NeutralDotIcon', NeutralDotIcon, 'trendNeutral'],
  ['WarningIcon', WarningIcon, 'warning'],
  ['LogoMarkIcon', LogoMarkIcon, 'brand'],
  ['SearchIcon', SearchIcon, undefined],
];

describe.each(icons)('%s', (_name, Icon, colorClass) => {
  it('is hidden from assistive technology when no label is given', () => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).not.toHaveAttribute('role');
  });

  it('is announced as an image with its label', () => {
    render(<Icon label="Accessible name" />);

    expect(screen.getByRole('img', { name: 'Accessible name' })).toBeInTheDocument();
  });

  it('renders at the requested size and merges extra classes', () => {
    const { container } = render(<Icon size={32} className="extra" />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
    expect(svg).toHaveClass('icon', 'extra');
    if (colorClass) {
      expect(svg).toHaveClass(colorClass);
    }
  });
});
