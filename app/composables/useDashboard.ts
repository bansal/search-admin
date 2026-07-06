import { createSharedComposable } from '@vueuse/core'

const _useDashboard = () => {
  const router = useRouter()

  defineShortcuts({
    'g-o': () => router.push('/'),
    'g-i': () => router.push('/indexes'),
    'g-k': () => router.push('/keys')
  })

  return {}
}

export const useDashboard = createSharedComposable(_useDashboard)
