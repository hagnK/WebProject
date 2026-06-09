import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const L = 3
const t = 0.52

const CENTER = new THREE.Vector3(
  (L / 2 + L + L) / 3,
  (0 + L / 2 + L) / 3,
  (0 + 0 + L / 2) / 3
)

const INV_S3 = 1 / Math.sqrt(3)
const MAGIC_DIST = 12
const MAGIC_POS = CENTER.clone().addScaledVector(
  new THREE.Vector3(INV_S3, INV_S3, INV_S3),
  MAGIC_DIST
)

export default function PenroseTriangle() {
  const mountRef = useRef(null)
  const stateRef = useRef({})
  const [spinning, setSpinning] = useState(true)

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
    scene.background = new THREE.Color(0x07071a)
    scene.fog = new THREE.FogExp2(0x07071a, 0.032)

    // Camera
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 200)
    camera.position.copy(MAGIC_POS)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(CENTER)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.minDistance = 4
    controls.maxDistance = 30
    controls.autoRotate = true
    controls.autoRotateSpeed = 1.8
    controls.update()

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.22))

    const sun = new THREE.DirectionalLight(0xfff5cc, 1.15)
    sun.position.set(12, 18, 8)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    scene.add(sun)

    const fill = new THREE.DirectionalLight(0x4060cc, 0.4)
    fill.position.set(-10, -6, -10)
    scene.add(fill)

    const rim = new THREE.DirectionalLight(0xff7733, 0.3)
    rim.position.set(6, -12, 18)
    scene.add(rim)

    // Beams
    const mats = [
      new THREE.MeshStandardMaterial({ color: 0xd64000, roughness: 0.3, metalness: 0.55 }),
      new THREE.MeshStandardMaterial({ color: 0xc89000, roughness: 0.3, metalness: 0.55 }),
      new THREE.MeshStandardMaterial({ color: 0x2860cc, roughness: 0.3, metalness: 0.55 }),
    ]

    const addBox = (wx, wy, wz, cx, cy, cz, mat) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(wx, wy, wz), mat)
      mesh.position.set(cx, cy, cz)
      mesh.castShadow = true
      mesh.receiveShadow = true
      scene.add(mesh)
    }

    addBox(L + t, t, t,  L / 2, 0,     0,     mats[0])
    addBox(t, L + t, t,  L,     L / 2, 0,     mats[1])
    addBox(t, t, L + t,  L,     L,     L / 2, mats[2])

    const grid = new THREE.GridHelper(20, 20, 0x223366, 0x223366)
    grid.position.set(CENTER.x, -1.5, CENTER.z)
    grid.material.transparent = true
    grid.material.opacity = 0.35
    scene.add(grid)

    // Animation
    let anim = null
    let rafId

    const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

    stateRef.current.flyTo = (targetPos, targetLook, duration = 1100) => {
      anim = {
        startPos: camera.position.clone(),
        startLook: controls.target.clone(),
        targetPos, targetLook, duration,
        startTime: performance.now(),
      }
    }

    stateRef.current.setAutoRotate = (val) => {
      controls.autoRotate = val
    }

    const loop = (now) => {
      rafId = requestAnimationFrame(loop)

      if (anim) {
        const progress = Math.min((now - anim.startTime) / anim.duration, 1)
        const e = easeInOut(progress)
        camera.position.lerpVectors(anim.startPos, anim.targetPos, e)
        controls.target.lerpVectors(anim.startLook, anim.targetLook, e)
        if (progress >= 1) anim = null
      }

      controls.update()
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
      ro.disconnect()
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  const handleMagic = () => {
    stateRef.current.setAutoRotate(false)
    setSpinning(false)
    stateRef.current.flyTo(MAGIC_POS, CENTER)
  }

  const handleSpin = () => {
    const next = !spinning
    setSpinning(next)
    stateRef.current.setAutoRotate(next)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#07071a' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Title */}
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
          드래그 회전 · 스크롤 줌 · 마법 시점에서 착시 확인!
        </p>
      </div>

      {/* Buttons */}
      <div style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 12,
      }}>
        {[
          { label: '✨ 마법 시점', onClick: handleMagic, active: false },
          { label: spinning ? '⟳ 자동 회전 ON' : '⟳ 자동 회전 OFF', onClick: handleSpin, active: spinning },
        ].map(({ label, onClick, active }) => (
          <button key={label} onClick={onClick} style={{
            padding: '10px 22px',
            background: active ? 'rgba(255,190,60,.12)' : 'rgba(255,255,255,.07)',
            border: `1px solid ${active ? 'rgba(255,190,60,.5)' : 'rgba(255,255,255,.18)'}`,
            color: active ? '#ffc04d' : 'rgba(255,255,255,.82)',
            borderRadius: 7, cursor: 'pointer', fontSize: '.85rem',
            fontFamily: 'inherit', letterSpacing: '.5px',
            transition: 'all .15s', whiteSpace: 'nowrap',
          }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{
        position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,.28)', fontFamily: 'monospace',
        fontSize: '.72rem', letterSpacing: 1, pointerEvents: 'none', textAlign: 'center',
      }}>
        불가능한 삼각형 — Penrose Triangle 3D
      </div>
    </div>
  )
}
