"use client"

import { useEffect, useRef } from "react"

interface Live2DWidgetProps {
  modelPath: string
  className?: string
}

export default function Live2DWidget({
  modelPath,
  className = "",
}: Live2DWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<any>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    let destroyed = false
    let cleanupResize: (() => void) | undefined

    async function init() {
      if (!(window as any).Live2DCubismCore) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script")
          script.src =
            "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"
          script.onload = () => resolve()
          script.onerror = reject
          document.body.appendChild(script)
        })
      }

      const PIXI = await import("pixi.js")

      // PENTING: window.PIXI harus di-set SEBELUM Live2DModel di-import,
      // karena plugin registration (ticker, resize, dsb) terjadi saat
      // module di-evaluate, bukan saat dipakai.
      ;(window as any).PIXI = PIXI

      const { Live2DModel } = await import(
        "pixi-live2d-display-lipsyncpatch/cubism4"
      )

      if (destroyed || !containerRef.current) return

      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight

      // Hindari canvas 0x0 yang bisa bikin renderer gagal di-detect
      if (width === 0 || height === 0) {
        console.warn("Live2DWidget: container has zero size, skipping init")
        return
      }

      const app = new PIXI.Application({
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      appRef.current = app
      containerRef.current.appendChild(app.view as HTMLCanvasElement)

      const model = await Live2DModel.from(modelPath)
      if (destroyed) {
        // Guard tambahan jika cancelResize belum terpasang
        if (typeof (model as any).cancelResize === "function") {
          model.destroy()
        }
        app.destroy(true, { children: true })
        return
      }

      app.stage.addChild(model)
      model.anchor.set(0.5, 0.5)

      const fitModel = () => {
        const screenW = app.screen.width
        const screenH = app.screen.height

        const originalWidth = model.internalModel.originalWidth
        const originalHeight = model.internalModel.originalHeight

        const scale =
          Math.min(screenW / originalWidth, screenH / originalHeight) * 1.1

        model.scale.set(scale)
        model.x = screenW / 2
        model.y = screenH / 1.4
      }

      fitModel()

      const onResize = () => {
        if (!containerRef.current) return
        app.renderer.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        )
        fitModel()
      }
      window.addEventListener("resize", onResize)
      cleanupResize = () => window.removeEventListener("resize", onResize)
    }

    init()

    return () => {
      destroyed = true
      cleanupResize?.()
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, [modelPath])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-hidden ${className}`}
    />
  )
}