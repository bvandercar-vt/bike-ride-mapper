import { createContext, useContext, useState } from 'react'

interface HoveredRouteContextType {
  hoveredRouteId: string | null
  setHoveredRouteId: (id: string | null) => void
}

const HoveredRouteContext = createContext<HoveredRouteContextType | undefined>(undefined)

export const HoveredRouteProvider = ({ children }: { children: React.ReactNode }) => {
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null)
  return (
    <HoveredRouteContext.Provider value={{ hoveredRouteId, setHoveredRouteId }}>
      {children}
    </HoveredRouteContext.Provider>
  )
}

export const useHoveredRoute = () => {
  const ctx = useContext(HoveredRouteContext)
  if (!ctx) throw new Error('useHoveredRoute must be used within HoveredRouteProvider')
  return ctx
}
