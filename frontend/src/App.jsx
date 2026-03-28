import { useEffect, useRef } from 'react'
import Spline from '@splinetool/react-spline'

const WHATSAPP_NUMBER = '59163256258'

function openWhatsApp(text) {
	if (typeof window === 'undefined') return
	const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
	window.open(url, '_blank', 'noopener,noreferrer')
}

function App() {
	const navRef = useRef(null)
	const heroRef = useRef(null)
	const globalBackgroundRef = useRef(null)
	const globalSplineAppRef = useRef(null)
	const globalSplineObjectsRef = useRef([])
	const layerMistRef = useRef(null)
	const canvasRef = useRef(null)

	const getOrbitControls = (splineApp) => {
		const controls = splineApp?.controls?.orbitControls ?? splineApp?.controls
		if (!controls || typeof controls !== 'object') return null
		return controls
	}

	const handleGlobalBackgroundLoad = (splineApp) => {
		globalSplineAppRef.current = splineApp
		if (typeof splineApp?.getAllObjects === 'function') {
			globalSplineObjectsRef.current = splineApp.getAllObjects().filter((obj) => obj?.rotation)
		}
		const orbit = getOrbitControls(splineApp)
		if (!orbit) return
		const isMobile = window.matchMedia('(max-width: 768px)').matches
		orbit.enableZoom = false
		orbit.isTouchZoom = false
		orbit.enablePan = false
		orbit.enableRotate = true
		orbit.enableDamping = true
		orbit.dampingFactor = 0.08
		orbit.minPolarAngle = Math.PI / 2
		orbit.maxPolarAngle = Math.PI / 2
		if ('autoRotate' in orbit) {
			orbit.autoRotate = true
			orbit.autoRotateSpeed = 0
		}
		if (Array.isArray(orbit.touches)) {
			orbit.touches[0] = 0
			orbit.touches[1] = 0
			orbit.touches[2] = 0
		}
		if (typeof splineApp?.setZoom === 'function') {
			splineApp.setZoom(isMobile ? 0.92 : 1)
		}
	}

	useEffect(() => {
		const bg = globalBackgroundRef.current
		if (!bg) return

		bg.style.transform = 'translate3d(0, 0, 0) scale(1.08)'

		let lastScrollY = window.scrollY
		let angle = 0
		let velocity = 0
		let breathePhase = 0
		let raf = 0
		let lastTime = window.performance.now()

		const onScroll = () => {
			const currentY = window.scrollY
			const deltaY = currentY - lastScrollY
			lastScrollY = currentY

			velocity += deltaY * 0.00014
			velocity = Math.max(-0.02, Math.min(0.02, velocity))
		}

		const animate = (time) => {
			const dt = Math.min(0.05, (time - lastTime) / 1000 || 0.016)
			lastTime = time

			const damping = Math.pow(0.9, dt * 60)
			velocity *= damping
			if (Math.abs(velocity) < 0.00001) {
				velocity = 0
			}

			const step = velocity * (dt * 60)
			angle += step
			breathePhase += dt * 1.1
			const breathing = Math.sin(breathePhase) * 0.0008
			const orbit = getOrbitControls(globalSplineAppRef.current)

			if (orbit) {
				if (typeof orbit.setPolarAngle === 'function') {
					orbit.setPolarAngle(Math.PI / 2)
				}
				if ('autoRotate' in orbit) {
					orbit.autoRotate = true
					orbit.autoRotateSpeed = Math.max(-4.2, Math.min(4.2, velocity * 120 + Math.sin(breathePhase * 0.7) * 0.12))
				} else if (typeof orbit.setAzimuthalAngle === 'function') {
					orbit.setAzimuthalAngle(angle + breathing)
				} else if (typeof orbit.rotateLeft === 'function') {
					orbit.rotateLeft(-(step + breathing))
				}
				if (typeof orbit.update === 'function') {
					orbit.update(dt)
				}
			} else if (globalSplineObjectsRef.current.length > 0) {
				const objectStep = step * 0.85 + breathing
				for (const obj of globalSplineObjectsRef.current) {
					obj.rotation.y += objectStep
				}
				if (typeof globalSplineAppRef.current?.requestRender === 'function') {
					globalSplineAppRef.current.requestRender()
				}
			}

			raf = window.requestAnimationFrame(animate)
		}

		window.addEventListener('scroll', onScroll, { passive: true })
		raf = window.requestAnimationFrame(animate)

		return () => {
			window.removeEventListener('scroll', onScroll)
			window.cancelAnimationFrame(raf)
		}
	}, [])

	useEffect(() => {
		const nav = navRef.current
		if (!nav) return

		const onScroll = () => {
			nav.classList.toggle('scrolled', window.scrollY > 60)
		}

		onScroll()
		window.addEventListener('scroll', onScroll)
		return () => window.removeEventListener('scroll', onScroll)
	}, [])

	useEffect(() => {
		const hero = heroRef.current
		const layers = [{ el: layerMistRef.current, depth: 0.08 }].filter((item) => item.el)

		if (!hero || layers.length === 0) return

		let normalizedX = 0
		let normalizedY = 0
		let scrollY = window.scrollY
		let frame = 0

		const onScroll = () => {
			scrollY = window.scrollY
		}

		const onMouseMove = (e) => {
			const cx = window.innerWidth / 2
			const cy = window.innerHeight / 2
			normalizedX = (e.clientX - cx) / cx
			normalizedY = (e.clientY - cy) / cy
		}

		const onMouseLeave = () => {
			normalizedX = 0
			normalizedY = 0
		}

		const animate = () => {
			layers.forEach(({ el, depth }) => {
				const tx = normalizedX * depth * 40
				const ty = scrollY * depth + normalizedY * depth * 30
				el.style.transform = `translate(${tx}px, ${ty}px)`
			})
			frame = window.requestAnimationFrame(animate)
		}

		window.addEventListener('scroll', onScroll)
		hero.addEventListener('mousemove', onMouseMove)
		hero.addEventListener('mouseleave', onMouseLeave)
		frame = window.requestAnimationFrame(animate)

		return () => {
			window.removeEventListener('scroll', onScroll)
			hero.removeEventListener('mousemove', onMouseMove)
			hero.removeEventListener('mouseleave', onMouseLeave)
			window.cancelAnimationFrame(frame)
		}
	}, [])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const petalColors = ['#F0B8C4', '#E8A0B0', '#FDEEF1', '#E8D5B0', '#D4BC88', '#B8CDB8', '#F5D0D8']
		let frame = 0

		const resizeCanvas = () => {
			canvas.width = window.innerWidth
			canvas.height = window.innerHeight
		}

		const createPetal = (fromTop) => ({
			x: Math.random() * window.innerWidth,
			y: fromTop ? -20 : Math.random() * window.innerHeight,
			size: 4 + Math.random() * 7,
			speedX: -0.3 + Math.random() * 0.8,
			speedY: 0.6 + Math.random() * 1.1,
			rotation: Math.random() * Math.PI * 2,
			rotSpeed: -0.02 + Math.random() * 0.04,
			opacity: 0.3 + Math.random() * 0.5,
			color: petalColors[Math.floor(Math.random() * petalColors.length)],
			wobble: Math.random() * Math.PI * 2,
			wobbleSpeed: 0.01 + Math.random() * 0.02,
		})

		const petals = Array.from({ length: 30 }, () => createPetal(false))

		const drawPetal = (petal) => {
			ctx.save()
			ctx.translate(petal.x, petal.y)
			ctx.rotate(petal.rotation)
			ctx.globalAlpha = petal.opacity
			ctx.fillStyle = petal.color
			ctx.beginPath()
			ctx.ellipse(0, 0, petal.size * 0.55, petal.size, 0, 0, Math.PI * 2)
			ctx.fill()
			ctx.restore()
		}

		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height)
			petals.forEach((petal) => {
				petal.wobble += petal.wobbleSpeed
				petal.x += petal.speedX + Math.sin(petal.wobble) * 0.4
				petal.y += petal.speedY
				petal.rotation += petal.rotSpeed

				if (petal.y > canvas.height + 20 || petal.x < -30 || petal.x > canvas.width + 30) {
					Object.assign(petal, createPetal(true))
					petal.x = Math.random() * canvas.width
				}

				drawPetal(petal)
			})

			frame = window.requestAnimationFrame(animate)
		}

		resizeCanvas()
		window.addEventListener('resize', resizeCanvas)
		frame = window.requestAnimationFrame(animate)

		return () => {
			window.removeEventListener('resize', resizeCanvas)
			window.cancelAnimationFrame(frame)
		}
	}, [])

	useEffect(() => {
		const reveals = document.querySelectorAll('.reveal')
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry, index) => {
					if (entry.isIntersecting) {
						window.setTimeout(() => entry.target.classList.add('visible'), index * 80)
						observer.unobserve(entry.target)
					}
				})
			},
			{ threshold: 0.12 },
		)

		reveals.forEach((el) => observer.observe(el))

		return () => {
			reveals.forEach((el) => observer.unobserve(el))
			observer.disconnect()
		}
	}, [])

	return (
		<>
			<div className="global-spline-background" ref={globalBackgroundRef} aria-hidden="true">
				<Spline scene="https://prod.spline.design/2bdaZT88Mt9EF-O2/scene.splinecode" onLoad={handleGlobalBackgroundLoad} renderOnDemand={false} />
			</div>
			<div className="global-spline-tint" aria-hidden="true" />

			<div className="page-shell">
			<canvas id="petal-canvas" ref={canvasRef} />

			<nav id="navbar" ref={navRef}>
				<a href="#" className="nav-logo">
					Dulce Luz <span>Floreria · La Paz</span>
				</a>
				<ul className="nav-links">
					<li>
						<a href="#catalogo">Catalogo</a>
					</li>
					<li>
						<a href="#extras">Extras</a>
					</li>
					<li>
						<a href="#entrega">Entrega</a>
					</li>
					<li>
						<a href="#contacto">Contacto</a>
					</li>
					<li>
						<a href="/productos" className="nav-cta">
							Pedir ahora
						</a>
					</li>
					<li>
						<a href="/admin/login" className="nav-admin-btn">
							Ingresar
						</a>
					</li>
				</ul>
			</nav>

			<section className="hero" id="hero" ref={heroRef}>
				<div className="parallax-layer layer-bg" />
				<div className="parallax-layer layer-mist" ref={layerMistRef} />

				<div className="hero-layout">
					<div className="hero-content">
						<p className="hero-eyebrow">La Paz, Bolivia · Desde el corazon</p>
						<h1 className="hero-title">
							Flores que
							<br />
							<em>hablan</em> por ti
						</h1>
						<p className="hero-sub">Arreglos florales con alma. Creados con amor para cada momento especial de tu vida.</p>
						<div className="hero-actions">
							<a href="/productos" className="btn-primary">
								Ver catalogo
							</a>
							<a href="/productos" className="btn-ghost">
								Pedir ahora
							</a>
						</div>
					</div>
				</div>

			</section>

			<div className="marquee-wrap" aria-hidden="true">
				<div className="marquee-track">
					<div className="marquee-item">Ramos · Arreglos en Caja · Lujo Floral · Decoracion de Eventos · Entrega el Mismo Dia · La Paz · El Alto</div>
					<div className="marquee-item">Ramos · Arreglos en Caja · Lujo Floral · Decoracion de Eventos · Entrega el Mismo Dia · La Paz · El Alto</div>
					<div className="marquee-item">Ramos · Arreglos en Caja · Lujo Floral · Decoracion de Eventos · Entrega el Mismo Dia · La Paz · El Alto</div>
				</div>
			</div>

			<section className="about">
				<div className="about-visual">
					<div className="about-floral-decor" />
					<div className="about-card reveal">
						<span className="about-icon">
							<i className="pi pi-sparkles" aria-hidden="true" />
						</span>
						<div className="about-card-num">30+</div>
						<div className="about-card-label">Modelos unicos</div>
						<div className="about-divider" />
						<div className="about-card-num about-icon-num">
							<i className="pi pi-heart" aria-hidden="true" />
						</div>
						<div className="about-card-label">Hechos con amor</div>
						<div className="about-divider" />
						<div className="about-card-num about-hours">24h</div>
						<div className="about-card-label">Entrega el mismo dia</div>
					</div>
				</div>
				<div className="about-text-block reveal">
					<p className="section-eyebrow">Nuestra historia</p>
					<h2 className="section-title">
						Cada flor,
						<br />
						una <em>emocion</em>
					</h2>
					<p className="section-body">
						En Floreria Dulce Luz creemos que las flores son el lenguaje mas honesto del corazon. Cada arreglo que creamos lleva consigo dedicacion, estetica y el deseo de que quien lo recibe sienta algo genuino e inolvidable.
					</p>
					<p className="section-body">Estamos en el corazon de La Paz, listos para hacer especial tu cumpleanos, aniversario, o simplemente el dia de hoy.</p>
					<div className="pills">
						<span className="pill">
							<i className="pi pi-gift" aria-hidden="true" /> Cumpleanos
						</span>
						<span className="pill">
							<i className="pi pi-heart-fill" aria-hidden="true" /> Aniversarios
						</span>
						<span className="pill">
							<i className="pi pi-star" aria-hidden="true" /> San Valentin
						</span>
						<span className="pill">
							<i className="pi pi-users" aria-hidden="true" /> Bodas
						</span>
						<span className="pill">
							<i className="pi pi-sparkles" aria-hidden="true" /> Fechas especiales
						</span>
					</div>
				</div>
			</section>

			<section className="categories" id="catalogo">
				<div className="section-header reveal">
					<p className="section-eyebrow">Nuestros arreglos</p>
					<h2 className="section-title">
						Escoge tu <em>momento</em>
					</h2>
				</div>

				<div className="cat-grid">
					<div className="cat-card reveal" onClick={() => openWhatsApp('Hola! Quiero saber mas sobre los Ramos')}>
						<div className="cat-bg" />
						<div className="cat-flower">
							<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
								<ellipse cx="50" cy="20" rx="14" ry="26" fill="rgba(255,255,255,.6)" transform="rotate(0,50,50)" />
								<ellipse cx="50" cy="20" rx="14" ry="26" fill="rgba(255,255,255,.5)" transform="rotate(45,50,50)" />
								<ellipse cx="50" cy="20" rx="14" ry="26" fill="rgba(255,255,255,.6)" transform="rotate(90,50,50)" />
								<ellipse cx="50" cy="20" rx="14" ry="26" fill="rgba(255,255,255,.5)" transform="rotate(135,50,50)" />
								<ellipse cx="50" cy="20" rx="14" ry="26" fill="rgba(255,255,255,.6)" transform="rotate(180,50,50)" />
								<ellipse cx="50" cy="20" rx="14" ry="26" fill="rgba(255,255,255,.5)" transform="rotate(225,50,50)" />
								<ellipse cx="50" cy="20" rx="14" ry="26" fill="rgba(255,255,255,.6)" transform="rotate(270,50,50)" />
								<ellipse cx="50" cy="20" rx="14" ry="26" fill="rgba(255,255,255,.5)" transform="rotate(315,50,50)" />
								<circle cx="50" cy="50" r="12" fill="rgba(255,255,255,.8)" />
							</svg>
						</div>
						<div className="cat-arrow">↗</div>
						<div className="cat-overlay">
							<div className="cat-name">Ramos</div>
							<div className="cat-desc">Clasicos · Modernos · Silvestres</div>
						</div>
					</div>

					<div className="cat-card reveal" onClick={() => openWhatsApp('Hola! Me interesan los Arreglos en Caja')}>
						<div className="cat-bg" />
						<div className="cat-flower">
							<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
								<ellipse cx="50" cy="22" rx="12" ry="22" fill="rgba(255,255,255,.6)" transform="rotate(0,50,50)" />
								<ellipse cx="50" cy="22" rx="12" ry="22" fill="rgba(255,255,255,.5)" transform="rotate(60,50,50)" />
								<ellipse cx="50" cy="22" rx="12" ry="22" fill="rgba(255,255,255,.6)" transform="rotate(120,50,50)" />
								<ellipse cx="50" cy="22" rx="12" ry="22" fill="rgba(255,255,255,.5)" transform="rotate(180,50,50)" />
								<ellipse cx="50" cy="22" rx="12" ry="22" fill="rgba(255,255,255,.6)" transform="rotate(240,50,50)" />
								<ellipse cx="50" cy="22" rx="12" ry="22" fill="rgba(255,255,255,.5)" transform="rotate(300,50,50)" />
								<circle cx="50" cy="50" r="10" fill="rgba(255,255,255,.8)" />
							</svg>
						</div>
						<div className="cat-arrow">↗</div>
						<div className="cat-overlay">
							<div className="cat-name">Arreglos en Caja</div>
							<div className="cat-desc">Elegancia · Presentacion especial</div>
						</div>
					</div>

					<div className="cat-card reveal" onClick={() => openWhatsApp('Hola! Quiero ver los Arreglos de Lujo')}>
						<div className="cat-bg" />
						<div className="cat-flower">
							<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
								<ellipse cx="50" cy="20" rx="13" ry="24" fill="rgba(255,255,255,.6)" transform="rotate(0,50,50)" />
								<ellipse cx="50" cy="20" rx="13" ry="24" fill="rgba(255,255,255,.45)" transform="rotate(51.4,50,50)" />
								<ellipse cx="50" cy="20" rx="13" ry="24" fill="rgba(255,255,255,.6)" transform="rotate(102.8,50,50)" />
								<ellipse cx="50" cy="20" rx="13" ry="24" fill="rgba(255,255,255,.45)" transform="rotate(154.3,50,50)" />
								<ellipse cx="50" cy="20" rx="13" ry="24" fill="rgba(255,255,255,.6)" transform="rotate(205.7,50,50)" />
								<ellipse cx="50" cy="20" rx="13" ry="24" fill="rgba(255,255,255,.45)" transform="rotate(257.1,50,50)" />
								<ellipse cx="50" cy="20" rx="13" ry="24" fill="rgba(255,255,255,.6)" transform="rotate(308.6,50,50)" />
								<circle cx="50" cy="50" r="11" fill="rgba(255,255,255,.9)" />
								<circle cx="50" cy="50" r="5" fill="rgba(255,230,150,.8)" />
							</svg>
						</div>
						<div className="cat-arrow">↗</div>
						<div className="cat-overlay">
							<div className="cat-name">Arreglos de Lujo</div>
							<div className="cat-desc">Premium · Exclusivos · Memorables</div>
						</div>
					</div>

					<div className="cat-card reveal" onClick={() => openWhatsApp('Hola! Me interesa la Decoracion de Eventos')}>
						<div className="cat-bg" />
						<div className="cat-flower">
							<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
								<ellipse cx="50" cy="22" rx="11" ry="20" fill="rgba(255,255,255,.55)" transform="rotate(0,50,50)" />
								<ellipse cx="50" cy="22" rx="11" ry="20" fill="rgba(255,255,255,.4)" transform="rotate(90,50,50)" />
								<ellipse cx="50" cy="22" rx="11" ry="20" fill="rgba(255,255,255,.55)" transform="rotate(180,50,50)" />
								<ellipse cx="50" cy="22" rx="11" ry="20" fill="rgba(255,255,255,.4)" transform="rotate(270,50,50)" />
								<circle cx="50" cy="50" r="9" fill="rgba(255,255,255,.8)" />
							</svg>
						</div>
						<div className="cat-arrow">↗</div>
						<div className="cat-overlay">
							<div className="cat-name">Decoracion de Eventos</div>
							<div className="cat-desc">Bodas · Celebraciones · Fiestas</div>
						</div>
					</div>

					<div className="cat-card reveal" onClick={() => openWhatsApp('Hola! Quiero un arreglo personalizado')}>
						<div className="cat-bg" />
						<div className="cat-flower">
							<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
								<ellipse cx="50" cy="20" rx="12" ry="22" fill="rgba(255,255,255,.6)" transform="rotate(0,50,50)" />
								<ellipse cx="50" cy="20" rx="12" ry="22" fill="rgba(255,255,255,.5)" transform="rotate(72,50,50)" />
								<ellipse cx="50" cy="20" rx="12" ry="22" fill="rgba(255,255,255,.6)" transform="rotate(144,50,50)" />
								<ellipse cx="50" cy="20" rx="12" ry="22" fill="rgba(255,255,255,.5)" transform="rotate(216,50,50)" />
								<ellipse cx="50" cy="20" rx="12" ry="22" fill="rgba(255,255,255,.6)" transform="rotate(288,50,50)" />
								<circle cx="50" cy="50" r="10" fill="rgba(255,255,255,.85)" />
							</svg>
						</div>
						<div className="cat-arrow">↗</div>
						<div className="cat-overlay">
							<div className="cat-name">Ocasiones Especiales</div>
							<div className="cat-desc">San Valentin · Dia de la Madre</div>
						</div>
					</div>

					<div className="cat-card reveal" onClick={() => openWhatsApp('Hola! Cuentame sobre los arreglos para fechas especiales')}>
						<div className="cat-bg" />
						<div className="cat-flower">
							<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
								<ellipse cx="50" cy="20" rx="13" ry="23" fill="rgba(255,255,255,.55)" transform="rotate(0,50,50)" />
								<ellipse cx="50" cy="20" rx="13" ry="23" fill="rgba(255,255,255,.4)" transform="rotate(60,50,50)" />
								<ellipse cx="50" cy="20" rx="13" ry="23" fill="rgba(255,255,255,.55)" transform="rotate(120,50,50)" />
								<ellipse cx="50" cy="20" rx="13" ry="23" fill="rgba(255,255,255,.4)" transform="rotate(180,50,50)" />
								<ellipse cx="50" cy="20" rx="13" ry="23" fill="rgba(255,255,255,.55)" transform="rotate(240,50,50)" />
								<ellipse cx="50" cy="20" rx="13" ry="23" fill="rgba(255,255,255,.4)" transform="rotate(300,50,50)" />
								<circle cx="50" cy="50" r="11" fill="rgba(255,255,255,.8)" />
							</svg>
						</div>
						<div className="cat-arrow">↗</div>
						<div className="cat-overlay">
							<div className="cat-name">Condolencias</div>
							<div className="cat-desc">Con respeto · Con elegancia</div>
						</div>
					</div>
				</div>
			</section>

			<section className="extras" id="extras">
				<div className="section-header reveal">
					<p className="section-eyebrow">Complementa tu regalo</p>
					<h2 className="section-title">
						Extras que <em>sorprenden</em>
					</h2>
				</div>
				<p className="section-body reveal extras-body">Suma algo mas a tu arreglo y haz que el momento sea completamente especial.</p>
				<div className="extras-grid reveal">
					<div className="extra-pill">
						<span className="extra-icon">
							<i className="pi pi-envelope" aria-hidden="true" />
						</span>
						Tarjetas personalizadas
					</div>
					<div className="extra-pill">
						<span className="extra-icon">
							<i className="pi pi-box" aria-hidden="true" />
						</span>
						Chocolates
					</div>
					<div className="extra-pill">
						<span className="extra-icon">
							<i className="pi pi-heart" aria-hidden="true" />
						</span>
						Peluches
					</div>
					<div className="extra-pill">
						<span className="extra-icon">
							<i className="pi pi-circle" aria-hidden="true" />
						</span>
						Globos
					</div>
					<div className="extra-pill">
						<span className="extra-icon">
							<i className="pi pi-globe" aria-hidden="true" />
						</span>
						Vino
					</div>
					<div className="extra-pill">
						<span className="extra-icon">
							<i className="pi pi-bolt" aria-hidden="true" />
						</span>
						Jugo
					</div>
				</div>
			</section>

			<section className="delivery" id="entrega">
				<div className="delivery-bg" />
				<p className="section-eyebrow">Llega a tiempo</p>
				<h2 className="section-title delivery-title">
					Entrega rapida <em>en La Paz</em>
				</h2>
				<div className="delivery-cards reveal">
					<div className="delivery-card">
						<span className="delivery-card-icon">
							<i className="pi pi-bolt" aria-hidden="true" />
						</span>
						<div className="delivery-card-title">Mismo dia</div>
						<div className="delivery-card-text">Pedidos antes del mediodia</div>
					</div>
					<div className="delivery-card">
						<span className="delivery-card-icon">
							<i className="pi pi-map-marker" aria-hidden="true" />
						</span>
						<div className="delivery-card-title">La Paz y El Alto</div>
						<div className="delivery-card-text">Todas las zonas</div>
					</div>
					<div className="delivery-card">
						<span className="delivery-card-icon">
							<i className="pi pi-comments" aria-hidden="true" />
						</span>
						<div className="delivery-card-title">Coordina por WhatsApp</div>
						<div className="delivery-card-text">Atencion personalizada</div>
					</div>
					<div className="delivery-card">
						<span className="delivery-card-icon">
							<i className="pi pi-shopping-bag" aria-hidden="true" />
						</span>
						<div className="delivery-card-title">Tambien retiras</div>
						<div className="delivery-card-text">Av. Buenos Aires #1486</div>
					</div>
				</div>
			</section>

			<section className="cta-section" id="contacto">
				<div className="cta-glow" />
				<p className="section-eyebrow reveal">Lista para sorprender?</p>
				<h2 className="section-title reveal">
					Haz tu pedido
					<br />
					hoy mismo
				</h2>
				<p className="section-body reveal cta-copy">Escribenos por WhatsApp y te ayudamos a elegir el arreglo perfecto. Respuesta inmediata, sin complicaciones.</p>
				<div className="cta-buttons reveal">
					<a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola! Me gustaria hacer un pedido en Floreria Dulce Luz')}`} target="_blank" rel="noreferrer" className="btn-whatsapp">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
						</svg>
						Escribir por WhatsApp
					</a>
					<a href="https://www.instagram.com/floreriadulceluz" target="_blank" rel="noreferrer" className="btn-ghost">
						Ver Instagram
					</a>
					<a href="https://www.tiktok.com/@floreria.dulce.luz" target="_blank" rel="noreferrer" className="btn-ghost">
						Ver TikTok
					</a>
				</div>

				<div className="contact-info reveal">
					<div className="contact-item">
						<span className="contact-label">Direccion</span>
						<span className="contact-value">Av. Buenos Aires casi 3 de Mayo #1486, La Paz</span>
					</div>
					<div className="contact-item">
						<span className="contact-label">Telefono</span>
						<span className="contact-value">
							<a href="tel:+59163256258">+591 63256258</a>
						</span>
					</div>
					<div className="contact-item">
						<span className="contact-label">Email</span>
						<span className="contact-value">
							<a href="mailto:creacionesdulceluz@gmail.com">creacionesdulceluz@gmail.com</a>
						</span>
					</div>
				</div>
			</section>

			<footer>
				<div className="footer-logo">Floreria Dulce Luz</div>
				<span className="footer-copy">© 2026 · Todos los derechos reservados</span>
				<div className="footer-social">
					<a href="https://www.facebook.com/FloreriaDulceLuz" target="_blank" rel="noreferrer">
						Facebook
					</a>
					<a href="https://www.instagram.com/floreriadulceluz" target="_blank" rel="noreferrer">
						Instagram
					</a>
					<a href="https://www.tiktok.com/@floreria.dulce.luz" target="_blank" rel="noreferrer">
						TikTok
					</a>
				</div>
			</footer>
			</div>
		</>
	)
}

export default App
