interface ConfirmationPageProps {
  searchParams: { method?: string };
}

export default function OrderConfirmationPage({ searchParams }: ConfirmationPageProps) {
  if (searchParams.method === "iban") {
    return (
      <main className="mx-auto max-w-lg p-10 text-center">
        <h1 className="text-2xl font-bold">تم استلام طلبك!</h1>
        <p className="mt-4 text-brown/70">
          سنتحقق من تحويلك البنكي ونؤكد طلبك قريبًا. تحقق من بريدك الإلكتروني للتأكيد.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-10 text-center">
      <h1 className="text-2xl font-bold">لا يوجد طلب لعرضه</h1>
    </main>
  );
}
