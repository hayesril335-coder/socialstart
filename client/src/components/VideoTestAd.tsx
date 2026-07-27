import { useEffect, useRef, useState } from 'react'

type ImaWindow = Window & { google?: { ima?: any } }
type Props = { placement: 'feed' | 'break'; onComplete?: () => void }

const sdkUrl = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js'
const testAdTag = 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&correlator='
let sdkPromise: Promise<void> | null = null

const loadIma = () => {
  if ((window as ImaWindow).google?.ima) return Promise.resolve()
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = sdkUrl
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('The test ad service could not be loaded.'))
    document.head.appendChild(script)
  })
  return sdkPromise
}

export function VideoTestAd({ placement, onComplete }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const contentVideo = useRef<HTMLVideoElement>(null)
  const manager = useRef<any>(null)
  const finished = useRef(false)
  const [status, setStatus] = useState<'ready' | 'loading' | 'playing' | 'complete' | 'unavailable'>('ready')

  useEffect(() => () => manager.current?.destroy(), [])

  const finish = (nextStatus: 'complete' | 'unavailable') => {
    if (finished.current) return
    finished.current = true
    setStatus(nextStatus)
    manager.current?.destroy()
    if (placement === 'break') onComplete?.()
  }

  const play = async () => {
    if (!container.current || !contentVideo.current || status === 'loading' || status === 'playing') return
    setStatus('loading')
    finished.current = false
    try {
      await loadIma()
      const ima = (window as ImaWindow).google!.ima
      const display = new ima.AdDisplayContainer(container.current, contentVideo.current)
      display.initialize()
      const loader = new ima.AdsLoader(display)
      loader.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, () => finish('unavailable'), false)
      loader.addEventListener(ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, (event: any) => {
        manager.current = event.getAdsManager(contentVideo.current)
        manager.current.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, () => finish('unavailable'))
        manager.current.addEventListener(ima.AdEvent.Type.STARTED, () => setStatus('playing'))
        manager.current.addEventListener(ima.AdEvent.Type.ALL_ADS_COMPLETED, () => finish('complete'))
        const width = container.current?.clientWidth || 640
        const height = container.current?.clientHeight || 360
        manager.current.init(width, height, ima.ViewMode.NORMAL)
        manager.current.start()
      }, false)
      const request = new ima.AdsRequest()
      request.adTagUrl = `${testAdTag}${Date.now()}`
      request.linearAdSlotWidth = container.current.clientWidth || 640
      request.linearAdSlotHeight = container.current.clientHeight || 360
      request.nonLinearAdSlotWidth = request.linearAdSlotWidth
      request.nonLinearAdSlotHeight = 120
      loader.requestAds(request)
    } catch {
      finish('unavailable')
    }
  }

  return <article className={`test-video-ad ${placement === 'break' ? 'ad-break' : 'feed-ad'}`}>
    <header><span>Advertisement</span><small>Google IMA test ad</small></header>
    <div className="test-ad-player" ref={container}>
      <video ref={contentVideo} muted playsInline />
      {status === 'ready' && <button onClick={play}>Play test ad</button>}
      {status === 'loading' && <strong>Loading advertisement…</strong>}
      {status === 'complete' && <strong>Test advertisement complete</strong>}
      {status === 'unavailable' && <strong>Advertisement unavailable</strong>}
    </div>
    {placement === 'feed' && <p>This is a test placement. It does not generate revenue.</p>}
  </article>
}
