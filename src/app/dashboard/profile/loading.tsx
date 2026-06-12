export default function ProfileLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="space-y-3">
        <div className="skeleton h-9 w-48 max-w-full" />
        <div className="skeleton h-4 w-80 max-w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center space-y-4">
          <div className="skeleton w-24 h-24 rounded-full" />
          <div className="skeleton h-5 w-36" />
          <div className="skeleton h-6 w-24 rounded-full" />
          <div className="w-full pt-4 border-t border-slate-100 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-4 h-4 rounded shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-2.5 w-16" />
                  <div className="skeleton h-3.5 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <div className="skeleton h-5 w-48" />
            <div className="skeleton h-3 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-3 w-28" />
                <div className="skeleton h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <div className="skeleton h-10 w-44 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
