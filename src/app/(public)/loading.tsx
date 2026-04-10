export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">加载中...</p>
      </div>
    </div>
  );
}
