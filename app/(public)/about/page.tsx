import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, 
  Award, 
  Leaf, 
  Coffee, 
  Users, 
  Star, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Quote, 
  Compass, 
  Flame, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us & Founders — Thirst.',
  description:
    'Discover the vision, craft patisserie heritage, and the founders behind Thirst. — India\'s luxury dessert and confectionery boutique.',
};

const values = [
  { 
    icon: Heart, 
    title: 'Pure Artisanal Passion', 
    desc: 'Every dessert is handcrafted in micro-batches with master culinary techniques and genuine devotion to taste balance.' 
  },
  { 
    icon: Leaf, 
    title: 'Grade-A Global Ingredients', 
    desc: 'We source single-origin Belgian cocoa, French Normandy butter, and farm-fresh dairy from certified sustainable suppliers.' 
  },
  { 
    icon: Award, 
    title: 'Award-Winning Standards', 
    desc: 'Celebrated for setting a new benchmark in premium Indian dessert culture and authentic confectionery presentation.' 
  },
  { 
    icon: Coffee, 
    title: 'Boutique Experience', 
    desc: 'Every guest touchpoint — from ambient sensory boutique decor to bespoke packaging — is designed for unforgettable luxury.' 
  },
];

const milestones = [
  { year: '2025', title: 'The Dream Ignited', desc: 'Confectionery R&D lab established with a single vision: elevated patisserie for everyone.' },
  { year: '2025', title: 'Flagship Launch', desc: 'Opened our flagship boutique at Siva Vishnu Kovil Street, Thiruvallur to resounding acclaim.' },
  { year: '2026', title: '15,000+ Connoisseurs', desc: 'Crossed over 15,000 satisfied guests with 4.9★ community ratings across all signature treats.' },
  { year: '2026+', title: 'Franchise Expansion', desc: 'Launching curated kiosk and boutique cafe franchise formats across major metropolitan hubs.' },
];

const founders = [
  {
    name: 'V Meenakshi',
    role: 'Founder & Chief Pastry Innovator',
    badge: 'Culinary Visionary',
    image: '/founder-meenakshi.jpg',
    bio: 'A master culinary artist with profound expertise in pastry architecture, chocolate temperance, and artisanal dessert science. Meenakshi pioneered Thirst\'s signature Belgian Hot Chocolate formulations and decadent multi-layered cake collections. With an uncompromising dedication to sensory balance, she oversees every single formulation, ingredient standard, and presentation guideline that emerges from the Thirst. confectionery kitchen.',
    quote: 'Dessert is not just a dish — it is an intimate expression of joy, comfort, and celebration. At Thirst., every creation is crafted to feel like a warm embrace of pure luxury.',
    skills: ['Patisserie Architecture', 'Belgian Chocolate Tempering', 'Flavor Innovation', 'Sensory Aesthetics']
  },
  {
    name: 'Yuvaraj',
    role: 'Co-Founder & Head of Operations & Growth',
    badge: 'Growth & Hospitality Strategist',
    image: '/founder-yuvaraj.jpg',
    bio: 'An entrepreneurial leader committed to scaling craft hospitality with mathematical precision and heartfelt warmth. Yuvaraj oversees brand expansion, boutique site architecture, cold-chain logistics, franchise partnerships, and guest hospitality benchmarks. Under his operational stewardship, Thirst. has maintained zero-compromise product consistency while expanding its footprint from a local flagship to a high-demand regional brand.',
    quote: 'True luxury lies in the consistency of the smallest details. Our mission is to ensure that whether you visit our flagship or any franchise partner, the magic of Thirst. is unmistakable.',
    skills: ['Boutique Expansion', 'Supply Chain Precision', 'Franchise Development', 'Guest Experience']
  }
];

