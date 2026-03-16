import PortfolioWizard from "@/components/portfolio/PortfolioWizard";

export default async function CreatePortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="page-wrap">
      <PortfolioWizard locale={locale} />
    </div>
  );
}
