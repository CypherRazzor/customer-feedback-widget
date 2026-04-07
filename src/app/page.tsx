import { redirect } from "next/navigation";

// Root redirects to preview page if token is present, else shows error
export default function Home({
  searchParams,
}: {
  searchParams: { token?: string; slug?: string };
}) {
  if (searchParams.token && searchParams.slug) {
    redirect(`/preview?token=${searchParams.token}&slug=${searchParams.slug}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Preview nicht verfügbar
        </h1>
        <p className="text-gray-500">
          Bitte nutze den Link, den du von deinem Berater erhalten hast.
        </p>
      </div>
    </main>
  );
}
