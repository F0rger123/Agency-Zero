/** Fades each public page in on navigation (opacity only, so sticky scroll scenes inside keep working). */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
