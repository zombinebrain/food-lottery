export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-900">Food Lottery</h1>
          <p className="mt-1 text-sm text-gray-500">
            Пусть судьба решит, что сегодня есть
          </p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-lg">{children}</div>
      </div>
    </div>
  );
}
