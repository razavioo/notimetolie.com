import { useEffect, useRef, useState, useCallback } from 'react'

interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  reconnectAttempts?: number
}

export function useWebSocket(
  url: string | null,
  options: UseWebSocketOptions = {}
) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 3000,
    reconnectAttempts = 5,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    if (!url) return

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        // Don't connect without authentication
        return
      }
      
      const wsUrl = token ? `${url}?token=${token}` : url
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✓ WebSocket connected')
        setIsConnected(true)
        reconnectCountRef.current = 0
        onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          setLastMessage(message)
          onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        // Suppress error logging for initial connection failures
        // This is normal when the server isn't running
        if (reconnectCountRef.current === 0) {
          console.warn('WebSocket connection failed (server may be offline)')
        }
        onError?.(error)
      }

      ws.onclose = (event) => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        wsRef.current = null
        onDisconnect?.()

        // Only attempt reconnection for non-normal closures with auth token
        const hasToken = localStorage.getItem('auth_token')
        const shouldReconnect = hasToken && 
                               reconnectCountRef.current < reconnectAttempts &&
                               event.code !== 1000 // 1000 = normal closure
        
        if (shouldReconnect) {
          reconnectCountRef.current++
          console.log(`Reconnecting... (${reconnectCountRef.current}/${reconnectAttempts})`)
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval)
        } else if (!hasToken) {
          console.log('WebSocket closed - no auth token')
        }
      }
    } catch (error) {
      console.warn('WebSocket unavailable:', error instanceof Error ? error.message : 'Unknown error')
    }
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnectInterval, reconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  const subscribe = useCallback((channel: string) => {
    sendMessage({ type: 'subscribe', channel })
  }, [sendMessage])

  const unsubscribe = useCallback((channel: string) => {
    sendMessage({ type: 'unsubscribe', channel })
  }, [sendMessage])

  useEffect(() => {
    if (url) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [url, connect, disconnect])

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      sendMessage({ type: 'ping', timestamp: Date.now() })
    }, 30000) // Ping every 30 seconds

    return () => clearInterval(interval)
  }, [isConnected, sendMessage])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    subscribe,
    unsubscribe,
    disconnect,
    reconnect: connect,
  }
}

// Specific hook for AI job updates
export function useAIJobUpdates(onJobUpdate?: (update: any) => void) {
  const [shouldConnect, setShouldConnect] = useState(false)
  
  // Only attempt WebSocket connection when we have auth and are on relevant pages
  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('auth_token')
    const isRelevantPage = typeof window !== 'undefined' && 
                           (window.location.pathname.includes('/ai-config') || 
                            window.location.pathname.includes('/blocks/create-with-ai'))
    
    setShouldConnect(!!hasToken && isRelevantPage)
  }, [])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const WS_URL = shouldConnect ? API_URL.replace('http', 'ws') + '/v1/ws' : null

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'ai_job_update' || message.type === 'ai_job_progress') {
      onJobUpdate?.(message)
    }
  }, [onJobUpdate])

  return useWebSocket(WS_URL, {
    onMessage: handleMessage,
    reconnectAttempts: 3, // Reduce reconnection attempts
  })
}
