export function OrderConfirmationMessage({
  success,
  title,
  body,
  whatsappLink,
}: {
  success: boolean;
  title: string;
  body: string;
  whatsappLink?: string;
}) {
  return (
    <main className="mx-auto max-w-lg p-10 text-center">
      <h1 className={`text-2xl font-bold ${success ? "text-leaf" : "text-red-600"}`}>
        {title}
      </h1>
      <p className="mt-4 text-brown/70">{body}</p>
      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block rounded-full bg-green-600 px-6 py-3 text-white"
        >
          أرسل تأكيد واتساب
        </a>
      )}
      {!success && (
        <a href="/checkout" className="mt-6 block text-leaf underline">
          حاول مرة أخرى
        </a>
      )}
    </main>
  );
}
