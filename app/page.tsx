import { createClient } from '@/lib/supabase/server'
import BookingWidget from '@/components/BookingWidget'
import ScrollEffects from '@/components/ScrollEffects'

export default async function HomePage() {
  const supabase = await createClient()
  const [{ data: services }, { data: settings }] = await Promise.all([
    supabase.from('services').select('id, name, description, duration_minutes, price').eq('active', true).order('name'),
    supabase.from('professional_settings').select('business_name, description').limit(1).single(),
  ])
  const businessName = settings?.business_name ?? 'Estudio de piel'
  const description = settings?.description ?? 'Un tratamiento autólogo que utiliza una pequeña muestra de sangre para obtener plasma rico en plaquetas y aplicarlo en la piel del rostro.'
  // Reemplazá estos dos datos por los canales reales del consultorio.
  const contact = {
    whatsappUrl: 'https://wa.me/5491100000000',
    email: 'consultas@tudominio.com',
  }

  return <main className="page">
    <ScrollEffects />
    <header className="site-header">
      <a className="wordmark" href="#inicio" aria-label={`${businessName}, ir al inicio`}><span>{businessName}</span><i aria-hidden="true" /></a>
      <nav className="main-nav" aria-label="Navegación principal"><a href="#tratamiento">El tratamiento</a><a href="#nosotros">Nosotros</a><a href="#contacto">Contacto</a></nav>
      <a className="nav-book" href="#reservar">Reservar <span aria-hidden="true">↘</span></a>
    </header>

    <section className="hero-panel" id="inicio" aria-labelledby="hero-title">
      <div className="hero-copy"><p className="eyebrow light">Medicina estética · Buenos Aires</p><h1 id="hero-title">Plasma rico en plaquetas facial.</h1><p>{description}</p><a className="text-link light-link" href="#tratamiento">Ver cómo es <span aria-hidden="true">↓</span></a></div>
      <div className="hero-image-wrap plasma-composition" aria-label="Composición abstracta inspirada en una muestra de plasma"><div className="plasma-vial"><span className="vial-cap" /><span className="vial-clear" /><span className="vial-plasma" /><span className="vial-blood" /></div><i className="plasma-halo" /><i className="plasma-dot" /></div>
      <p className="hero-side-note">Plasma rico<br />en plaquetas.</p><a className="scroll-mark" href="#tratamiento" aria-label="Ir al tratamiento"><span>Scroll</span><i aria-hidden="true" /></a>
    </section>

    <section className="intro-section" id="tratamiento" aria-labelledby="treatment-title">
      <div className="section-number" data-reveal>01</div><div className="intro-title" data-reveal><p className="eyebrow">Plasma rico en plaquetas</p><h2 id="treatment-title">¿Qué es el plasma rico en plaquetas?</h2></div>
      <div className="intro-text" data-reveal><p>El plasma rico en plaquetas, también llamado PRP, se obtiene a partir de una pequeña muestra de sangre procesada en una centrífuga. Así se concentra la fracción de plasma con mayor cantidad de plaquetas.</p><p>Luego se aplica en las zonas indicadas del rostro, con una técnica definida en la consulta. Antes de realizarlo, evaluamos antecedentes, objetivos y si el tratamiento es adecuado para vos.</p></div>
    </section>

    <section className="ritual-section" aria-label="Cómo es una sesión de plasma rico en plaquetas">
      <div className="ritual-image clinical-composition" data-reveal aria-label="Composición abstracta del proceso de plasma"><div className="clinical-grid" /><div className="clinical-vial"><span /><i /><b /></div><div className="clinical-label">PRP</div><div className="clinical-wave" /></div>
      <div className="ritual-content" data-reveal><p className="eyebrow">El procedimiento</p><ol className="ritual-list"><li><span>01</span><div><h3>Consulta</h3><p>Revisamos tu historia clínica y las zonas a tratar.</p></div></li><li><span>02</span><div><h3>Obtención</h3><p>Tomamos la muestra y obtenemos el plasma rico en plaquetas mediante centrifugación.</p></div></li><li><span>03</span><div><h3>Aplicación</h3><p>Aplicamos el plasma rico en plaquetas —PRP— según la técnica indicada para tu caso.</p></div></li></ol></div>
    </section>

    <section className="statement-section" id="nosotros" aria-labelledby="about-title"><div className="statement-orbit" aria-hidden="true"><span>criterio clínico</span><i /></div><div data-reveal><p className="eyebrow">Nuestro enfoque</p><h2 id="about-title">Consulta, técnica<br />y seguimiento.</h2><p className="statement-text">Indicamos cada tratamiento después de evaluar tu piel y tus antecedentes. La prioridad es que entiendas el procedimiento y tengas expectativas realistas.</p></div></section>

    <section className="booking-section" id="reservar" aria-labelledby="booking-title"><div className="booking-heading" data-reveal><p className="eyebrow">Agenda online</p><h2 id="booking-title">Hagamos lugar<br />para vos.</h2><p>Elegí el tratamiento, el día y el horario que mejor te quede.</p></div><div className="booking-widget-wrap" data-reveal><BookingWidget services={services ?? []} /></div></section>
    <section className="contact-section" id="contacto" aria-labelledby="contact-title"><div data-reveal><p className="eyebrow light">¿Tenés dudas?</p><h2 id="contact-title">¿Este tratamiento es para vos?</h2><p>Escribinos y te contamos cómo es el procedimiento, qué tener en cuenta y cómo coordinar una consulta.</p><div className="contact-methods"><a className="contact-method" href={contact.whatsappUrl} target="_blank" rel="noreferrer"><span>WhatsApp</span><strong>Consultar por WhatsApp <i aria-hidden="true">↗</i></strong></a><a className="contact-method" href={`mailto:${contact.email}`}><span>Email</span><strong>{contact.email} <i aria-hidden="true">↗</i></strong></a></div><a className="contact-cta" href="#reservar">O reservá una consulta <span aria-hidden="true">↗</span></a></div></section>
    <footer className="site-footer"><a className="wordmark" href="#inicio"><span>{businessName}</span><i aria-hidden="true" /></a><p>Medicina estética.</p><a href="#inicio" className="back-top">Volver arriba ↑</a></footer>
  </main>
}
