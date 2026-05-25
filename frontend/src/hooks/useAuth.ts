import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/client'
import type { User } from '../types'

const CURRENT_USER_KEY = ['user']

export function useAuth() {
  const queryClient = useQueryClient()

  const currentUser = useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: authApi.me,
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
