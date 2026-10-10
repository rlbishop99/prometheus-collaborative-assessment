import { render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';

import { ArrowDownIcon } from '../../../src/components/icons/ArrowDownIcon';
import { ArrowUpIcon } from '../../../src/components/icons/ArrowUpIcon';
import { LogoMarkIcon } from '../../../src/components/icons/LogoMarkIcon';
import { NeutralDotIcon } from '../../../src/components/icons/NeutralDotIcon';
import { SvgIcon } from '../../../src/components/icons/SvgIcon';
import type { IconProps } from '../../../src/components/icons/SvgIcon';
import { WarningIcon } from '../../../src/components/icons/WarningIcon';

const square = <rect width="10" height="10" />;

describe('SvgIcon', () => {
  it('is hidden from assistive technology when no label is given', () => {
    const { container } = render(<SvgIcon viewBox="0 0 10 10">{square}</SvgIcon>);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).not.toHaveAttribute('role');
  });

  it('is announced as an image with its label', () => {
    render(
      <SvgIcon viewBox="0 0 10 10" label="Accessible name">
        {square}
      </SvgIcon>,
    );

    expect(screen.getByRole('img', { name: 'Accessible name' })).toBeInTheDocument();
  });
});

const coloredIcons: [string, ComponentType<IconProps>, string][] = [
  ['ArrowUpIcon', ArrowUpIcon, 'trendUp'],
  ['ArrowDownIcon', ArrowDownIcon, 'trendDown'],
  ['NeutralDotIcon', NeutralDotIcon, 'trendNeutral'],
  ['WarningIcon', WarningIcon, 'warning'],
  ['LogoMarkIcon', LogoMarkIcon, 'brand'],
];

describe.each(coloredIcons)('%s', (_name, Icon, colorClass) => {
  it('renders at the requested size with its color and any extra class', () => {
    const { container } = render(<Icon size={32} className="extra" />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveClass('icon', colorClass, 'extra');
  });
});
