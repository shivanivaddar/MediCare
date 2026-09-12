import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:5000/api'

const starterMedicines = [
  { _id: 'starter-paracetamol', name: 'Paracetamol 500mg', category: 'Pain Relief', price: 50, stock: 100, manufacturer: 'MediCare Labs', shop: 'MediCare Central', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80' },
  { _id: 'starter-ibuprofen', name: 'Ibuprofen 400mg', category: 'Pain Relief', price: 85, stock: 64, manufacturer: 'HealthFirst', shop: 'MediCare Central', image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80' },
  { _id: 'starter-cetirizine', name: 'Cetirizine 10mg', category: 'Allergy Care', price: 35, stock: 82, manufacturer: 'Wellness Pharma', shop: 'MediCare North', image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80' },
  { _id: 'starter-amoxicillin', name: 'Amoxicillin 500mg', category: 'Antibiotics', price: 120, stock: 40, manufacturer: 'TrustMed', shop: 'MediCare North', requiresPrescription: true, image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&q=80' },
  { _id: 'starter-azithromycin', name: 'Azithromycin 500mg', category: 'Antibiotics', price: 145, stock: 28, manufacturer: 'TrustMed', shop: 'MediCare East', requiresPrescription: true, image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80' },
  { _id: 'starter-omeprazole', name: 'Omeprazole 20mg', category: 'Digestive Care', price: 70, stock: 76, manufacturer: 'HealthFirst', shop: 'MediCare East', image: 'https://images.unsplash.com/photo-1542884748-2b87b36c6b90?w=600&q=80' },
  { _id: 'starter-vitamin-d', name: 'Vitamin D3', category: 'Vitamins', price: 180, stock: 55, manufacturer: 'Wellness Pharma', shop: 'MediCare South', image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&q=80' },
  { _id: 'starter-ors', name: 'ORS Hydration Salts', category: 'Wellness', price: 25, stock: 150, manufacturer: 'MediCare Labs', shop: 'MediCare South', image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80' },
]

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Something went wrong')
  return data
}

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('medicare_token'))
  const [medicines, setMedicines] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [medicineForm, setMedicineForm] = useState({ name: '', category: '', price: '', stock: '' })
  const [booking, setBooking] = useState([])
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '' })
  const bookingRef = useRef(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const loadMedicines = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    try {
      const data = await request(`/medicines?${params}`)
      const availableMedicines = data.medicines.length ? data.medicines : starterMedicines
      setMedicines(availableMedicines)
      setCategories([...new Set(availableMedicines.map((medicine) => medicine.category))])
    } catch {
      const filteredMedicines = starterMedicines.filter((medicine) => {
        const matchesSearch = !search || medicine.name.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = !category || medicine.category === category
        return matchesSearch && matchesCategory
      })
      setMedicines(filteredMedicines)
      setCategories([...new Set(starterMedicines.map((medicine) => medicine.category))])
      setMessage('Showing the MediCare catalogue')
    }
  }, [search, category, setMessage])

  useEffect(() => {
    // The request synchronizes the catalogue with the backend.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMedicines().catch((error) => setMessage(error.message))
  }, [loadMedicines])

  useEffect(() => {
    if (!token) return
    request('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => setUser(data.user))
      .catch(() => { localStorage.removeItem('medicare_token'); setToken(null) })
  }, [token])

  async function handleAuth(event) {
    event.preventDefault(); setLoading(true); setMessage('')
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register'
      const data = await request(endpoint, { method: 'POST', body: JSON.stringify(authForm) })
      localStorage.setItem('medicare_token', data.token); setToken(data.token); setUser(data.user)
      setMessage(`Welcome, ${data.user.name}`)
    } catch (error) { setMessage(error.message) } finally { setLoading(false) }
  }

  async function handleAddMedicine(event) {
    event.preventDefault(); setLoading(true)
    try {
      await request('/medicines', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...medicineForm, price: Number(medicineForm.price), stock: Number(medicineForm.stock) }),
      })
      setMedicineForm({ name: '', category: '', price: '', stock: '' }); setShowForm(false)
      setMessage('Medicine added successfully'); await loadMedicines()
    } catch (error) { setMessage(error.message) } finally { setLoading(false) }
  }

  function logout() { localStorage.removeItem('medicare_token'); setToken(null); setUser(null); setMessage('You have been logged out') }

  function addToBooking(medicine) {
    setBooking((current) => {
      const existing = current.find((item) => item._id === medicine._id)
      if (existing) return current.map((item) => item._id === medicine._id ? { ...item, quantity: Math.min(item.quantity + 1, medicine.stock) } : item)
      return [...current, { ...medicine, quantity: 1 }]
    })
    setMessage(`${medicine.name} added to your booking`)
    setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  function updateBookingQuantity(id, change) {
    setBooking((current) => current.map((item) => item._id === id ? { ...item, quantity: Math.max(0, Math.min(item.quantity + change, item.stock)) } : item).filter((item) => item.quantity > 0))
  }

  const bookingTotal = booking.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <main className="app-shell">
      <nav className="topbar"><a className="brand" href="/"><span className="brand-mark">+</span><span>MediCare</span></a><div className="nav-actions">{user ? <span className="user-chip">{user.name} · {user.role}</span> : <span className="status-dot">Open pharmacy</span>}{user && <button className="text-button" onClick={logout}>Log out</button>}</div></nav>
      <section className="intro"><div><p className="eyebrow">Trusted care, delivered clearly</p><h1>Your everyday pharmacy,<br /><em>made simpler.</em></h1><p className="intro-copy">Browse essential medicines, check availability, and keep your health routine moving.</p></div><div className="intro-note"><span>01</span><p>Verified medicines<br />from trusted partners</p></div></section>
      {message && <div className="notice" role="status">{message}</div>}
      <section className="catalog-section"><div className="section-heading"><div><p className="eyebrow">MediCare shops / catalogue</p><h2>Find your medicine</h2><p className="section-copy">Browse products by name, shop, category, and live quantity.</p></div><span className="result-count">{medicines.length} products available</span></div>
        <div className="filters"><label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search medicines" /></label><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category"><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>{user && ['pharmacist', 'admin'].includes(user.role) && <button className="primary-button" onClick={() => setShowForm(!showForm)}>+ Add medicine</button>}</div>
        {showForm && <form className="medicine-form" onSubmit={handleAddMedicine}><input required placeholder="Medicine name" value={medicineForm.name} onChange={(event) => setMedicineForm({ ...medicineForm, name: event.target.value })} /><input required placeholder="Category" value={medicineForm.category} onChange={(event) => setMedicineForm({ ...medicineForm, category: event.target.value })} /><input required min="0" type="number" placeholder="Price" value={medicineForm.price} onChange={(event) => setMedicineForm({ ...medicineForm, price: event.target.value })} /><input required min="0" type="number" placeholder="Stock" value={medicineForm.stock} onChange={(event) => setMedicineForm({ ...medicineForm, stock: event.target.value })} /><button className="primary-button" disabled={loading}>{loading ? 'Saving...' : 'Save medicine'}</button></form>}
        <div className="medicine-grid">{medicines.map((medicine) => <article className="medicine-card" key={medicine._id}><img className="medicine-image" src={medicine.image || starterMedicines[0].image} alt={`${medicine.name} medicine`} /><p className="card-category">{medicine.category}</p><h3>{medicine.name}</h3><p className="medicine-shop">{medicine.shop || medicine.manufacturer || 'MediCare shop'}</p>{medicine.requiresPrescription && <span className="prescription-label">Prescription required</span>}<div className="card-footer"><span><b>{medicine.stock}</b> units available</span><strong>₹{medicine.price}</strong></div><button className="booking-button" onClick={() => addToBooking(medicine)}>Add to booking</button></article>)}{!medicines.length && <div className="empty-state"><span>✚</span><h3>No medicines found</h3><p>Try another name or choose a different category.</p></div>}</div>
      </section>
      <section className="booking-panel" ref={bookingRef}><div className="section-heading"><div><p className="eyebrow">Your order</p><h2>Medicine booking</h2></div><span className="result-count">{booking.reduce((total, item) => total + item.quantity, 0)} items</span></div>{booking.length ? <><div className="booking-list">{booking.map((item) => <div className="booking-row" key={item._id}><img src={item.image || starterMedicines[0].image} alt="" /><div><strong>{item.name}</strong><small>{item.shop || 'MediCare shop'}</small></div><div className="quantity-controls"><button onClick={() => updateBookingQuantity(item._id, -1)}>-</button><span>{item.quantity}</span><button onClick={() => updateBookingQuantity(item._id, 1)}>+</button></div><b>₹{item.price * item.quantity}</b></div>)}</div><div className="booking-total"><span>Total</span><strong>₹{bookingTotal}</strong></div><form className="order-form" onSubmit={(event) => { event.preventDefault(); setMessage('Order placed successfully. We will contact you shortly.') }}><p className="eyebrow">Delivery details</p><div className="order-fields"><input required placeholder="Full name" value={orderForm.name} onChange={(event) => setOrderForm({ ...orderForm, name: event.target.value })} /><input required placeholder="Phone number" value={orderForm.phone} onChange={(event) => setOrderForm({ ...orderForm, phone: event.target.value })} /></div><textarea required placeholder="Delivery address" value={orderForm.address} onChange={(event) => setOrderForm({ ...orderForm, address: event.target.value })} /><button className="primary-button" type="submit">Continue to order</button></form></> : <p className="empty-booking">Your booking is empty. Choose a medicine above to begin.</p>}</section>
      {!user && <section className="auth-panel"><div><p className="eyebrow">Your account</p><h2>{authMode === 'login' ? 'Welcome back.' : 'Join MediCare.'}</h2><p>Sign in to manage orders and your personal pharmacy experience.</p></div><form onSubmit={handleAuth}>{authMode === 'register' && <input required placeholder="Full name" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} />}<input required type="email" placeholder="Email address" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} /><input required minLength="6" type="password" placeholder="Password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} /><button className="primary-button" disabled={loading}>{loading ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Create account'}</button><button type="button" className="switch-button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>{authMode === 'login' ? 'New to MediCare? Create an account' : 'Already registered? Sign in'}</button></form></section>}
      <footer><span>MEDICARE / 2026</span><span>Care that keeps up with you.</span></footer>
    </main>
  )
}

export default App
