import React from 'react';
import { useNavigate } from 'react-router-dom';
import commonStyles from '../style/common';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white text-slate-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-600 py-24 px-4 overflow-hidden">
        <div className={commonStyles.container}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 text-white">
              <div className="space-y-4">
                <p className="text-cyan-100 font-semibold uppercase tracking-widest text-sm">Campus Placement Platform</p>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Build Your Career With Smart Placement Drives
                </h1>
                <p className="text-lg text-cyan-50 leading-relaxed max-w-2xl">
                  Search top companies, apply to drives, and track interviews all in one clean platform designed for student success.
                </p>
              </div>

              {/* Search Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Search companies or roles"
                    className="px-6 py-4 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    className="px-6 py-4 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    onClick={() => navigate('/drives')}
                    className="px-8 py-4 bg-yellow-400 text-slate-900 font-bold rounded-xl hover:bg-yellow-300 transition shadow-lg text-lg"
                  >
                    Search Drives
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-slate-100 transition shadow-lg text-lg border-2 border-white"
                  >
                    Join Now
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-white">1.5K+</p>
                  <p className="text-cyan-100 text-sm font-medium mt-2">Students Placed</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-white">1500+</p>
                  <p className="text-cyan-100 text-sm font-medium mt-2">Recruiters</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-white">500+</p>
                  <p className="text-cyan-100 text-sm font-medium mt-2">Drives Live</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className={commonStyles.container}>
          <div className="text-center mb-16">
            <p className="text-blue-600 font-bold uppercase tracking-widest text-sm">Why Choose Us?</p>
            <h2 className="text-5xl font-bold text-slate-900 mt-4">Everything for Campus Placement</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mt-6 leading-relaxed">
              A modern, clean platform designed to make campus placement simple, transparent, and rewarding for students and companies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border-2 border-blue-200 shadow-lg hover:shadow-xl transition">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Search Drives</h3>
              <p className="text-slate-700 text-lg leading-relaxed">
                Filter by company, role, location, and deadline. Find opportunities that match your skills and goals.
              </p>
            </div>
            <div className="bg-slate-900 rounded-3xl p-8 shadow-lg hover:shadow-xl transition">
              <h3 className="text-3xl font-bold text-white mb-4">Track Applications</h3>
              <p className="text-cyan-100 text-lg leading-relaxed">
                Monitor your application status, interview dates, and results in one organized dashboard.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 border-2 border-green-200 shadow-lg hover:shadow-xl transition">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Get Alerts</h3>
              <p className="text-slate-700 text-lg leading-relaxed">
                Instant notifications for new drives, interview updates, and important deadlines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Features Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className={commonStyles.container}>
          <div className="text-center mb-20">
            <p className="text-teal-400 font-bold uppercase tracking-widest text-sm">Comprehensive Suite</p>
            <h2 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-teal-350 to-emerald-400 bg-clip-text text-transparent mt-4">
              Detailed Platform Capabilities
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed text-lg">
              Smart Placement Tracker supports a secure Role-Based Access Control (RBAC) design tailored specifically for students, recruiters, and platform administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "🎓 Candidate Profiles & CV Registry",
                desc: "Students build structured education histories (CGPA, degree, branch, roll number), list relevant technical skills, link GitHub/LinkedIn portfolios, and upload PDF resumes for recruiters.",
                color: "border-slate-800 hover:border-blue-500/40 bg-slate-950/40"
              },
              {
                title: "💼 Placement Drive Lifecycle",
                desc: "Companies post drives specifying roles, detailed job descriptions, minimum CGPA thresholds, skills required, vacancy counts, location, and salary packages (CTC) with instant student notifications.",
                color: "border-slate-800 hover:border-teal-500/40 bg-slate-950/40"
              },
              {
                title: "🛡️ Administrative Command Center",
                desc: "Admins run platform registry audits, view stats, activate/deactivate student or recruiter accounts, suspend/block placement drives, and broadcast announcement notifications system-wide.",
                color: "border-slate-800 hover:border-emerald-500/40 bg-slate-950/40"
              },
              {
                title: "🔒 JWT & RBAC Handshake Flow",
                desc: "Visualizes token exchange mechanism with signature decryption key checks, showing how requests are authenticated through verifyToken middlewares securely in a step-by-step flowchart.",
                color: "border-slate-800 hover:border-indigo-500/40 bg-slate-950/40"
              },
              {
                title: "💬 AI Placement Assistant",
                desc: "Integrated smart chatbot that provides immediate support to applicants regarding job descriptions, eligibility criteria, interview rounds, and calendar scheduling tasks.",
                color: "border-slate-800 hover:border-pink-500/40 bg-slate-950/40"
              },
              {
                title: "📅 Interview Scheduling Board",
                desc: "Provides centralized calendar interfaces for mock tests, recruitment coding rounds, interview slots, and status workflows, updating students and companies in real-time.",
                color: "border-slate-800 hover:border-amber-500/40 bg-slate-950/40"
              }
            ].map((feature, idx) => (
              <div key={idx} className={`p-8 rounded-[2rem] border backdrop-blur-xl transition hover:-translate-y-1.5 duration-300 shadow-2xl flex flex-col justify-between ${feature.color}`}>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-100">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-700 to-cyan-600">
        <div className={commonStyles.container}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-white">
            <div className="flex-1 space-y-4">
              <p className="font-semibold uppercase tracking-widest text-cyan-100">Ready to get started?</p>
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                Join thousands of students building their careers
              </h2>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="px-10 py-5 bg-yellow-400 text-slate-900 font-bold rounded-2xl hover:bg-yellow-300 transition shadow-lg text-lg whitespace-nowrap"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
