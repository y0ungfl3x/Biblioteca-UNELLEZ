export default function MyLoansLoading() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="space-y-3">
        <div className="skeleton h-9 w-64 max-w-full" />
        <div className="skeleton h-4 w-80 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center gap-4"
          >
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-2/3 max-w-[280px]" />
              <div className="skeleton h-3 w-1/3 max-w-[160px]" />
            </div>
            <div className="flex items-center gap-3">
              <div className="skeleton h-6 w-24 rounded-lg" />
              <div className="skeleton h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
