"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Shield, TrendingUp, Home, Lock, Users, MapPin,
  ChevronDown, Bolt, Globe, Smartphone, PieChart, ShieldCheck, Ticket, CheckCircle
} from "lucide-react";
import Logos from "@/components/LandingPage/sections/logos";
import { MembershipCTA } from "@/components/AboutPage/MembershipCTA";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { RealFiNavbar } from "./RealFiNavbar";
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Counter component for stats
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      const duration = 1500;
      const steps = 50;
      const increment = value / steps;
      const stepTime = duration / steps;
      let current = 0;

      const counter = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(counter);
        } else {
          setCount(Math.floor(current));
        }
      }, stepTime);

      return () => clearInterval(counter);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function RealFiLanding() {
  const t = useTranslations("realfi.landing");
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <div className="min-h-screen bg-[#f8f7f5]">

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
        {/* Scroll-based fade wrapper */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
        >
          {/* Hero Content with whileInView animations */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h1
              className="text-6xl sm:text-8xl md:text-[140px] lg:text-[100px] font-black leading-none tracking-tighter lowercase text-white"
              style={{
                textShadow: "0 0 60px rgba(255, 255, 255, 0.5), 0 0 120px rgba(255, 255, 255, 0.3)",
              }}
            >
              many homes,<br/>our network,<br/>one giant block
            </h1>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-8 flex flex-col items-center gap-2 text-gray-300"
          >
            <TypingAnimation
              className="text-sm font-medium tracking-wide leading-normal"
              duration={50}
              delay={1200}
            >
              the on-chain housing vault on Mantle network
            </TypingAnimation>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronDown className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>

          {/* Subtitle Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-12 bg-white border-4 border-gray-900 p-6 md:p-8 max-w-3xl mx-auto"
          >
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              Your Home Credit, Now a Liquid RWA
            </p>
            <p className="text-base md:text-lg font-medium text-gray-600 mt-2">
              New paradigm for homeownership
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* RealFi Navigation */}
      <RealFiNavbar />

      {/* About Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-gray-500 text-sm font-semibold mb-6 tracking-widest uppercase">{t("about.label")}</p>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-8">
            {t("about.heading")}
          </h2>
          <div className="text-lg text-gray-600 max-w-4xl">
            <p>{t("about.description")}</p>
          </div>
        </motion.div>
      </section>

      {/* Services / On-Chaining Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-10 bg-white border-y-4 border-gray-900">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-6xl md:text-8xl lg:text-[140px] font-black text-gray-900 lowercase tracking-tighter mb-10"
          >
            On-Chaining
          </motion.h2>

          {/* Stats Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-50 border-2 border-gray-200 p-8 md:p-12 mb-16"
          >
            <p className="text-gray-500 font-bold text-sm mb-4 tracking-widest uppercase">dive in.</p>
            <p className="text-gray-900 text-lg md:text-2xl font-bold mb-8 max-w-4xl">
              We transform traditional homebuying into liquid RWA (Real World Assets), creating unique housing experiences - from fractional ownership to secondary market trading.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="border-l-4 border-gray-900 pl-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{t("stats.tvl")}</p>
                <p className="text-xl font-black text-gray-900">
                  <AnimatedCounter value={1025700} /> USDT0
                </p>
              </div>
              <div className="border-l-4 border-gray-900 pl-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{t("stats.participants")}</p>
                <p className="text-xl font-black text-gray-900">
                  <AnimatedCounter value={119} suffix={t("stats.participantsSuffix")} />
                </p>
              </div>
              <div className="border-l-4 border-gray-900 pl-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{t("stats.vaults")}</p>
                <p className="text-xl font-black text-gray-900">
                  <AnimatedCounter value={4} suffix={t("stats.vaultsSuffix")} />
                </p>
              </div>
              <div className="border-l-4 border-gray-900 pl-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{t("stats.projects")}</p>
                <p className="text-xl font-black text-gray-900">
                  <AnimatedCounter value={5} suffix={t("stats.projectsSuffix")} />
                </p>
              </div>
            </div>
          </motion.div>

          {/* Service Cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { icon: Home, title: t("services.service1Title"), desc: t("services.service1Desc") },
              { icon: TrendingUp, title: t("services.service2Title"), desc: t("services.service2Desc") },
              { icon: Shield, title: t("services.service3Title"), desc: t("services.service3Desc") },
              { icon: Users, title: t("services.service4Title"), desc: t("services.service4Desc") }
            ].map((service, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                className="bg-white border-2 border-gray-200 p-8 transition-all duration-300 hover:border-gray-900 hover:shadow-lg"
              >
                <div className="w-16 h-16 bg-gray-900 flex items-center justify-center mb-6">
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Logos Section */}
      <div className="bg-white border-b-2 border-gray-200">
        <Logos />
      </div>

      {/* Comparison Table Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-10 bg-[#f8f7f5]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-4">
              {t("comparison.title")}
            </h2>
            <p className="text-gray-600 text-center font-medium mb-12">{t("comparisonSubtitle")}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white border-2 border-gray-900 overflow-hidden shadow-md"
          >
            {/* Table Header */}
            <div className="grid grid-cols-3 bg-gray-900 text-white font-bold">
              <div className="p-4 md:p-5 border-r border-gray-700">{t("comparison.category")}</div>
              <div className="p-4 md:p-5 border-r border-gray-700">{t("comparison.traditional")}</div>
              <div className="p-4 md:p-5">{t("comparison.realfi")}</div>
            </div>

            {/* Table Rows */}
            {[
              { label: t("comparison.depositMethod"), trad: t("comparison.depositTraditional"), realfi: t("comparison.depositRealfi") },
              { label: t("comparison.pointsCalculation"), trad: t("comparison.pointsTraditional"), realfi: t("comparison.pointsRealfi") },
              { label: t("comparison.usageScope"), trad: t("comparison.usageTraditional"), realfi: t("comparison.usageRealfi") },
              { label: t("comparison.liquidity"), trad: t("comparison.liquidityTraditional"), realfi: t("comparison.liquidityRealfi") },
              { label: t("comparison.waitingReturns"), trad: t("comparison.waitingTraditional"), realfi: t("comparison.waitingRealfi") },
              { label: t("comparison.decisionMaking"), trad: t("comparison.decisionTraditional"), realfi: t("comparison.decisionRealfi") },
              { label: t("comparison.projectScale"), trad: t("comparison.projectTraditional"), realfi: t("comparison.projectRealfi") },
            ].map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-3 border-t border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="p-4 md:p-5 text-gray-900 font-bold text-sm border-r border-gray-200 bg-gray-50">{row.label}</div>
                <div className="p-4 md:p-5 text-gray-500 text-sm border-r border-gray-200">{row.trad}</div>
                <div className="p-4 md:p-5 text-gray-900 font-medium text-sm">{row.realfi}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Vault Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-10 bg-white border-y-4 border-gray-900">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 lowercase tracking-tighter mb-4">
              {t("dongVault.title")}
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t("dongVault.description")}
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
          >
            {[
              { name: "오금동", gu: "송파구", tvl: "523,400", participants: 47, projects: 2, href: "/realfi/dong/오금동" },
              { name: "광장동", gu: "광진구", tvl: "312,800", participants: 31, projects: 1, href: "/realfi/dong/광장동" },
              { name: "동숭동", gu: "종로구", tvl: "189,500", participants: 18, projects: 1, href: "/realfi/dong/동숭동" },
            ].map((vault, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
              >
                <Link
                  href={vault.href}
                  className="block bg-white border-2 border-gray-200 p-8 transition-all duration-300 hover:border-gray-900 hover:shadow-lg"
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{vault.name} Vault</h3>
                  <p className="text-gray-500 text-sm mb-6 pb-4 border-b border-gray-200">{vault.gu}</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">TVL</span>
                      <span className="text-lg font-bold text-gray-900">{vault.tvl} USDT0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">{t("vaultCard.participants")}</span>
                      <span className="text-lg font-bold text-gray-900">{vault.participants}{t("vaultCard.participantsSuffix")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">{t("vaultCard.ongoingProjects")}</span>
                      <span className="text-lg font-bold text-gray-900">{vault.projects}{t("vaultCard.projectsSuffix")}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center">
            <Link
              href="/realfi/invest"
              className="inline-block bg-gray-900 text-white px-10 py-4 font-bold uppercase tracking-wider hover:bg-gray-800 transition-all duration-300 hover:-translate-y-1"
            >
              {t("dongVault.exploreCta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Points System Section */}
      <section className="py-20 md:py-32 px-4 md:px-10 bg-[#f8f7f5]">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 lowercase tracking-tighter text-center mb-16"
          >
            {t("pointsSection.title")}
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Formula Side */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t("points.calculation")}</h3>
              <div className="bg-gray-900 text-white p-6 md:p-8 mb-8">
                <p className="text-xl font-bold text-center">{t("points.formula")}</p>
              </div>
              <div className="space-y-4">
                {[
                  { input: t("points.example1"), result: "= 10,000 Points" },
                  { input: t("points.example2"), result: "= 10,000 Points" },
                ].map((ex, i) => (
                  <div key={i} className="bg-white p-5 border-l-4 border-gray-900 shadow-sm">
                    <p className="text-gray-600 mb-2">{ex.input}</p>
                    <p className="text-gray-900 font-bold text-lg">{ex.result}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Benefits Side */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t("points.benefitsTitle")}</h3>
              <div className="space-y-4">
                {[
                  { num: 1, title: t("points.benefit1Title"), desc: t("points.benefit1Desc") },
                  { num: 2, title: t("points.benefit2Title"), desc: t("points.benefit2Desc") },
                  { num: 3, title: t("points.benefit3Title"), desc: t("points.benefit3Desc") },
                ].map((benefit) => (
                  <motion.div
                    key={benefit.num}
                    whileHover={{ borderColor: "#111827" }}
                    className="bg-white border-2 border-gray-200 p-6 flex gap-5 items-start transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center font-black text-xl flex-shrink-0">
                      {benefit.num}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h4>
                      <p className="text-gray-600 text-sm">{benefit.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-10 bg-white border-y-4 border-gray-900">
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 lowercase tracking-tighter mb-4">
              {t("process.title")}
            </h2>
            <p className="text-gray-600 text-lg">{t("processSubtitle")}</p>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-12 bottom-12 w-0.5 bg-gradient-to-b from-gray-900 to-gray-300 hidden md:block" />

            <div className="space-y-10">
              {[
                { num: 1, title: t("process.step1Title"), desc: t("process.step1Desc") },
                { num: 2, title: t("process.step2Title"), desc: t("process.step2Desc"), highlight: `${t("process.vTokenExplanation")} ${t("process.vTokenDesc")}\n${t("process.vTokenExample")}` },
                { num: 3, title: t("process.step3Title"), desc: t("process.step3Desc"), highlight: t("points.formula") },
                { num: 4, title: t("process.step4Title"), desc: t("process.step4Desc") },
                { num: 5, title: t("process.step5Title"), desc: t("process.step5Desc"), examples: [
                  { rank: t("process.rank1"), example: t("process.rank1Example") },
                  { rank: t("process.rank2"), example: t("process.rank2Example") },
                ]},
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative pl-0 md:pl-20"
                >
                  <div className="absolute left-0 top-0 w-12 h-12 bg-gray-900 text-white rounded-full hidden items-center justify-center font-black text-xl z-10 md:flex">
                    {step.num}
                  </div>
                  <div className="md:hidden w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-black text-xl mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{step.desc}</p>
                  {step.highlight && (
                    <div className="bg-gray-50 border-l-4 border-gray-900 p-4 text-sm text-gray-900 whitespace-pre-line">
                      {step.highlight}
                    </div>
                  )}
                  {step.examples && (
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      {step.examples.map((ex, j) => (
                        <div key={j} className="bg-gray-50 border-2 border-gray-200 border-l-4 border-l-gray-900 p-4">
                          <p className="text-gray-900 font-bold mb-1">{ex.rank}</p>
                          <p className="text-gray-600 text-sm">{ex.example}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RealFiNE Section */}
      <section className="py-20 md:py-32 px-4 md:px-10 bg-[#f8f7f5]">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 lowercase tracking-tighter text-center mb-12"
          >
            {t("realfineSection.title")}
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white border-2 border-gray-900 p-8 shadow-md"
            >
              <p className="text-gray-700 text-base leading-relaxed">
                {t("realfineSection.descriptionLeft")}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white border-2 border-gray-900 p-8 shadow-md"
            >
              <p className="text-gray-700 text-base leading-relaxed">
                {t("realfineSection.descriptionRight")}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20 md:py-32 px-4 md:px-10 bg-white border-y-4 border-gray-900">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="max-w-7xl mx-auto relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {[
            { icon: Bolt, title: t("features.feature1Title"), desc: t("features.feature1Desc") },
            { icon: Lock, title: t("features.feature2Title"), desc: t("features.feature2Desc") },
            { icon: PieChart, title: t("features.feature3Title"), desc: t("features.feature3Desc") },
            { icon: Smartphone, title: t("features.feature4Title"), desc: t("features.feature4Desc") },
            { icon: Globe, title: t("features.feature5Title"), desc: t("features.feature5Desc") },
          ].map((feature, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              whileHover={{ y: -5 }}
              className="bg-white border-2 border-gray-200 p-6 text-center transition-all duration-300 hover:border-gray-900 hover:shadow-lg"
            >
              <div className="w-12 h-12 bg-gray-900 mx-auto mb-4 flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-gray-900 font-bold mb-2">{feature.title}</h4>
              <p className="text-gray-600 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Trust Strip */}
      <div className="bg-gray-900 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-around items-center gap-6">
          {[
            { icon: ShieldCheck, text: t("trustStrip.notInvestment") },
            { icon: Ticket, text: t("trustStrip.serviceVoucher") },
            { icon: Home, text: t("trustStrip.actualResidence") },
            { icon: CheckCircle, text: t("trustStrip.regulationFriendly") },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-white font-bold hover:scale-105 transition-transform">
              <item.icon className="w-6 h-6" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact/CTA Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-10 bg-[#f8f7f5]">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              Ready to transform your real estate?
            </h2>
            <p className="text-xl text-gray-600 font-medium mb-10">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/realfi/invest"
                className="px-10 py-4 bg-gray-900 text-white font-bold uppercase tracking-wider hover:bg-gray-800 transition-all duration-300 hover:-translate-y-1"
              >
                Buy HomeCredit
              </Link>
              <Link
                href="https://smartstore.naver.com/seoulgaok"
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-4 bg-white text-gray-900 font-bold uppercase tracking-wider border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 hover:-translate-y-1"
              >
                Learn More
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-8 text-gray-600 font-medium text-sm">
              <div className="flex items-center gap-2 justify-center">
                <MapPin className="w-5 h-5 text-gray-900" />
                <span>Seoul, South Korea</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
