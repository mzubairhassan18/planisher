"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Menu,
  MessageSquareWarning,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { BuildingScene } from "@/components/marketing/building-scene";
import { ConstructionStrip } from "@/components/marketing/construction-strip";

const capabilities = [
  {
    icon: CalendarRange,
    eyebrow: "Schedule",
    title: "See the whole build, then act on today",
    copy: "Turn phases, tasks, dependencies, dates, and progress into one schedule that stays understandable from office to site.",
  },
  {
    icon: MessageSquareWarning,
    eyebrow: "Field updates",
    title: "Problems arrive with context",
    copy: "Raise a problem on the task, attach visual evidence, and keep the decision beside the work it affects.",
  },
  {
    icon: CircleDollarSign,
    eyebrow: "Cost control",
    title: "Connect budget decisions to delivery",
    copy: "Plan costs at project or task level and keep spending visible without turning the schedule into accounting software.",
  },
  {
    icon: ClipboardCheck,
    eyebrow: "Reuse",
    title: "A successful plan becomes the next starting point",
    copy: "Duplicate a project or begin from a construction template while historical progress and noise stay behind.",
  },
];

const plans = [
  {
    name: "Personal",
    price: "$0",
    note: "For one owner-builder",
    limits: ["1 active project", "250 tasks", "3 restricted guests", "500 MB storage"],
  },
  {
    name: "Builder",
    price: "$39",
    note: "For residential teams",
    featured: true,
    limits: ["5 active projects", "3 full members", "Unlimited restricted guests", "Templates and full audit"],
  },
  {
    name: "Company",
    price: "$99",
    note: "For growing contractors",
    limits: ["25 active projects", "10 full members", "50 GB storage", "Portfolio and budget exports"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "For controlled rollouts",
    limits: ["Custom capacity", "SSO and provisioning", "Retention and SLA", "Guided onboarding"],
  },
];

export function PlanisherMarketing() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);

  useEffect(() => {
    if (!rootRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.from(".marketing-hero-copy > *", {
        y: 28,
        opacity: 0,
        duration: 0.8,
        stagger: 0.09,
        ease: "power3.out",
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, {
          y: 44,
          opacity: 0,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 88%", once: true },
        });
      });
      gsap.from(".pricing-card", {
        y: 70,
        opacity: 0,
        stagger: 0.12,
        duration: 0.85,
        scrollTrigger: { trigger: ".marketing-pricing", start: "top 70%", once: true },
      });
    }, rootRef);
    return () => context.revert();
  }, []);

  function prepareEmail(form: HTMLFormElement) {
    const data = new FormData(form);
    const subject = encodeURIComponent(`Planisher enquiry from ${String(data.get("name"))}`);
    const body = encodeURIComponent(
      `Name: ${String(data.get("name"))}\nCompany: ${String(data.get("company"))}\nEmail: ${String(data.get("email"))}\n\n${String(data.get("message"))}`,
    );
    window.location.href = `mailto:mzubairhassan18@gmail.com?subject=${subject}&body=${body}`;
  }

  return (
    <div className="marketing-site" ref={rootRef}>
      <header className="marketing-nav">
        <Link className="marketing-brand" href="/">
          <span>P</span> Planisher
        </Link>
        <nav className={menuOpen ? "open" : ""} aria-label="Marketing navigation">
          <a href="#product" onClick={() => setMenuOpen(false)}>Product</a>
          <a href="#stories" onClick={() => setMenuOpen(false)}>Why Planisher</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
        <div className="marketing-nav-actions">
          <Link href="/sign-in">Sign in</Link>
          <Link className="marketing-button small" href="/sign-up">Start planning</Link>
        </div>
        <button
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
          className="marketing-menu-button"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>

      <main>
        <section className="marketing-hero">
          <BuildingScene />
          <div className="marketing-hero-wash" />
          <div className="marketing-hero-copy">
            <span className="marketing-kicker"><Sparkles size={15} /> Construction, calmly coordinated</span>
            <h1>Build the plan.<br />Then build with confidence.</h1>
            <p>
              Planisher brings schedules, field updates, problems, files, and costs
              into one clear construction workspace — from a single home to a growing portfolio.
            </p>
            <div className="marketing-hero-actions">
              <Link className="marketing-button" href="/sign-up">Create your first plan <ArrowRight size={17} /></Link>
              <a className="marketing-text-button" href="#product">See how it works</a>
            </div>
            <div className="marketing-proof-row">
              <span><ShieldCheck size={16} /> Clear ownership</span>
              <span><CalendarRange size={16} /> Visual scheduling</span>
              <span><Building2 size={16} /> Reusable templates</span>
            </div>
          </div>
          <div className="marketing-hero-note">
            <span>Today on site</span>
            <strong>12 tasks moving</strong>
            <small>3 updates need a decision</small>
          </div>
        </section>

        <section className="marketing-site-section" data-reveal>
          <div className="marketing-section-copy">
            <span className="marketing-kicker">Plans meet the real world</span>
            <h2>The office sets direction. The field keeps it true.</h2>
            <p>
              Every useful update should take seconds, stay attached to the task,
              and make the next decision easier.
            </p>
          </div>
          <ConstructionStrip />
        </section>

        <section className="marketing-features" id="product">
          <div className="marketing-section-heading" data-reveal>
            <span className="marketing-kicker">One source of truth</span>
            <h2>Powerful where it matters.<br />Quiet everywhere else.</h2>
          </div>
          <div className="feature-carousel" data-reveal>
            <div className="feature-carousel-stage">
              {capabilities.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <article
                    aria-hidden={index !== featureIndex}
                    className={index === featureIndex ? "feature-slide active" : "feature-slide"}
                    key={feature.title}
                  >
                    <span className="feature-icon"><Icon aria-hidden="true" /></span>
                    <span className="marketing-kicker">{feature.eyebrow}</span>
                    <h3>{feature.title}</h3>
                    <p>{feature.copy}</p>
                    <span className="feature-number">0{index + 1}</span>
                  </article>
                );
              })}
            </div>
            <div className="feature-carousel-controls">
              <button aria-label="Previous capability" onClick={() => setFeatureIndex((featureIndex - 1 + capabilities.length) % capabilities.length)} type="button"><ChevronLeft /></button>
              <span>{featureIndex + 1} / {capabilities.length}</span>
              <button aria-label="Next capability" onClick={() => setFeatureIndex((featureIndex + 1) % capabilities.length)} type="button"><ChevronRight /></button>
            </div>
          </div>
        </section>

        <section className="marketing-stories" id="stories">
          <div className="marketing-section-heading" data-reveal>
            <span className="marketing-kicker">Built around real pressure points</span>
            <h2>What a calmer project should feel like</h2>
            <p>These are the workflow outcomes Planisher is designed to deliver during customer pilots.</p>
          </div>
          <div className="story-grid">
            {[
              ["I can see what slipped before the morning call starts.", "Project manager outcome"],
              ["The photo, problem, and decision stay beside the exact task.", "Site supervisor outcome"],
              ["The next home starts from a plan we already trust.", "Residential builder outcome"],
            ].map(([quote, label]) => (
              <figure data-reveal key={quote}>
                <blockquote>“{quote}”</blockquote>
                <figcaption>{label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="marketing-pricing" id="pricing">
          <div className="pricing-sticky-copy">
            <span className="marketing-kicker">Pricing that invites collaboration</span>
            <h2>Start small.<br />Keep every contributor in the loop.</h2>
            <p>Restricted guests remain free on paid plans. Limits are based on the workspace value you use, not construction volume.</p>
          </div>
          <div className="pricing-card-stack">
            {plans.map((plan) => (
              <article className={plan.featured ? "pricing-card featured" : "pricing-card"} key={plan.name}>
                {plan.featured ? <span className="pricing-popular">Most practical start</span> : null}
                <span className="marketing-kicker">{plan.name}</span>
                <strong>{plan.price}{plan.price.startsWith("$") && plan.price !== "$0" ? <small>/month</small> : null}</strong>
                <p>{plan.note}</p>
                <ul>
                  {plan.limits.map((limit) => <li key={limit}><Check size={15} /> {limit}</li>)}
                </ul>
                <Link className={plan.featured ? "marketing-button" : "marketing-text-button boxed"} href="/sign-up">
                  {plan.name === "Enterprise" ? "Talk to us" : "Choose plan"} <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-contact" id="contact">
          <div data-reveal>
            <span className="marketing-kicker">Let’s plan the next build</span>
            <h2>Tell us what your team is trying to manage.</h2>
            <p>The form prepares an email in your own mail app, so nothing is silently submitted or stored.</p>
          </div>
          <form
            data-reveal
            onSubmit={(event) => {
              event.preventDefault();
              prepareEmail(event.currentTarget);
            }}
          >
            <label>Name<input name="name" required /></label>
            <label>Work email<input name="email" required type="email" /></label>
            <label>Company or project<input name="company" /></label>
            <label>What do you need to manage?<textarea name="message" required rows={4} /></label>
            <button className="marketing-button" type="submit">Open email draft <ArrowRight size={17} /></button>
          </form>
        </section>
      </main>

      <footer className="marketing-footer">
        <div><Link className="marketing-brand" href="/"><span>P</span> Planisher</Link><p>Construction planning without the noise.</p></div>
        <div><strong>Product</strong><a href="#product">Capabilities</a><a href="#pricing">Pricing</a><Link href="/sign-in">Sign in</Link></div>
        <div><strong>Company</strong><a href="#contact">Contact</a><Link href="/sign-up">Create account</Link></div>
        <small>© {new Date().getFullYear()} Planisher. Development preview.</small>
      </footer>
    </div>
  );
}