const projectPillars = [
  {
    icon: Sparkles,
    title: '100% Pure Belgian Cocoa',
    desc: 'Never diluted with vegetable fats or artificial compounds. Pure cocoa butter for velvety melts.'
  },
  {
    icon: Flame,
    title: 'Fresh Daily Micro-Batches',
    desc: 'Baked and tempered daily in controlled humidity studios to preserve crunch, fluff, and sheen.'
  },
  {
    icon: ShieldCheck,
    title: 'FSSAI Certified Purity',
    desc: 'Highest hygiene, temperature monitoring, and transparent clean-label food grade standards.'
  },
  {
    icon: Compass,
    title: 'Modern Indian Palate',
    desc: 'Classic European patisserie mastery adapted with regional spices, rich berries, and tropical notes.'
  }
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section
        style={{
          paddingTop: 140,
          paddingBottom: 90,
          background: 'var(--color-bg-primary)',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          borderBottom: '4px solid var(--color-plum)'
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-gold)', 
            color: 'var(--color-plum)', 
            padding: '8px 24px', 
            borderRadius: '50px', 
            fontWeight: 800, 
            letterSpacing: '2px', 
            textTransform: 'uppercase', 
            fontSize: '0.85rem', 
            marginBottom: '24px',
            border: '2px solid var(--color-plum)',
            boxShadow: '3px 3px 0px var(--color-plum)'
          }}>
            <Sparkles size={16} /> The Thirst. Story & Founders
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 400,
              fontSize: 'clamp(2.75rem, 6vw, 5rem)',
              color: 'var(--color-plum)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '24px',
              lineHeight: 1.1
            }}
          >
            Born from a <span style={{ color: 'var(--color-berry)', position: 'relative' }}>
              Deep Passion
              <svg style={{ position: 'absolute', bottom: '-5px', left: 0, width: '100%', height: '12px' }} viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M0,10 Q100,-5 200,10" fill="none" stroke="var(--color-gold)" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.25rem', maxWidth: 740, margin: '0 auto', fontWeight: 600, lineHeight: 1.7 }}>
            What began as an artisanal confectionery lab has flourished into India’s beloved luxury dessert destination. Handcrafted daily for discerning palates and genuine celebrations.
          </p>
        </div>
      </section>

      {/* Brand & Project Details Section */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '60px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ 
                position: 'relative', 
                paddingBottom: '95%', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                border: '4px solid var(--color-plum)', 
                boxShadow: 'var(--shadow-xl)', 
                background: 'var(--color-white)' 
              }}>
                <Image 
                  src="/hot-chocolate.png" 
                  alt="Thirst Craft Chocolate Creation" 
                  fill 
                  style={{ objectFit: 'cover' }} 
                  priority
                />
              </div>
              <div style={{
                position: 'absolute',
                bottom: '-20px',
                right: '20px',
                background: 'var(--color-gold)',
                color: 'var(--color-plum)',
                padding: '16px 24px',
                borderRadius: '16px',
                border: '3px solid var(--color-plum)',
                boxShadow: '4px 4px 0px var(--color-plum)',
                fontWeight: 800,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Award size={20} /> Handcrafted in Thiruvallur
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--color-berry)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px', fontSize: '0.9rem' }}>
                Project & Brand Heritage
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem, 4.5vw, 3.75rem)', color: 'var(--color-plum)', lineHeight: 1.15, marginBottom: '24px' }}>
                Elevating India’s Dessert Culture
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: 1.8, fontSize: '1.1rem', fontWeight: 600 }}>
                Thirst. was conceived in 2025 by visionary confectioners who recognized a profound void in India’s dessert landscape: authentic, uncompromised patisserie craft made accessible in an atmosphere of warmth and modern luxury.
              </p>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', lineHeight: 1.8, fontSize: '1.05rem', fontWeight: 500 }}>
                From our flagship boutique located at Siva Vishnu Kovil Street, Thiruvallur, we engineer every single layered cake, molten hot chocolate, and chilled artisanal treat with zero artificial shortcuts. Our mission is to transform everyday sugar cravings into memorable moments of pure indulgence.
              </p>

              {/* Stats Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '20px', background: 'var(--color-white)', padding: '24px', borderRadius: '16px', border: '3px solid var(--color-plum)', boxShadow: 'var(--shadow-sm)' }}>
                {[
                  { value: '2+', label: 'Years of R&D' },
                  { value: '15k+', label: 'Happy Connoisseurs' },
                  { value: '25+', label: 'Signature Recipes' },
                  { value: '4.9★', label: 'Average Rating' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '2.1rem', color: 'var(--color-plum)', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '6px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Craft Pillars */}
      <section className="section" style={{ background: 'var(--color-white)', borderBottom: '4px solid var(--color-plum)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ color: 'var(--color-berry)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
              The Quality Promise
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem, 4vw, 3.25rem)', color: 'var(--color-plum)' }}>
              How We Craft Every Creation
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: 600, margin: '14px auto 0', fontSize: '1.05rem', fontWeight: 600 }}>
              Precision temperature control, certified single-origin ingredients, and an unwavering commitment to flavour purity.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '28px' }}>
            {projectPillars.map(({ icon: Icon, title, desc }) => (
              <div 
                key={title} 
                style={{ 
                  background: 'var(--color-cream)', 
                  padding: '36px 28px', 
                  borderRadius: '18px', 
                  border: '3px solid var(--color-plum)', 
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '14px',
                  background: 'var(--color-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-plum)',
                  border: '2px solid var(--color-plum)'
                }}>
                  <Icon size={26} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--color-plum)', fontWeight: 700 }}>
                  {title}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, fontWeight: 500 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDERS SECTION */}
      <section 
        id="founders" 
        className="section" 
        style={{ 
          background: 'var(--color-lavender)', 
          borderBottom: '4px solid var(--color-plum)',
          position: 'relative'
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'var(--color-white)', 
              color: 'var(--color-berry)', 
              padding: '6px 20px', 
              borderRadius: '50px', 
              border: '2px solid var(--color-plum)',
              fontWeight: 800, 
              fontSize: '0.85rem', 
              textTransform: 'uppercase', 
              letterSpacing: '2px', 
              marginBottom: '16px',
              boxShadow: '2px 2px 0px var(--color-plum)'
            }}>
              <Users size={16} /> Leadership & Culinary Vision
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', color: 'var(--color-plum)', textTransform: 'uppercase' }}>
              Meet The Founders
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: 700, margin: '14px auto 0', fontSize: '1.15rem', fontWeight: 600 }}>
              The culinary passion and operational architecture behind India’s newest confectionery sensation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '40px', alignItems: 'stretch' }}>
            {founders.map(founder => (
              <div 
                key={founder.name} 
                style={{ 
                  background: 'var(--color-white)', 
                  border: '4px solid var(--color-plum)', 
                  borderRadius: '24px', 
                  boxShadow: 'var(--shadow-xl)', 
                  padding: '36px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Top Corner Decor */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle at top right, var(--color-gold) 0%, transparent 70%)', opacity: 0.6, pointerEvents: 'none' }} />

                <div>
                  {/* Photo & Header Row */}
                  <div className="flex-col-mobile" style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{
                      position: 'relative',
                      width: 140,
                      height: 140,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '4px solid var(--color-plum)',
                      boxShadow: '0 8px 24px rgba(45,30,47,0.18)',
                      flexShrink: 0,
                      background: 'var(--color-cream)'
                    }}>
                      <Image 
                        src={founder.image} 
                        alt={founder.name} 
                        fill 
                        style={{ objectFit: 'cover' }} 
                        sizes="140px"
                      />
                    </div>
                    <div>
                      <div style={{ 
                        display: 'inline-block',
                        background: 'rgba(217,79,138,0.12)', 
                        color: 'var(--color-berry)', 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: 800, 
                        letterSpacing: '1px', 
                        textTransform: 'uppercase', 
                        marginBottom: '8px',
                        border: '1px solid rgba(217,79,138,0.3)'
                      }}>
                        {founder.badge}
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--color-plum)', lineHeight: 1.15, marginBottom: '6px' }}>
                        {founder.name}
                      </h3>
                      <p style={{ color: 'var(--color-berry)', fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {founder.role}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.75, fontSize: '1.025rem', fontWeight: 500, marginBottom: '24px' }}>
                    {founder.bio}
                  </p>

                  {/* Quote */}
                  <div style={{
                    background: 'var(--color-cream)',
                    borderLeft: '4px solid var(--color-berry)',
                    padding: '16px 20px',
                    borderRadius: '0 12px 12px 0',
                    marginBottom: '24px',
                    fontStyle: 'italic',
                    color: 'var(--color-plum)',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    fontWeight: 600,
                    position: 'relative'
                  }}>
                    <Quote size={20} style={{ opacity: 0.3, display: 'inline', marginRight: '6px', verticalAlign: 'top' }} />
                    {founder.quote}
                  </div>
                </div>

                {/* Skills/Pillars tags */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '1px', marginBottom: '10px' }}>
                    Key Focus Areas
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {founder.skills.map(s => (
                      <span 
                        key={s} 
                        style={{ 
                          background: 'var(--color-lavender)', 
                          color: 'var(--color-plum)', 
                          fontSize: '0.8rem', 
                          fontWeight: 700, 
                          padding: '6px 14px', 
                          borderRadius: '50px',
                          border: '1.5px solid var(--color-plum)'
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones / Journey */}
      <section className="section" style={{ background: 'var(--color-cream)', borderBottom: '4px solid var(--color-plum)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ color: 'var(--color-berry)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
              The Roadmap
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem, 4vw, 3.25rem)', color: 'var(--color-plum)' }}>
              Our Journey & Milestones
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '24px' }}>
            {milestones.map((m, idx) => (
              <div 
                key={m.title} 
                style={{ 
                  background: 'var(--color-white)', 
                  border: '3px solid var(--color-plum)', 
                  borderRadius: '16px', 
                  padding: '30px 24px', 
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative'
                }}
              >
                <div style={{
                  display: 'inline-block',
                  background: idx % 2 === 0 ? 'var(--color-gold)' : 'var(--color-berry)',
                  color: idx % 2 === 0 ? 'var(--color-plum)' : 'white',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  marginBottom: '16px',
                  border: '2px solid var(--color-plum)'
                }}>
                  {m.year}
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--color-plum)', marginBottom: '10px' }}>
                  {m.title}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, fontWeight: 500 }}>
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section" style={{ background: 'var(--color-white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ color: 'var(--color-berry)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Our Core Pillars</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem, 4vw, 3.25rem)', color: 'var(--color-plum)' }}>What We Stand For</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '28px' }}>
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--color-cream)', padding: '36px 28px', textAlign: 'center', border: '3px solid var(--color-plum)', borderRadius: '18px', boxShadow: 'var(--shadow-md)' }}>
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    background: 'var(--color-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    color: 'var(--color-plum)',
                    border: '3px solid var(--color-plum)'
                  }}
                >
                  <Icon size={30} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.35rem', color: 'var(--color-plum)', marginBottom: '12px' }}>
                  {title}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, fontWeight: 500 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section" style={{ background: 'var(--color-gold)', textAlign: 'center', borderTop: '4px solid var(--color-plum)' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--color-white)', padding: '8px 24px', borderRadius: '50px', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-sm)', color: 'var(--color-plum)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '28px' }}>
            <Star size={18} /> Partner With Us
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', color: 'var(--color-plum)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Be a Part of the Sweet Revolution
          </h2>
          <p style={{ color: 'var(--color-plum)', fontSize: '1.15rem', maxWidth: 640, margin: '0 auto 36px', fontWeight: 700 }}>
            Join our expanding family of franchise partners across India. Exceptional unit economics, comprehensive culinary training, and end-to-end operational support.
          </p>
          <div className="flex-col-mobile" style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link href="/franchise" className="btn btn-primary text-center-mobile" style={{ padding: '16px 32px', fontSize: '1.1rem', justifyContent: 'center' }}>
              Explore Franchise Opportunities <ArrowRight size={20} />
            </Link>
            <Link href="/store-locations" className="btn btn-secondary text-center-mobile" style={{ padding: '16px 28px', fontSize: '1.1rem', justifyContent: 'center' }}>
              Visit Our Flagship Store
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
