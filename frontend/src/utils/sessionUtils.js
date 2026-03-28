const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

export const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId')

  if (!sessionId) {
    sessionId = generateUUID()
    localStorage.setItem('sessionId', sessionId)
  }

  return sessionId
}

export const clearSessionId = () => {
  localStorage.removeItem('sessionId')
}
