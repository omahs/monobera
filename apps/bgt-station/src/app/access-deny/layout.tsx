export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <div className="container min-h-minimun max-w-1280 pb-16">{children}</div>
    </section>
  );
}