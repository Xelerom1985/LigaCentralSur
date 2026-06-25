import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { db, ref, onValue } from './firebase'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Fixture from './components/Fixture'
import Tabla from './components/Tabla'
import Copas from './components/Copas'
import Stats from './components/Stats'
import Admin from './components/Admin'

const PIN = '2041'

export default function App() {
  const [data, setData] = useState({})
  const [seccion, setSeccion] = useState('home')
  const [authed, setAuthed] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const unsub = onValue(ref(db, '/'), snap => setData(snap.val() || {}))
    return () => unsub()
  }, [])

  useEffect(() => {
    const handler = e => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setShowInstall(false))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const instalarApp = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setShowInstall(false)
    setInstallPrompt(null)
  }

  useEffect(() => {
    const handler = () => {}
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  const navegar = sec => {
    if (sec === 'admin') {
      if (authed) setSeccion('admin')
      else setShowPin(true)
      return
    }
    setSeccion(sec)
    window.history.pushState(null, '', '/')
  }

  const intentarPin = () => {
    if (pinInput === PIN) {
      setAuthed(true); setShowPin(false); setPinInput(''); setPinError(false); setSeccion('admin')
    } else {
      setPinError(true); setTimeout(() => setPinError(false), 1200)
    }
  }

  const handleLockClick = () => {
    if (authed) {
      setAuthed(false)
      setSeccion('home')
    } else {
      setShowPin(true)
      setPinInput('')
      setPinError(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white pb-[72px]">
      {/* Banner nueva versión */}
      {needRefresh && (
        <div className="fixed bottom-[72px] inset-x-0 z-50 px-3 pb-2">
          <div className="bg-green-700 text-white text-sm px-4 py-3 rounded-2xl flex items-center justify-between shadow-xl">
            <span className="font-medium">Nueva versión disponible</span>
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-white text-green-800 font-bold px-4 py-1.5 rounded-xl text-sm active:scale-95 transition-all flex-shrink-0"
            >
              Actualizar
            </button>
          </div>
        </div>
      )}

      {/* Banner instalar PWA */}
      {showInstall && (
        <div className="fixed bottom-[72px] inset-x-0 z-40 px-3 pb-2">
          <div className="bg-[#1a1a1a] border border-green-700/60 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl">
            <img src="/logo.png" className="w-10 h-10 rounded-xl flex-shrink-0 object-contain" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold leading-tight">Liga Central Sur</p>
              <p className="text-gray-400 text-xs leading-tight">Instalá la app en tu dispositivo</p>
            </div>
            <button
              onClick={() => setShowInstall(false)}
              className="text-gray-600 text-lg flex-shrink-0 px-1"
            >✕</button>
            <button
              onClick={instalarApp}
              className="bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-xl flex-shrink-0 active:scale-95 transition-all"
            >Instalar</button>
          </div>
        </div>
      )}

      {/* Modal PIN */}
      {showPin && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-xs border border-green-800 shadow-2xl">
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">⚙️</div>
              <p className="text-white font-bold text-lg">Panel Admin</p>
              <p className="text-gray-400 text-sm">Ingresá el PIN de acceso</p>
            </div>
            <input
              type="password" inputMode="numeric" maxLength={6}
              value={pinInput} onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && intentarPin()}
              placeholder="• • • •"
              className={`w-full bg-[#111] border-2 ${pinError ? 'border-red-500' : 'border-green-800'} rounded-xl px-4 py-3 text-center text-white text-2xl tracking-[0.5em] outline-none mb-2 transition-colors`}
              autoFocus
            />
            {pinError && <p className="text-red-400 text-sm text-center mb-2 animate-pulse">PIN incorrecto</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setShowPin(false); setPinInput('') }} className="flex-1 bg-[#111] text-gray-400 rounded-xl py-3 font-medium text-sm">Cancelar</button>
              <button onClick={intentarPin} className="flex-1 bg-green-600 text-white rounded-xl py-3 font-semibold text-sm">Entrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Secciones */}
      {seccion === 'home' && <Home data={data} />}
      {seccion === 'fixture' && <Fixture data={data} />}
      {seccion === 'tabla' && <Tabla data={data} />}
      {seccion === 'copas' && <Copas data={data} />}
      {seccion === 'stats' && <Stats data={data} />}
      {seccion === 'admin' && authed && <Admin data={data} />}

      <Navbar seccion={seccion} navegar={navegar} />

      {/* Engranaje admin — visible solo cuando authed */}
      {authed && (
        <button
          onClick={() => setSeccion('admin')}
          className="fixed top-3 right-14 z-40 w-11 h-11 flex items-center justify-center text-green-400/80 active:text-green-400 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      {/* Candado admin — top right */}
      <button
        onClick={handleLockClick}
        className={`fixed top-3 right-3 z-40 w-11 h-11 flex items-center justify-center transition-colors
          ${authed ? 'text-green-400/80 active:text-green-400' : 'text-white/30 active:text-white/60'}`}
      >
        {authed ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )}
      </button>
    </div>
  )
}
