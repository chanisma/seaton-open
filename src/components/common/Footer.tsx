export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-xs font-medium tracking-wide text-muted-foreground/75">
          &copy; {currentYear} Seaton
        </p>
        <p className="hidden text-xs text-muted-foreground/60 sm:block">
          더 나은 몰입을 위한 학습 공간
        </p>
      </div>
    </footer>
  );
};
