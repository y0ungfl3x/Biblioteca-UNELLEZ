export default function InventoryLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="space-y-3">
        <div className="skeleton h-9 w-72 max-w-full" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="skeleton h-4 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="skeleton h-10 rounded-xl" />
          <div className="skeleton h-10 rounded-xl" />
          <div className="skeleton h-10 rounded-xl" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-1/2 max-w-xs" />
              <div className="skeleton h-3 w-1/3 max-w-[200px]" />
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="skeleton h-6 w-20 rounded-full" />
              <div className="skeleton h-6 w-28 rounded-full" />
            </div>
            <div className="skeleton h-9 w-9 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
