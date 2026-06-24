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

const PIN = '2026'

export default function App() {
  const [data, setData] = useState({})
  const [seccion, setSeccion] = useState('home')
  const [authed, setAuthed] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  useEffect(() => {
    const unsub = onValue(ref(db, '/'), snap => setData(snap.val() || {}))
    return () => unsub()
  }, [])

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

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white pb-[72px]">
      {/* Banner nueva versión */}
      {needRefresh && (
        <div className="fixed top-0 inset-x-0 z-50 bg-green-700 text-white text-sm py-2 px-4 flex items-center justify-between">
          <span>Nueva versión disponible</span>
          <button onClick={() => updateServiceWorker(true)} className="font-bold underline">Actualizar</button>
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
    </div>
  )
}
