import { FooterSM } from "@bera/shared-ui";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <div className="container min-h-minimum max-w-1440 pb-16">{children}</div>
      <FooterSM />
    </section>
  );
}
