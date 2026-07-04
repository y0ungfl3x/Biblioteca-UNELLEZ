export default function UsersLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="space-y-3">
        <div className="skeleton h-9 w-80 max-w-full" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="skeleton h-6 w-40" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-9 w-full rounded-xl" />
              </div>
            ))}
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/2 max-w-[240px]" />
                  <div className="skeleton h-3 w-1/4 max-w-[120px]" />
                </div>
                <div className="skeleton h-6 w-24 rounded-full" />
                <div className="skeleton h-6 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
