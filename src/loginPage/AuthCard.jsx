function AuthCard({ title, subtitle, children }) {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg bg-white border border-slate-200 shadow-lg">
        <div className="border-b border-slate-200 px-8 py-6">
          <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold mb-4">
            CB
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
        </div>
        <div className="px-8 py-6">{children}</div>
      </section>
    </main>
  );
}

export default AuthCard;
