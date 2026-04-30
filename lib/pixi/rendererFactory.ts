import { Application } from 'pixi.js'

export async function createSpectrumApp(canvas: HTMLCanvasElement): Promise<Application> {
  const app = new Application()
  await app.init({
    canvas,
    width: canvas.clientWidth || window.innerWidth,
    height: canvas.clientHeight || 400,
    backgroundColor: 0x050508,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    preference: 'webgl',
  })
  app.ticker.maxFPS = 60
  return app
}
