export default function Loader() {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-900 border-t-yellow-500 rounded-full animate-spin"></div>
          <p className="text-blue-900 font-semibold text-sm">Chargement...</p>
        </div>
      </div>
    );
  }