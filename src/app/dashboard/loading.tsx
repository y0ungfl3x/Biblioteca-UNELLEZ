export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="space-y-3">
        <div className="skeleton h-9 w-72 max-w-full" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4"
          >
            <div className="skeleton aspect-[3/4] rounded-2xl" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
