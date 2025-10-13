// Test app.on('ready') instead of whenReady()
const { app, BrowserWindow } = require('electron')

console.log('[TEST] Electron starting...')
console.log('[TEST] Is ready?', app.isReady())

// Try both methods
app.on('ready', () => {
  console.log('[TEST] ✅ app.on(ready) FIRED!')

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  win.loadURL('data:text/html,<h1 style="color:green;text-align:center;margin-top:200px;">ELECTRON WINDOW IS OPEN!</h1><p style="text-align:center;font-size:24px;">This proves Electron can create windows.</p>')

  win.webContents.on('did-finish-load', () => {
    console.log('[TEST] ✅ Page loaded!')
  })
})

app.whenReady().then(() => {
  console.log('[TEST] ✅ whenReady() ALSO FIRED!')
})

// Add timeout to check if we're stuck
setTimeout(() => {
  console.log('[TEST] ⏱️  5 second timeout - isReady?', app.isReady())
  if (!app.isReady()) {
    console.error('[TEST] ❌ App is NOT ready after 5 seconds - something is blocking!')
    process.exit(1)
  }
}, 5000)

console.log('[TEST] Waiting for ready...')
