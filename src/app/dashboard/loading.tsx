export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="skeleton h-9 w-64 max-w-full" />
          <div className="skeleton h-4 w-80 max-w-full" />
        </div>
        <div className="skeleton h-9 w-32 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4"
          >
            <div className="skeleton w-14 h-14 rounded-2xl" />
            <div className="skeleton h-5 w-1/2" />
            <div className="space-y-2">
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
        <div className="skeleton h-5 w-48" />
        <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
          <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-1/3" />
            <div className="skeleton h-3 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
