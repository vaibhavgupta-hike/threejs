const {app, BrowserWindow} = require('electron')
const fs = require('fs')

// app.disableHardwareAcceleration()

var numTimesPaintCalled = 0
var startTime = new Date().getTime()

app.on('ready', function() {

    var win = new BrowserWindow({
        width: 720,
        height: 1280,
        webPreferences: { 
            offscreen: false,
            noseIntegration: true,
            contextIsolation: false
        }
    })
    win.loadFile('webgl_loader_3dmoji.html')
    win.webContents.on('paint', (event, dirty, image) => {
        numTimesPaintCalled += 1
        var timeElapsed = new Date().getTime() - startTime
        console.log('Paint called', numTimesPaintCalled, 'times in ', timeElapsed, 'miliseconds.')

        // fname = 'ex' + String(numTimesPaintCalled) + '.png'
        // fs.writeFileSync(fname, image.toPNG())
    })
    app.on('window-all-closed', () => {
      app.quit()
    })

    win.webContents.setFrameRate(60)

})
