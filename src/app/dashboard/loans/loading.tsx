export default function LoansLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="space-y-3">
        <div className="skeleton h-9 w-80 max-w-full" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="skeleton h-9 w-40 rounded-xl" />
            <div className="skeleton h-9 w-36 rounded-xl" />
            <div className="skeleton h-9 w-36 rounded-xl" />
          </div>
          <div className="skeleton h-4 w-40" />
        </div>

        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="skeleton h-3 w-48" />
          <div className="skeleton h-3 w-24" />
        </div>

        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="skeleton w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3 max-w-[220px]" />
                <div className="skeleton h-3 w-1/4 max-w-[140px]" />
              </div>
              <div className="hidden md:block skeleton h-6 w-24 rounded-lg" />
              <div className="hidden md:block skeleton h-4 w-20" />
              <div className="skeleton h-9 w-24 rounded-xl shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
