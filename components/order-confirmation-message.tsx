export function OrderConfirmationMessage({
  success,
  title,
  body,
  whatsappLink,
  // Set to false on failures where the customer must NOT pay again — e.g. we could not
  // reach the payment provider and do not know whether the card was already charged.
  // Showing a "try again" link there would contradict the message directly above it.
  allowRetry = true,
}: {
  success: boolean;
  title: string;
  body: string;
  whatsappLink?: string;
  allowRetry?: boolean;
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
      {!success && allowRetry && (
        <a href="/checkout" className="mt-6 block text-leaf underline">
          حاول مرة أخرى
        </a>
      )}
    </main>
  );
}
