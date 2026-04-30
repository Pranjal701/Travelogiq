import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { apiUrl } from '../api'

function SignIn() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rePassword, setRePassword] = useState('')
  const [passwordCheck, setPasswordCheck] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (rePassword.length !== 0) {
      if (password !== rePassword) setPasswordCheck('Passwords do not match')
      else setPasswordCheck('Passwords match')
    } else {
      setPasswordCheck('')
    }
  }, [password, rePassword])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.length === 0) return setMessage('Enter Name Please')
    if (email.length === 0) return setMessage('Enter Email Please')
    if (password.length < 5) return setMessage('Enter min. 6 digit password')

    if (password === rePassword) {
      axios
        .post(apiUrl('/signUP'), { name, email, password }, { withCredentials: true })
        .then((res) => {
          if (res.data.message === 'User Created Successfully') {
            setMessage('Account created! Redirecting…')
            setTimeout(() => navigate('/dashboard'), 2000)
          }
          if (res.data.message === 'User already exist') {
            setMessage('Account exists — redirecting to login…')
            setTimeout(() => navigate('/logIn'), 2000)
          }
        })
        .catch(() => setMessage('Something went wrong. Please try again.'))
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Create Account</h1>
      <p className="text-sm text-slate-500 mb-6">Fill in the details to get started</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
        />
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
        />
        <input
          type="password"
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={rePassword}
          onChange={(e) => setRePassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
        />

        {passwordCheck && (
          <p className={`text-sm font-medium ${
            passwordCheck === 'Passwords match' ? 'text-green-600' : 'text-red-500'
          }`}>
            {passwordCheck}
          </p>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all shadow-lg shadow-primary/25"
        >
          Sign Up
        </button>

        {message && (
          <p className={`text-sm text-center font-medium ${
            message.includes('created') || message.includes('Redirecting')
              ? 'text-green-600'
              : 'text-red-500'
          }`}>
            {message}
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <button
          onClick={() => navigate('/logIn')}
          className="text-primary font-semibold hover:underline"
        >
          Log In
        </button>
      </p>
    </div>
  )
}

export default SignIn
