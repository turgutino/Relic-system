import type { ReactNode } from 'react';
import { Navigation } from '@/app/components/Navigation';

const grainSvg =
  'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground transition-colors">
      <Navigation />
      {children}
      <div
        className="fixed inset-0 pointer-events-none z-50 transition-opacity"
        style={{
          backgroundImage: grainSvg,
          backgroundRepeat: 'repeat',
          opacity: 'var(--relic-grain-opacity)',
        }}
      />
    </div>
  );
}
