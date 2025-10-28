// src/screens/HomePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function HomePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('talent');
  const [howItWorksView, setHowItWorksView] = useState('client');

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", fontFamily: "sans-serif" }}>
      
      {/* Hero Section */}
      <section style={{ position: "relative", minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "2rem 1rem" }}>
        {/* Background Image */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1350&q=80')", backgroundPosition: "center", backgroundSize: "cover", backgroundRepeat: "no-repeat" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(30, 41, 59, 0.82) 100%)" }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 900 }}>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, marginBottom: "1.5rem", lineHeight: 1.2, textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
            Connecting Pakistan's diaspora<br />with trusted local professionals
          </h1>
          <p style={{ fontSize: "1.1rem", marginBottom: "2.5rem", color: "#cbd5e1", maxWidth: "650px", textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}>
            From abroad to home — hire verified professionals across Pakistan for any task, big or small
          </p>

          {/* Wallet + Search Card */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <WalletMultiButton />
            <button onClick={() => navigate("/pre-signup")} style={{ padding: "1rem 2rem", borderRadius: "10px", background: "#3b82f6", border: "none", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
              Get Started
            </button>
          </div>

          {/* Search Card Tabs */}
          <div style={{ background: "rgba(30, 41, 59, 0.95)", backdropFilter: "blur(10px)", borderRadius: "16px", padding: "2rem", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", marginTop: "2rem" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", background: "rgba(15, 23, 42, 0.6)", padding: "0.5rem", borderRadius: "12px" }}>
              <button style={{
                flex: 1, padding: "0.875rem 1.5rem", border: "none", borderRadius: "8px",
                background: activeTab === 'talent' ? "#3b82f6" : "transparent", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "1rem",
                boxShadow: activeTab === 'talent' ? "0 4px 12px rgba(59, 130, 246, 0.4)" : "none"
              }} onClick={() => setActiveTab('talent')}>Find Talent</button>

              <button style={{
                flex: 1, padding: "0.875rem 1.5rem", border: "none", borderRadius: "8px",
                background: activeTab === 'jobs' ? "#3b82f6" : "transparent", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "1rem",
                boxShadow: activeTab === 'jobs' ? "0 4px 12px rgba(59, 130, 246, 0.4)" : "none"
              }} onClick={() => setActiveTab('jobs')}>Browse Jobs</button>
            </div>

            {/* Search + Action Buttons */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder={activeTab === 'talent' ? "Search by role, skills, or keywords" : "Search for jobs..."}
                style={{ flex: 1, minWidth: "250px", padding: "1rem 1.25rem", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", outline: "none", fontSize: "1rem", background: "rgba(15, 23, 42, 0.6)", color: "#fff" }}
              />
              <button style={{ padding: "1rem 2rem", border: "none", borderRadius: "10px", backgroundColor: "#64748b", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "1rem" }}>🔍 Search</button>
              {activeTab === 'talent' && <button style={{ padding: "1rem 2rem", border: "none", borderRadius: "10px", backgroundColor: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "1rem" }}>Post Job</button>}
              {activeTab === 'jobs' && <button style={{ padding: "1rem 2rem", border: "none", borderRadius: "10px", backgroundColor: "#8b5cf6", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "1rem" }}>Explore</button>}
            </div>

            {/* Trusted By */}
            <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "1rem" }}>Trusted by professionals from</p>
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", opacity: 0.7 }}>
                {["🏢 Microsoft","🏠 Airbnb","🏛️ World Bank","⭐ Glassdoor"].map((c, i) => <div key={i} style={{ color:"#94a3b8", fontSize:"0.9rem", fontWeight:500 }}>{c}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Moving Task Categories */}
      <section style={{ overflow: "hidden", padding: "3rem 0 2rem", background: "#0f172a", position: "relative" }}>
        <style>{`
          @keyframes moveLeft { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
          @keyframes moveRight { 0% { transform: translateX(-50%) } 100% { transform: translateX(0) } }
        `}</style>

        {[
          ["Legal Services", "Tech Support", "Construction", "Healthcare", "Home Services"],
          ["Delivery", "Design", "Education", "Marketing", "Finance"]
        ].map((row, idx) => (
          <div key={idx} style={{ display: "flex", gap: "2rem", animation: idx===0 ? "moveLeft 25s linear infinite" : "moveRight 30s linear infinite", whiteSpace: "nowrap", marginTop: idx===0 ? 0 : "1.5rem" }}>
            {[...Array(2)].flatMap(()=>row).map((item, i)=>(
              <div key={i} style={{ minWidth:"160px", background:"linear-gradient(135deg,#1e293b 0%,#334155 100%)", borderRadius:"12px", padding:"1.5rem 1rem", textAlign:"center", boxShadow:"0 4px 12px rgba(0,0,0,0.3)", border:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>💼</div>
                <div style={{ fontSize:"0.95rem", fontWeight:500 }}>{item}</div>
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* Feature Cards */}
      <section style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"1.5rem", padding:"3rem 1rem", maxWidth:"1200px", margin:"0 auto" }}>
        {[
          { icon: "✨", title: "Happiness Pledge", desc: "Satisfaction guaranteed" },
          { icon: "✅", title: "Verified Professionals", desc: "Thoroughly vetted & trusted" },
          { icon: "⚡", title: "Powered by Solana", desc: "Fast, secure payments" }
        ].map((card,i)=>(
          <div key={i} style={{ background:"linear-gradient(135deg,#1e293b 0%,#334155 100%)", padding:"1.5rem", borderRadius:"12px", flex:"1 1 300px", maxWidth:"350px", textAlign:"center", boxShadow:"0 4px 12px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>{card.icon}</div>
            <h3 style={{ marginBottom:"0.5rem", fontSize:"1.1rem" }}>{card.title}</h3>
            <p style={{ color:"#94a3b8", fontSize:"0.9rem" }}>{card.desc}</p>
          </div>
        ))}
      </section>

      {/* How It Works */}
      <section style={{ padding:"4rem 1rem", background:"#111827", maxWidth:"1400px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"3rem" }}>
          <h2 style={{ fontSize:"2.5rem", marginBottom:"1rem" }}>How it works</h2>
          <div style={{ display:"flex", gap:"1rem", justifyContent:"center", marginTop:"1.5rem" }}>
            <button onClick={()=>setHowItWorksView('client')} style={{ padding:"0.75rem 2rem", borderRadius:"8px", background:howItWorksView==='client'?"#3b82f6":"#1e293b", color:"#fff", border:"none" }}>For Clients</button>
            <button onClick={()=>setHowItWorksView('tasker')} style={{ padding:"0.75rem 2rem", borderRadius:"8px", background:howItWorksView==='tasker'?"#3b82f6":"#1e293b", color:"#fff", border:"none" }}>For Taskers</button>
          </div>

          <div style={{ display:"flex", flexWrap:"wrap", gap:"2rem", alignItems:"center", justifyContent:"center", marginTop:"2rem" }}>
            {/* Steps */}
            <div style={{ background:"rgba(255,255,255,0.95)", borderRadius:"16px", padding:"2.5rem", maxWidth:"450px", color:"#000", boxShadow:"0 8px 24px rgba(0,0,0,0.4)", flex:"1 1 400px" }}>
              {howItWorksView==='client'?(
                <>
                  {["Choose a Tasker by price, skills, and reviews.","Schedule a Tasker as early as today.","Chat, pay, tip, and review all in one place."].map((txt,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"flex-start", marginBottom: i<2?"2rem":"0" }}>
                      <div style={{ background:i===0?"#e0e7ff":i===1?"#fef3c7":"#d1fae5", borderRadius:"50%", width:"50px", height:"50px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", fontWeight:"bold", color:i===0?"#3b82f6":i===1?"#d97706":"#059669", flexShrink:0, marginRight:"1.5rem" }}>{i+1}</div>
                      <h3 style={{ fontSize:"1.2rem", marginBottom:"0.5rem", color:"#1e293b" }}>{txt}</h3>
                    </div>
                  ))}
                </>
              ):(
                <>
                  {["Create your profile and showcase your skills.","Browse and apply to jobs that match your expertise.","Complete tasks and get paid securely via blockchain."].map((txt,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"flex-start", marginBottom: i<2?"2rem":"0" }}>
                      <div style={{ background:i===0?"#e0e7ff":i===1?"#fef3c7":"#d1fae5", borderRadius:"50%", width:"50px", height:"50px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", fontWeight:"bold", color:i===0?"#3b82f6":i===1?"#d97706":"#059669", flexShrink:0, marginRight:"1.5rem" }}>{i+1}</div>
                      <h3 style={{ fontSize:"1.2rem", marginBottom:"0.5rem", color:"#1e293b" }}>{txt}</h3>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Image */}
            <div style={{ backgroundImage: howItWorksView==='client'?"url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80')":"url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80')", backgroundPosition:"center", backgroundSize:"cover", backgroundRepeat:"no-repeat", borderRadius:"16px", minWidth:"350px", minHeight:"400px", flex:"1 1 450px", maxWidth:"600px", boxShadow:"0 8px 24px rgba(0,0,0,0.4)" }} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign:"center", padding:"3rem 1rem", background:"#0f172a", color:"#94a3b8", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <p>KaamConnect © 2025 — Bridging distances, building trust</p>
      </footer>
    </div>
  );
}
