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
      const { Live2DModel } = await import(
        "pixi-live2d-display-lipsyncpatch/cubism4"
      )
      ;(window as any).PIXI = PIXI

      if (destroyed || !containerRef.current) return

      const app = new PIXI.Application({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      appRef.current = app
      containerRef.current.appendChild(app.view as HTMLCanvasElement)

      const model = await Live2DModel.from(modelPath)
      if (destroyed) {
        model.destroy()
        app.destroy(true, { children: true })
        return
      }

      app.stage.addChild(model)
      model.anchor.set(0.5, 0.5)

      // fit model ke dalam container (contain, bukan fixed width)
      const fitModel = () => {
        const screenW = app.screen.width
        const screenH = app.screen.height

        // model.width/height asli (sebelum di-scale) — ambil dari internalModel
        const originalWidth = model.internalModel.originalWidth
        const originalHeight = model.internalModel.originalHeight

        const scale = Math.min(
          screenW / originalWidth,
          screenH / originalHeight
        ) * 1.1 // 0.9 = kasih sedikit margin biar tidak mepet tepi

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