import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { apiUrl } from '../api'

function LogIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email.length === 0) return setMessage('Enter Email Please')
    if (password.length < 5) return setMessage('Enter Password Please')

    axios
      .post(apiUrl('/login'), { email, password }, { withCredentials: true })
      .then((res) => {
        if (res.data.message === 'User not registered') {
          setMessage('No account found — redirecting to Sign Up…')
          setTimeout(() => navigate('/signIn'), 2000)
        }
        if (res.data.message === 'Invalid credentials') {
          setMessage('Invalid Credentials')
        }
        if (res.data.message === 'Successfully LoggedIn') {
          setMessage('Logged in! Redirecting…')
          setTimeout(() => navigate('/dashboard'), 2000)
        }
      })
      .catch(() => setMessage('Something went wrong. Please try again.'))
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome Back</h1>
      <p className="text-sm text-slate-500 mb-6">Log in to continue planning</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
        />

        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all shadow-lg shadow-primary/25"
        >
          Log In
        </button>

        {message && (
          <p className={`text-sm text-center font-medium ${
            message.includes('Logged in') || message.includes('Redirecting')
              ? 'text-green-600'
              : 'text-red-500'
          }`}>
            {message}
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <button
          onClick={() => navigate('/signIn')}
          className="text-primary font-semibold hover:underline"
        >
          Sign Up
        </button>
      </p>
    </div>
  )
}

export default LogIn
