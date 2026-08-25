import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import FirebaseGate from './FirebaseGate'
import './styles.css'

createRoot(document.getElementById('root')!).render(<StrictMode><FirebaseGate /></StrictMode>)
