import { lazy, Suspense, useState } from 'react';
import { Compass } from 'lucide-react';
import { LandingPage } from './components/LandingPage';

const NavegantesApp = lazy(() => import('./NavegantesApp'));

function AppLoading() {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-[#f3ecdb] text-[#4a3320]">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <Compass className="animate-spin text-[#b45a35]" size={42} strokeWidth={1.5} />
        <span className="font-['VT323'] text-sm uppercase tracking-[0.16em]">
          Preparando seu diário de bordo
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const [hasEnteredApp, setHasEnteredApp] = useState(false);

  if (!hasEnteredApp) {
    return <LandingPage onEnter={() => setHasEnteredApp(true)} />;
  }

  return (
    <Suspense fallback={<AppLoading />}>
      <NavegantesApp />
    </Suspense>
  );
}
