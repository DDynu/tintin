import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { authApi } from '../api/client'

const CURRENT_USER_KEY = ['user']

export function useAuth() {
  const queryClient = useQueryClient()
  const location = useLocation()

  const currentUser = useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: authApi.me,
    enabled: !['/login', '/register'].includes(location.pathname),
  })

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      localStorage.setItem('token', res.access_token)
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY })
    },
  })

  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => {
      localStorage.setItem('token', res.access_token)
    },
  })

  const logout = () => {
    localStorage.removeItem('token')
    queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY })
  }

  return { currentUser, login, register, logout }
}
