import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { frac } from '../lib/fraction';
import FractionCircles from './FractionCircles.svelte';

describe('FractionCircles', () => {
  it('draws one circle for a proper fraction', () => {
    const { container } = render(FractionCircles, { props: { value: frac(3, 5), label: 'tiga perlima' } });
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(container.querySelectorAll('[data-slice]')).toHaveLength(5);
    expect(screen.getByRole('img', { name: 'tiga perlima' })).toBeInTheDocument();
  });

  it('fills whole circles first for a value above one', () => {
    const { container } = render(FractionCircles, { props: { value: frac(7, 3), label: 'x' } });
    const circles = container.querySelectorAll('svg');
    expect(circles).toHaveLength(3);
    const shadedPerCircle = Array.from(circles).map((svg) =>
      Array.from(svg.querySelectorAll<SVGPathElement>('[data-slice]')).filter((p) => p.style.fill !== '').length,
    );
    expect(shadedPerCircle).toEqual([3, 3, 1]);
  });
});
