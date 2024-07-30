export async function waitForOpenConnection(socket: WebSocket) {
  return new Promise<void>((resolve, reject) => {
    const maxNumberOfAttempts = 10
    const intervalTime = 200

    let currentAttempt = 0
    const interval = setInterval(() => {
      if (currentAttempt > maxNumberOfAttempts - 1) {
        clearInterval(interval)
        reject(new Error('Maximum number of attempts exceeded'))
      } else if (socket.readyState === socket.OPEN) {
        clearInterval(interval)
        resolve()
      }
      currentAttempt += 1
    }, intervalTime)
  })
}
