import { initializeApp, getApps, getApp } from 'firebase/app'
import { getDatabase, ref, onValue, set, update, push, remove, runTransaction, increment } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBKNJdbVGe6ceIWu5b656RpemU668pQVO4",
  authDomain: "ligacentralsur-30b99.firebaseapp.com",
  databaseURL: "https://ligacentralsur-30b99-default-rtdb.firebaseio.com",
  projectId: "ligacentralsur-30b99",
  storageBucket: "ligacentralsur-30b99.firebasestorage.app",
  messagingSenderId: "270397357354",
  appId: "1:270397357354:web:35f56209b48f0059783253"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
export const db = getDatabase(app)
export { ref, onValue, set, update, push, remove, runTransaction, increment }
