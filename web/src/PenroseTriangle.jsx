import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const L = 3
const t = 0.52
const ht = t / 2

const B3FAR = L * 6 / 7 - 0.24
const YTRIM = 0.08

const CENTER = new THREE.Vector3(
  ((L - ht) / 2 + L + L) / 3,
  (0 + (L - t) / 2 + L) / 3,
  (0 + 0 + (-ht + B3FAR) / 2) / 3
)

const INV_S3 = 1 / Math.sqrt(3)
const MAGIC_DIST = 12
const MAGIC_POS = CENTER.clone().addScaledVector(
  new THREE.Vector3(INV_S3, INV_S3, INV_S3),
  MAGIC_DIST
)
// Unit vector from CENTER toward the magic viewpoint
const MAGIC_DIR = new THREE.Vector3(INV_S3, INV_S3, INV_S3)

export default function PenroseTriangle({ onMagicView }) {
  const mountRef = useRef(null)
  const stateRef = useRef({ isMagic: false })
  const onMagicViewRef = useRef(onMagicView)

  // Keep ref in sync with latest prop without re-running the Three.js effect
  useEffect(() => {
    onMagicViewRef.current = onMagicView
  })

  useEffect(() => {
    const el = mountRef.current

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    el.appendChild(renderer.domElement)

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x10102a)
    scene.fog = new THREE.FogExp2(0x10102a, 0.022)

    // Camera
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 200)
    camera.position.copy(MAGIC_POS)

    // Controls — panning disabled so target stays fixed at CENTER
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(CENTER)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.minDistance = 4
    controls.maxDistance = 30
    controls.enablePan = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 1.8
    controls.update()

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))

    const sun = new THREE.DirectionalLight(0xfff5cc, 1.6)
    sun.position.set(12, 18, 8)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    scene.add(sun)

    const fill = new THREE.DirectionalLight(0x5577ee, 0.55)
    fill.position.set(-10, -6, -10)
    scene.add(fill)

    const rim = new THREE.DirectionalLight(0xff8844, 0.45)
    rim.position.set(6, -12, 18)
    scene.add(rim)

    // Beams
    const mats = [
      new THREE.MeshStandardMaterial({ color: 0xd64000, roughness: 0.2, metalness: 0.35, emissive: new THREE.Color(0x2a0800) }),
      new THREE.MeshStandardMaterial({ color: 0xc89000, roughness: 0.2, metalness: 0.35 }),
      new THREE.MeshStandardMaterial({ color: 0x2860cc, roughness: 0.2, metalness: 0.35 }),
    ]

    const addBox = (wx, wy, wz, cx, cy, cz, mat, cast = true, recv = true) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(wx, wy, wz), mat)
      mesh.position.set(cx, cy, cz)
      mesh.castShadow = cast
      mesh.receiveShadow = recv
      scene.add(mesh)
    }

    addBox(L - ht, t,         t,         (L - ht) / 2,       0,          0,                   mats[0], false, false)
    addBox(t,      L - YTRIM, t,         L,                  (L - t - YTRIM) / 2, 0,           mats[1])
    addBox(t,      t,         B3FAR + ht, L,                  L - YTRIM,  (-ht + B3FAR) / 2,   mats[2])

    const grid = new THREE.GridHelper(20, 20, 0x223366, 0x223366)
    grid.position.set(CENTER.x, -1.5, CENTER.z)
    grid.material.transparent = true
    grid.material.opacity = 0.35
    scene.add(grid)

    // ── Hidden cipher hints on each beam (zoom in to read) ────────────────
    const rA = Math.random() * Math.PI * 2
    const rB = Math.random() * Math.PI * 2
    const rC = Math.random() * Math.PI * 2

    const hintDisposables = []

    const addHint = (text, rotRad, color, pw, ph, px, py, pz, rx, ry) => {
      const W = 512, H = 128
      const cv = document.createElement('canvas')
      cv.width = W; cv.height = H
      const ctx = cv.getContext('2d')
      ctx.save()
      ctx.translate(W / 2, H / 2)
      ctx.rotate(rotRad)
      ctx.fillStyle = color
      ctx.font = 'bold 48px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 0, 0)
      ctx.restore()
      const tex = new THREE.CanvasTexture(cv)
      const geo = new THREE.PlaneGeometry(pw, ph)
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true,
        side: THREE.DoubleSide, depthWrite: false,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.rotation.set(rx, ry, 0)
      mesh.position.set(px, py, pz)
      scene.add(mesh)
      hintDisposables.push(tex, geo, mat)
    }

    // Red beam (X-axis): label on top face (+Y)  → rotate plane -π/2 around X
    addHint('A=1', rA, '#ffaa88', 0.6, 0.15,
      (L - ht) * 0.4,  t / 2 + 0.01,  -0.05,
      -Math.PI / 2, 0)

    // Gold beam (Y-axis at x=L): label on front face (+Z) → no plane rotation
    addHint('B=2', rB, '#ffe090', 0.6, 0.15,
      L,  0.85,  t / 2 + 0.01,
      0, 0)

    // Blue beam (Z-axis at x=L, y=L-YTRIM): label on right face (+X) → rotate plane π/2 around Y
    addHint('C=3', rC, '#88bbff', 0.6, 0.15,
      L + t / 2 + 0.01,  L - YTRIM,  0.75,
      0, Math.PI / 2)

    // ── Interaction: stop auto-rotate on drag, resume after idle ──────────
    let resumeTimer = null

    const onStart = () => {
      controls.autoRotate = false
      clearTimeout(resumeTimer)
      resumeTimer = null
    }

    const onEnd = () => {
      clearTimeout(resumeTimer)
      resumeTimer = setTimeout(() => {
        resumeTimer = null
        if (!stateRef.current.isMagic) controls.autoRotate = true
      }, 3000)
    }

    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)

    // ── Animation loop ─────────────────────────────────────────────────────
    const camDir = new THREE.Vector3()
    let rafId

    const loop = () => {
      rafId = requestAnimationFrame(loop)
      controls.update()

      if (!controls.autoRotate) {
        // Check if camera direction matches the magic viewpoint direction
        camDir.copy(camera.position).sub(controls.target).normalize()
        const isMagic = camDir.dot(MAGIC_DIR) > 0.97

        if (isMagic !== stateRef.current.isMagic) {
          stateRef.current.isMagic = isMagic
          onMagicViewRef.current?.(isMagic)
        }
      } else if (stateRef.current.isMagic) {
        // Auto-rotate resumed → clear magic state
        stateRef.current.isMagic = false
        onMagicViewRef.current?.(false)
      }

      renderer.render(scene, camera)
    }
    rafId = requestAnimationFrame(loop)

    // Resize
    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(el)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(resumeTimer)
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
      ro.disconnect()
      hintDisposables.forEach(d => d.dispose())
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#10102a' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      <div style={{
        position: 'absolute', top: 24, width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 8, pointerEvents: 'none',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <h1 style={{
          color: '#fff', fontSize: '1.6rem', letterSpacing: 4,
          fontWeight: 300, margin: 0,
          textShadow: '0 0 40px rgba(255,190,60,.75)',
        }}>
          펜로즈 삼각형
        </h1>
        <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '.8rem', letterSpacing: 1 }}>
          드래그하여 관찰하라
        </p>
      </div>

      <div style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,.28)', fontFamily: 'monospace',
        fontSize: '.72rem', letterSpacing: 1, pointerEvents: 'none', textAlign: 'center',
      }}>
        불가능한 삼각형 — Penrose Triangle 3D
      </div>
    </div>
  )
}
