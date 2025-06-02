
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Check on mount
    checkMobile()
    
    // Create media query listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Use addEventListener for better compatibility
    const handleChange = () => checkMobile()
    mql.addEventListener("change", handleChange)
    
    return () => mql.removeEventListener("change", handleChange)
  }, [])

  return isMobile
}
