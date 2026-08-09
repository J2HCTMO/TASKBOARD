import React, { useState } from 'react'

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (password === APP_PASSWORD) {
      localStorage.setItem('tahawwul_auth', 'true')
      setError('')
      onSuccess()
    } else {
      setError('كلمة المرور غير صحيحة')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#001830',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#F8F8F8',
          borderRadius: 14,
          padding: '40px 36px',
          width: 320,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          textAlign: 'center',
        }}
      >
        <img
          src="/logo-rihlat-tahawwul.png"
          alt="رحلة تحوّل"
          style={{ height: 48, marginBottom: 20 }}
        />
        <h2 style={{ color: '#083838', marginBottom: 6 }}>لوحة مشاريع/مهام إدارة التحول</h2>
        <p style={{ color: '#68A8C0', fontSize: 13, marginBottom: 24 }}>
          الرجاء إدخال كلمة المرور للدخول
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور"
          autoFocus
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #ccc',
            fontSize: 14,
            marginBottom: 12,
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        />
        {error && (
          <div style={{ color: '#c0392b', fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: 'none',
            background: '#0C7870',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          دخول
        </button>
      </form>
    </div>
  )
}
