import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/store'
import { login, clearError } from '@/store/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, ArrowUpRight, Users } from 'lucide-react'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { isLoading, error } = useSelector((state: RootState) => state.auth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(clearError())
    
    try {
      await dispatch(login({ email, password }) as any).unwrap()
      navigate('/')
    } catch (error) {
      // Error is handled by the slice
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="flex w-full max-w-7xl rounded-xl overflow-hidden shadow-2xl">
        {/* Left Section - Main Content */}
        <div 
          className="w-full lg:w-1/2 flex items-center justify-center p-8 relative"
          style={{
            backgroundImage: "url('/text-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-white/60"></div>
          
          <div className="w-full max-w-xl relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12 justify-center">
              <div className="w-8 h-8 rounded flex items-center justify-center">
              <img src="/vite.png" alt="Document Hub Cientheon" width={40} height={40} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">DOCUMENT HUB</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-medium text-gray-900 mb-4 text-center">
            Welcome to <br/><span className="font-semibold">DocumentHub Cientheon</span>
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8 text-center">
            Your central hub for organizing, sharing, and collaborating on documents. Streamline your workflow with intelligent document management.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 mb-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder="hi@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 pl-12 rounded-full bg-gray-50"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 pl-12 rounded-full bg-gray-50 pr-4"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 bg-black text-white rounded-full font-medium hover:bg-gray-800" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600 mb-8">
            Already have an account?{' '}
            <Link to="/register" className="font-semibold text-gray-900 hover:underline">
              Sign Up
            </Link>
          </div>

          {/* User Testimonial Card */}
          <div className="bg-gray-100 rounded-2xl p-4 flex items-center gap-4">
            <div className="flex -space-x-2">
              <img src="https://api.dicebear.com/9.x/shapes/svg?seed=Aiden" alt="User 1" className="w-10 h-10 rounded-full" />
              <img src="https://api.dicebear.com/9.x/notionists-neutral/svg?seed=Destiny" alt="User 2" className="w-10 h-10 rounded-full" />
              <img src="https://api.dicebear.com/9.x/fun-emoji/svg?seed=Alexander" alt="User 3" className="w-10 h-10 rounded-full" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Let's join with 20k+ Users!</p>
              <p className="text-sm text-gray-600">Let's see happy customers</p>
            </div>
            <ArrowUpRight className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </div>

        {/* Right Section - Empty/Minimal */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-gray-100 to-gray-50 items-center justify-center p-8">
          <div className="text-center text-gray-400">
            <Users className="w-32 h-32 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Welcome to your document workspace</p>
          </div>
        </div>
      </div>
    </div>
  )
}
