const TABS = [
  { id: 'home', label: 'Inicio', icon: '🏠' },
  { id: 'fixture', label: 'Fixture', icon: '📅' },
  { id: 'tabla', label: 'Tabla', icon: '📊' },
  { id: 'copas', label: 'Copas', icon: '🏆' },
  { id: 'stats', label: 'Stats', icon: '⚽' },
  { id: 'admin', label: 'Admin', icon: '⚙️' },
]

export default function Navbar({ seccion, navegar }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#111] border-t border-green-900/60">
      <div className="flex">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => navegar(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors
              ${seccion === tab.id ? 'text-green-400' : 'text-gray-500'}`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className="text-[10px] leading-none font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="h-safe-area-inset-bottom bg-[#111]" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </nav>
  )
}
