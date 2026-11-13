import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
  showFooter?: boolean;
  title?: string;
}

export const Layout = ({
  children,
  showNavigation = true,
  showFooter = true,
  title,
}: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip Link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        본문으로 건너뛰기
      </a>

      {showNavigation && <Navigation title={title} />}

      <main id="main-content" className="w-full flex-1">
        <div className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>

      {showFooter && <Footer />}
    </div>
  );
};
