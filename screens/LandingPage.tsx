import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton } from '@clerk/clerk-react';
import StripeGradient from '../components/StripeGradient';
import {
  SparklesIcon,
  CheckIcon,
  SearchIcon,
  FileTextIcon,
  MailIcon,
  MicrophoneIcon,
  BarChartIcon,
  CurrencyDollarIcon,
  ArrowUpRightIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  LightbulbIcon,
} from '../components/icons';

/* ------------------------------------------------------------------ */
/* Stripe-inspired professional theme — researched via getdesign.md    */
/* (stripe DESIGN.md: gradient-mesh hero on white canvas, indigo       */
/* primary #533afd, deep-navy ink, thin display type with negative     */
/* tracking, pill buttons, tabular figures, dark-app dashboard track)  */
/* ------------------------------------------------------------------ */

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const demoMode = (import.meta.env.VITE_DEMO_MODE ?? 'true') === 'true';
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.lp-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const goDashboard = () => navigate('/dashboard');
  const goPricing = () => navigate('/pricing');

  /* ---------- 3D mouse-tilt ---------- */
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = tiltRef.current;
    if (!scene) return;
    const card = scene.querySelector<HTMLElement>('.lp-tilt-card');
    if (!card) return;

    const onMove = (e: MouseEvent) => {
      const rect = scene.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const maxTilt = 7;
      const rotateY = (px - 0.5) * 2 * maxTilt;
      const rotateX = (0.5 - py) * 2 * maxTilt;
      card.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      const glare = card.querySelector<HTMLElement>('.lp-tilt-glare');
      if (glare) {
        glare.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
        glare.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
      }
    };

    const onLeave = () => {
      card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    };

    scene.addEventListener('mousemove', onMove);
    scene.addEventListener('mouseleave', onLeave);
    return () => {
      scene.removeEventListener('mousemove', onMove);
      scene.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  /* ---------- Counter-up stats ---------- */
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = statsRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const counters = Array.from(root.querySelectorAll<HTMLElement>('[data-counter]'));
    const observers: IntersectionObserver[] = [];

    counters.forEach((el) => {
      const raw = el.dataset.counter || '';
      const match = raw.match(/^(\D*)([\d,\.]+)(.*)$/);
      if (!match) return;
      const [, prefix, numPart, suffix] = match;
      const target = parseFloat(numPart.replace(/,/g, ''));
      if (!Number.isFinite(target)) return;
      const decimals = (numPart.split('.')[1] || '').length;
      const useGrouping = numPart.includes(',');
      const duration = 1600;

      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io.disconnect();
          const start = performance.now();
          const step = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            const value = target * eased;
            const text = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-IN');
            el.textContent = `${prefix}${useGrouping && p < 1 ? Math.round(value).toLocaleString('en-IN') : text}${suffix}`;
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        },
        { threshold: 0.4 }
      );
      io.observe(el);
      observers.push(io);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const features = [
    {
      icon: SearchIcon,
      color: 'text-violet bg-violet/[0.07] border-violet/25',
      title: 'Smart Job Search',
      desc: 'AI-powered matching across 1,000+ job sources worldwide, ranked by how well you fit each role.',
      tag: 'New — live search',
    },
    {
      icon: FileTextIcon,
      color: 'text-cyan bg-cyan/[0.07] border-cyan/25',
      title: 'ATS Resume Builder',
      desc: 'Generate ATS-optimized resumes tailored to each job description in under a minute.',
      tag: null,
    },
    {
      icon: MailIcon,
      color: 'text-fuchsia bg-fuchsia/[0.07] border-fuchsia/25',
      title: 'Cover Letter AI',
      desc: 'Personalized cover letters that reference the role, the company, and your real experience.',
      tag: null,
    },
    {
      icon: MicrophoneIcon,
      color: 'text-amber bg-amber/[0.08] border-amber/30',
      title: 'Interview Coach',
      desc: 'Practice with AI mock interviews — text or video — and get scored feedback on every answer.',
      tag: null,
    },
    {
      icon: BarChartIcon,
      color: 'text-pink bg-pink/[0.07] border-pink/25',
      title: 'Skills Analysis',
      desc: 'See exactly what skills you are missing for a role, ranked by priority, with a learning plan.',
      tag: null,
    },
    {
      icon: CurrencyDollarIcon,
      color: 'text-success bg-success/[0.07] border-success/25',
      title: 'Salary Negotiation',
      desc: 'Market analysis, counter-offer scripts, and non-monetary benefits to negotiate for.',
      tag: null,
    },
  ];

  const steps = [
    {
      number: '01',
      icon: AcademicCapIcon,
      title: 'Build your profile',
      desc: 'Upload your resume and our AI extracts your skills, experience and career goals instantly.',
    },
    {
      number: '02',
      icon: SearchIcon,
      title: 'AI matches you to jobs',
      desc: 'Search from 1,000+ sources. Every job is analyzed and scored against your profile automatically.',
    },
    {
      number: '03',
      icon: DocumentCheckIcon,
      title: 'Apply & prepare with AI',
      desc: 'Generate a tailored resume and cover letter, then rehearse with mock interviews before you apply.',
    },
  ];

  const pricingPlans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      credits: 10,
      tagline: 'Try the platform, no card needed.',
      features: ['10 free credits', 'Basic job search', 'Profile setup', 'Limited AI features'],
      popular: false,
    },
    {
      id: 'starter',
      name: 'Starter Pack',
      price: 199,
      credits: 100,
      tagline: 'For an active job search.',
      features: ['100 credits', 'Unlimited job search', 'AI resume builder', 'Cover letters', 'Email support'],
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro Pack',
      price: 499,
      credits: 500,
      tagline: 'The complete job hunt toolkit.',
      features: ['500 credits', 'Everything in Starter', 'Interview prep', 'Skills analysis', 'Priority support'],
      popular: true,
    },
    {
      id: 'mega',
      name: 'Mega Pack',
      price: 999,
      credits: 1500,
      tagline: 'For career changers & power users.',
      features: ['1,500 credits', 'Everything in Pro', 'Career planning', 'Networking AI', 'Lifetime access'],
      popular: false,
    },
  ];

  const testimonials = [
    {
      quote:
        'I applied to 40 jobs in three days using the auto-tailored resumes. Three interviews in the first week — the mock interview practice was the game changer.',
      name: 'Priya Sharma',
      role: 'Frontend Engineer · Bengaluru',
    },
    {
      quote:
        'The skills gap analysis told me exactly which two things were blocking my applications. Six weeks later I had an offer from a product company I had been eyeing for a year.',
      name: 'Rahul Verma',
      role: 'Data Analyst · Pune',
    },
    {
      quote:
        'The negotiation coach paid for the Pro pack ten times over. I went in knowing my market rate and walked out with 22% more than the initial offer.',
      name: 'Ananya Iyer',
      role: 'Product Manager · Mumbai',
    },
  ];

  const faqs = [
    { q: 'Do credits expire?', a: 'No. Credits are a one-time purchase and never expire — use them whenever you want, even months later.' },
    { q: 'Can I get a refund?', a: 'Yes. If you have unused credits, we offer a full refund within 7 days of purchase.' },
    { q: 'Is my data safe?', a: 'Absolutely. Authentication is handled by Clerk, resumes and profiles stay private to your account, and we never sell or share your data.' },
    { q: 'Which payment methods are supported?', a: 'UPI, credit/debit cards, net banking and wallets — all processed securely through Razorpay.' },
  ];

  const stats = [
    { value: '10,000+', label: 'Job seekers' },
    { value: '3x', label: 'Faster applications' },
    { value: '1,000+', label: 'Job sources' },
    { value: '92%', label: 'Report more interviews' },
  ];

  return (
    <div className="lp-root min-h-screen overflow-x-clip">
      {/* ------------------------------------------------------ */}
      {/* Nav — white pill bar floating on the mesh (Stripe style) */}
      {/* ------------------------------------------------------ */}
      <div className="lp-mesh">
        <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
          <div className="lp-container flex items-center justify-between h-16">
            <a href="#top" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet flex items-center justify-center">
                <SparklesIcon className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-[15px] font-semibold text-ink tracking-tight">AI Job Automator</span>
            </a>

            <div className="hidden md:flex items-center gap-8 text-sm">
              <a href="#features" className="lp-link">Features</a>
              <a href="#product" className="lp-link">Product</a>
              <a href="#pricing" className="lp-link">Pricing</a>
              <a href="#faq" className="lp-link">FAQ</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {demoMode ? (
                <button onClick={goDashboard} className="lp-btn lp-btn-ghost !py-2 !px-4 !text-sm">Sign in</button>
              ) : (
                <SignInButton mode="modal">
                  <button className="lp-btn lp-btn-ghost !py-2 !px-4 !text-sm">Sign in</button>
                </SignInButton>
              )}
              <button onClick={goDashboard} className="lp-btn lp-btn-primary !py-2 !px-4 !text-sm">
                Get started
                <ArrowUpRightIcon className="w-4 h-4" />
              </button>
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-ink-secondary hover:text-ink hover:bg-black/5 transition"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                {mobileMenuOpen
                  ? <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>
                  : <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>}
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-hairline bg-white/95 backdrop-blur-xl">
              <div className="lp-container py-4 flex flex-col gap-4">
                {[
                  { href: '#features', label: 'Features' },
                  { href: '#product', label: 'Product' },
                  { href: '#pricing', label: 'Pricing' },
                  { href: '#faq', label: 'FAQ' },
                ].map(link => (
                  <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="lp-link text-[15px]">
                    {link.label}
                  </a>
                ))}
                <div className="flex gap-3 pt-2">
                  <button onClick={goDashboard} className="lp-btn lp-btn-secondary flex-1 !text-sm">Sign in</button>
                  <button onClick={goDashboard} className="lp-btn lp-btn-primary flex-1 !text-sm">Get started</button>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* ------------------------------------------------------ */}
        {/* Hero — the gradient mesh occupies the upper third       */}
        {/* ------------------------------------------------------ */}        <section id="top" className="relative">
          {/* Live WebGL gradient — Stripe's signature animation */}
          <StripeGradient colors={['#a5b4fc', '#533afd', '#ea2261', '#f96bee']} />

          <div className="lp-container relative pt-16 pb-16 md:pt-24 md:pb-24 text-center">
            <div className="lp-pill mx-auto">
              <span className="lp-pill-dot" />
              <span>Free 10 credits to start</span>
              <span className="text-ink-subtle">·</span>
              <span className="font-semibold">No credit card required</span>
            </div>

            <h1 className="lp-display-xl mt-7 mx-auto max-w-4xl text-ink">
              Land your dream job
              <span className="block text-brand-dark" style={{ textShadow: '0 2px 30px rgba(255,255,255,0.65), 0 0 80px rgba(255,255,255,0.45)' }}>
                3x faster with AI
              </span>
            </h1>

            <p className="lp-lead mt-6 max-w-2xl mx-auto">
              AI-powered job search, ATS resumes, cover letters and mock interviews —
              everything you need to get hired, in one place.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={goDashboard} className="lp-btn lp-btn-primary px-7 py-3">
                <SparklesIcon className="w-4 h-4" />
                Start free — 10 credits
              </button>
              <a href="#product" className="lp-btn lp-btn-secondary px-7 py-3">
                See how it works
              </a>
            </div>

            <p className="mt-6 text-[13px] text-ink-mute lp-tabular">
              Works on mobile & desktop · Hindi + English · UPI payments
            </p>

            {/* Dashboard mockup — 3D mouse-tilt scene with cursor glare */}
            <div className="mt-16 relative max-w-4xl mx-auto lp-tilt-scene" ref={tiltRef}>
              <div className="lp-tilt-card lp-mockup relative text-left">
                <div className="lp-tilt-depth relative">
                  <DashboardMockup />
                </div>
                <div className="lp-tilt-glare" />
              </div>

              {/* Floating proof chips */}
              <div className="lp-float-chip top-8 -left-4 md:-left-14" style={{ animationDelay: '-1.5s' }}>
                <span className="w-5 h-5 rounded-full bg-violet flex items-center justify-center">
                  <CheckIcon className="w-3 h-3 text-white" />
                </span>
                ATS resume generated
              </div>
              <div className="lp-float-chip bottom-20 -right-4 md:-right-12" style={{ animationDelay: '-4s' }}>
                <span className="w-5 h-5 rounded-full bg-cyan flex items-center justify-center">
                  <MicrophoneIcon className="w-3 h-3 text-white" />
                </span>
                Interview score: 8.5/10
              </div>
              <div className="lp-float-chip top-1/2 -right-6 md:-right-20" style={{ animationDelay: '-6s' }}>
                <span className="w-5 h-5 rounded-full bg-fuchsia flex items-center justify-center">
                  <CurrencyDollarIcon className="w-3 h-3 text-white" />
                </span>
                Offer: ₹22L + equity
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ------------------------------------------------------ */}
      {/* Social proof marquee — cream interlude band             */}
      {/* ------------------------------------------------------ */}
      <section className="lp-band-cream rounded-none py-12 border-y border-hairline" style={{ borderRadius: 0 }}>
        <div className="lp-container">
          <p className="lp-eyebrow text-center mb-8">
            Trusted by 10,000+ job seekers across India
          </p>
          <div className="lp-marquee overflow-hidden">
            <div className="lp-marquee-track">
              {[0, 1].map(dup => (
                <div key={dup} className="flex gap-16 items-center" aria-hidden={dup === 1}>
                  {['Tata Digital', 'Zomato', 'Paytm', 'Swiggy', 'Flipkart', 'Infosys', 'Wipro', 'Razorpay'].map(name => (
                    <span key={`${dup}-${name}`} className="text-ink-secondary text-lg font-semibold tracking-tight whitespace-nowrap opacity-70">
                      {name}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ */}
      {/* Features — white cards on cool off-white band           */}
      {/* ------------------------------------------------------ */}
      <section id="features" className="lp-band-soft py-24 md:py-32">
        <div className="lp-container">
          <div className="max-w-2xl">
            <p className="lp-eyebrow">Features</p>
            <h2 className="lp-display-lg mt-4 text-ink">
              Everything you need to <span className="text-violet">get hired</span>
            </h2>
            <p className="lp-lead mt-5">
              One platform for the entire job hunt — from the first search to the signed offer.
            </p>
          </div>

          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="lp-card lp-card-hover lp-reveal group p-7">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="mt-5 lp-heading-md text-ink font-semibold">{f.title}</h3>
                <p className="mt-2.5 text-[15px] text-ink-secondary leading-relaxed">{f.desc}</p>
                {f.tag && (
                  <span className="inline-flex mt-5 items-center gap-1.5 text-[13px] font-medium text-violet">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {f.tag}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ */}
      {/* How it works — white, with dark dashboard track         */}
      {/* ------------------------------------------------------ */}
      <section id="product" className="py-24 md:py-32">
        <div className="lp-container">
          <div className="max-w-2xl">
            <p className="lp-eyebrow">How it works</p>
            <h2 className="lp-display-lg mt-4 text-ink">
              From resume to offer, <span className="text-violet">in three steps</span>
            </h2>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-5">
            {steps.map((s) => (
              <div key={s.number} className="lp-card lp-card-hover lp-reveal p-7">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-brand-dark flex items-center justify-center">
                    <s.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="lp-tabular text-sm font-medium text-ink-mute">{s.number}</span>
                </div>
                <h3 className="mt-6 lp-heading-md text-ink font-semibold">{s.title}</h3>
                <p className="mt-2.5 text-[15px] text-ink-secondary leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Dark-app dashboard track (Stripe signature) */}
          <div className="mt-12 grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 lp-reveal">
              <div className="lp-mockup-dark relative h-full text-left">
                <TrackerMockup />
              </div>
            </div>
            <div className="lg:col-span-2 lp-reveal">
              <div className="lp-mockup-dark relative h-full text-left">
                <InsightsMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ */}
      {/* Stats — tabular figures + counter-up                    */}
      {/* ------------------------------------------------------ */}
      <section id="stats" className="py-20 md:py-24 lp-band-soft border-y border-hairline">
        <div className="lp-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5" ref={statsRef}>
            {stats.map((s) => (
              <div key={s.label} className="lp-card lp-card-hover lp-reveal p-8 text-center">
                <div
                  className="lp-display-md text-violet lp-stat-value"
                  data-counter={s.value}
                >
                  {s.value}
                </div>
                <div className="mt-2 text-sm text-ink-secondary">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ */}
      {/* Pricing — white cards + navy featured tier              */}
      {/* ------------------------------------------------------ */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="lp-container">
          <div className="max-w-2xl mx-auto text-center">
            <p className="lp-eyebrow">Pricing</p>
            <h2 className="lp-display-lg mt-4 text-ink">
              Buy credits once. <span className="text-violet">Use them anytime.</span>
            </h2>
            <p className="lp-lead mt-5">
              No monthly fees, no subscriptions. Credits never expire.
            </p>
          </div>

          <div className="mt-14 grid md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`lp-reveal relative flex flex-col rounded-xl overflow-hidden
                  ${plan.popular
                    ? 'lp-card-featured p-7'
                    : 'lp-card lp-card-hover p-7'}`}
              >
                {plan.popular && (
                  <span className="inline-flex self-start mb-4 items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-medium uppercase tracking-[0.08em]">
                    <SparklesIcon className="w-3 h-3" />
                    Most popular
                  </span>
                )}
                <h3 className={`text-lg font-semibold tracking-tight ${plan.popular ? 'text-white' : 'text-ink'}`}>{plan.name}</h3>
                <p className={`mt-1.5 text-sm min-h-[2.5rem] ${plan.popular ? 'text-white/70' : 'text-ink-secondary'}`}>{plan.tagline}</p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className={`lp-display-md lp-tabular ${plan.popular ? 'text-white' : 'text-ink'}`}>
                    ₹{plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className={`text-sm ${plan.popular ? 'text-white/60' : 'text-ink-mute'}`}>one-time</span>
                  )}
                </div>
                <div className={`mt-1 text-sm lp-tabular ${plan.popular ? 'text-white/70' : 'text-ink-secondary'}`}>
                  {plan.credits} credits
                </div>

                <ul className="mt-7 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start text-[14px] ${plan.popular ? 'text-white/85' : 'text-ink-secondary'}`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0 ${plan.popular ? 'bg-white/15' : 'bg-violet/[0.08]'}`}>
                        <CheckIcon className={`w-2.5 h-2.5 ${plan.popular ? 'text-white' : 'text-violet'}`} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => (plan.price === 0 ? goDashboard() : goPricing())}
                  className={`lp-btn w-full mt-8 ${plan.popular ? 'bg-white text-brand-dark hover:bg-white/90' : 'lp-btn-primary'}`}
                >
                  {plan.price === 0 ? 'Start free' : 'Buy now'}
                </button>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-ink-mute">
            Every feature uses credits — check the full credit usage guide in the app.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------ */}
      {/* Testimonials                                            */}
      {/* ------------------------------------------------------ */}
      <section className="py-24 md:py-32 lp-band-soft border-y border-hairline">
        <div className="lp-container">
          <div className="max-w-2xl mx-auto text-center">
            <p className="lp-eyebrow">Testimonials</p>
            <h2 className="lp-display-lg mt-4 text-ink">
              Real job seekers, <span className="text-violet">real offers</span>
            </h2>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <figure key={t.name} className="lp-card lp-card-hover lp-reveal p-7">
                <div className="flex gap-1 text-amber text-sm tracking-widest">
                  {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
                </div>
                <blockquote className="mt-4 text-[15px] text-ink-secondary leading-relaxed">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-dark flex items-center justify-center text-sm font-semibold text-white">
                    {t.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">{t.name}</div>
                    <div className="text-xs text-ink-mute">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ */}
      {/* FAQ                                                     */}
      {/* ------------------------------------------------------ */}
      <section id="faq" className="py-24 md:py-32">
        <div className="lp-container max-w-3xl">
          <div className="text-center">
            <p className="lp-eyebrow">FAQ</p>
            <h2 className="lp-display-lg mt-4 text-ink">Frequently asked questions</h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((f, i) => (
              <div key={f.q} className="lp-card lp-card-hover overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-[15px] font-semibold text-ink">{f.q}</span>
                  <span className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-200 ${openFaq === i ? 'bg-violet border-violet text-white rotate-180' : 'border-hairline text-ink-secondary'}`}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 -mt-1 text-[15px] text-ink-secondary leading-relaxed">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ */}
      {/* CTA band — dark navy with mesh accents                  */}
      {/* ------------------------------------------------------ */}
      <section className="pb-24 md:pb-32">
        <div className="lp-container">
          <div className="relative overflow-hidden rounded-xl p-10 md:p-16 text-center bg-brand-dark">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(50% 90% at 15% 0%, rgba(83, 58, 253, 0.45), transparent 60%), radial-gradient(40% 80% at 85% 100%, rgba(234, 34, 97, 0.30), transparent 60%), radial-gradient(36% 70% at 60% 0%, rgba(249, 107, 238, 0.22), transparent 55%)',
              }}
            />
            <div className="relative">
              <h2 className="lp-display-md max-w-xl mx-auto text-white">
                Your next offer is one search away
              </h2>
              <p className="mt-4 text-lg text-white/75 max-w-lg mx-auto">
                Start with 10 free credits — no credit card required.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={goDashboard}
                  className="lp-btn px-7 py-3 bg-white text-brand-dark font-medium hover:bg-white/90"
                >
                  <SparklesIcon className="w-4 h-4" />
                  Start free now
                </button>
                <button
                  onClick={goPricing}
                  className="lp-btn px-7 py-3 bg-white/10 text-white border border-white/25 hover:bg-white/20"
                >
                  View pricing
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ */}
      {/* Footer — light                                          */}
      {/* ------------------------------------------------------ */}
      <footer className="border-t border-hairline pt-16 pb-10 bg-white">
        <div className="lp-container">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-[15px] font-semibold text-ink tracking-tight">AI Job Automator</span>
              </div>
              <p className="mt-4 text-sm text-ink-mute leading-relaxed">
                The AI-powered job search platform built for modern job seekers.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 md:col-span-3 gap-8">
              <div>
                <p className="text-[13px] font-semibold text-ink mb-4">Product</p>
                <ul className="space-y-2.5">
                  {['Features', 'Pricing', 'Credits', 'Download APK'].map(l => (
                    <li key={l}><a href="#top" className="lp-link text-sm">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-ink mb-4">Company</p>
                <ul className="space-y-2.5">
                  {['About', 'Careers', 'Blog', 'Contact'].map(l => (
                    <li key={l}><a href="#top" className="lp-link text-sm">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-ink mb-4">Legal</p>
                <ul className="space-y-2.5">
                  {['Privacy policy', 'Terms of service', 'Refund policy'].map(l => (
                    <li key={l}><a href="#top" className="lp-link text-sm">{l}</a></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-hairline flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-ink-mute">
              Made with <span className="text-fuchsia">♥</span> in India · © 2024 AI Job Automator
            </p>
            <div className="flex items-center gap-2 text-[13px] text-ink-mute">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ================================================================== */
/* Product mockups — Stripe dark-app dashboard track, tabular figures  */
/* ================================================================== */

const DashboardMockup: React.FC = () => {
  const jobs = [
    { title: 'Senior Frontend Engineer', company: 'Razorpay', match: 94, status: 'Applied', color: 'bg-violet' },
    { title: 'Product Designer', company: 'Swiggy', match: 88, status: 'Interviewing', color: 'bg-cyan' },
    { title: 'Backend Engineer (Go)', company: 'Zomato', match: 81, status: 'Saved', color: 'bg-amber' },
    { title: 'Data Scientist', company: 'Flipkart', match: 76, status: 'Offer', color: 'bg-fuchsia' },
  ];

  return (
    <div className="p-6 md:p-8 bg-white">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-ruby/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-success/70" />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] font-mono text-ink-mute lp-tabular">app.aijobautomator.in</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Stats — tabular numerics */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Applications', value: '24', delta: '+12 this week' },
            { label: 'Interviews', value: '6', delta: '3 upcoming' },
            { label: 'Response rate', value: '38%', delta: '+9% vs last month' },
            { label: 'Offers', value: '1', delta: 'Negotiating now' },
          ].map(s => (
            <div key={s.label} className="border border-hairline rounded-xl p-4 shadow-[rgba(0,55,112,0.06)_0_1px_3px]">
              <div className="text-xs text-ink-mute">{s.label}</div>
              <div className="mt-1.5 lp-display-md text-ink lp-tabular !text-2xl">{s.value}</div>
              <div className="mt-1 text-[11px] text-success lp-tabular">{s.delta}</div>
            </div>
          ))}
        </div>

        {/* Job list */}
        <div className="lg:col-span-2 border border-hairline rounded-xl p-4 shadow-[rgba(0,55,112,0.06)_0_1px_3px]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-ink">Tracked applications</div>
            <span className="text-xs text-violet font-medium">View all</span>
          </div>
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.title} className="flex items-center justify-between gap-3 border border-hairline rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-ink truncate">{job.title}</div>
                  <div className="text-xs text-ink-mute mt-0.5">{job.company}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-medium text-ink-secondary lp-tabular">{job.match}% match</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-secondary">
                    <span className={`w-1.5 h-1.5 rounded-full ${job.color}`} />
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI insights panel */}
        <div className="border border-hairline rounded-xl p-4 shadow-[rgba(0,55,112,0.06)_0_1px_3px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-violet flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm font-semibold text-ink">AI Coach</div>
          </div>
          <div className="space-y-3">
            {[
              { text: 'You are a strong match for 3 new Frontend roles in Bengaluru.', strong: true },
              { text: 'Add "system design" to your skills to unlock 41% more roles.', strong: false },
            ].map((tip, i) => (
              <div key={i} className="border border-hairline rounded-xl px-3.5 py-3 bg-canvas-soft">
                <div className="text-[12.5px] leading-relaxed text-ink-secondary">
                  {tip.strong && <span className="text-success mr-1">●</span>}
                  {tip.text}
                </div>
              </div>
            ))}
            <div className="rounded-lg px-3.5 py-2.5 text-center text-[12.5px] font-medium text-white bg-violet">
              Generate ATS resume →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrackerMockup: React.FC = () => {
  const cols = [
    { name: 'Saved', items: ['Frontend @ Razorpay', 'ML Engineer @ Swiggy'], color: 'text-white/60', dot: 'bg-amber' },
    { name: 'Applied', items: ['Backend @ Zomato'], color: 'text-white/80', dot: 'bg-cyan' },
    { name: 'Interviewing', items: ['Product @ Flipkart'], color: 'text-white', dot: 'bg-violet' },
  ];

  return (
    <div className="p-6 md:p-8 h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm font-semibold text-white">Application tracker</div>
        <div className="text-[11px] font-mono text-white/50 lp-tabular">4 active · 1 offer</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {cols.map((col) => (
          <div key={col.name} className="bg-white/[0.06] border border-white/10 rounded-xl p-3">
            <div className={`text-[11px] font-medium uppercase tracking-wide mb-3 flex items-center gap-1.5 ${col.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
              {col.name}
            </div>
            <div className="space-y-2">
              {col.items.map((item) => (
                <div key={item} className="bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-2 text-[11.5px] text-white/80 leading-snug">
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const InsightsMockup: React.FC = () => {
  return (
    <div className="p-6 md:p-8 h-full">
      <div className="text-sm font-semibold text-white mb-5">Skills gap analysis</div>
      <div className="bg-white/[0.06] border border-white/10 rounded-xl p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-white/70">Your match</span>
            <span className="font-medium text-white lp-tabular">82%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-violet to-cyan" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-white/70">Missing skills</span>
            <span className="font-medium text-white lp-tabular">3</span>
          </div>
          <div className="space-y-1.5">
            {['GraphQL', 'Design systems', 'Playwright'].map(s => (
              <div key={s} className="flex items-center justify-between text-[11.5px] bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-1.5">
                <span className="text-white/80">{s}</span>
                <span className="text-white/50 lp-tabular">+2 weeks</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-white/70 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5">
          <LightbulbIcon className="w-4 h-4 text-amber flex-shrink-0" />
          Follow the recommended learning path to close the gap in ~6 weeks.
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
