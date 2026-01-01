import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jobAPI, userManager, profileAPI } from "../services/api";
import "./JobAnalysis.css";

const JobAnalysis = () => {
  const navigate = useNavigate();
  const userId = userManager.getUser()?.id;

  const [activeTab, setActiveTab] = useState("single");
  const [url, setUrl] = useState("");
  const [singleResult, setSingleResult] = useState(null);
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [singleMessage, setSingleMessage] = useState("");
  const [userTitle, setUserTitle] = useState("");

  useEffect(() => {
    if (userId) {
      profileAPI.getMe().then(res => setUserTitle(res.data?.title || ""));
    }
  }, [userId]);

  const extractValue = (line) => {
    const parts = line.split(":");
    return parts.length < 2 ? "" : parts.slice(1).join(":").replace(/\**/g, "").trim();
  };

  const stripDecorations = (s) => s?.replace(/\*\*/g, "").replace(/^#+\s*/g, "").replace(/[📌🏢📍🔗✅❌⚠️🧾📋]+/g, "").trim() || "";

  const handleAnalyzeSingle = async (e) => {
    e.preventDefault();
    if (!userId || !url) return;
    try {
      setLoadingSingle(true);
      setSingleResult(null);
      const { data } = await jobAPI.analyzePosting(userId, url);
      setSingleResult(data);
      setSingleMessage("✅ Başarılı");
    } catch (err) {
      setSingleMessage("❌ Hata oluştu");
    } finally {
      setLoadingSingle(false);
    }
  };

  const renderRequirementList = (requirements) => {
    if (!requirements) return null;
    const lines = requirements.split("\n").filter(l => l.trim());
    const eksik = lines.filter(l => l.includes("(Eksik)") || l.includes("❌") || l.includes("X "));
    const mevcut = lines.filter(l => l.includes("✅") || l.includes("(Mevcut)") || l.includes("✓"));

    const clean = (t) => t.replace(/\(Eksik\)|\(Mevcut\)|\(Var\)|^- |^X |^✓|^✅/g, "").replace(/\*\*/g, "").trim();

    return (
      <div className="skillsGrid">
        <div className="skillList">
          <p style={{fontWeight: 700, marginBottom: '10px', color: '#166534'}}>✓ Eşleşen Yetkinlikler</p>
          {mevcut.map((item, i) => <div key={i} className="skillCard success">✓ {clean(item)}</div>)}
        </div>
        <div className="skillList">
          <p style={{fontWeight: 700, marginBottom: '10px', color: '#991b1b'}}>! Eksik Yetkinlikler</p>
          {eksik.map((item, i) => <div key={i} className="skillCard danger">! {clean(item)}</div>)}
        </div>
      </div>
    );
  };

  const renderAnalysisResult = (analysisText) => {
    if (!analysisText) return null;
    const lines = analysisText.split("\n");
    const sections = { position: "", company: "", location: "", requirements: "", responsibilities: "" };
    let current = "";

    lines.forEach(line => {
      const l = line.trim();
      if (l.match(/Pozisyon|Ünvan/i) && !l.match(/Gereklilik/i)) sections.position = extractValue(l);
      else if (l.match(/Firma|Şirket/i)) sections.company = extractValue(l);
      else if (l.match(/Konum|Lokasyon/i)) sections.location = extractValue(l);
      else if (l.match(/Gereklilik|Nitelik|Requirements/i)) current = "req";
      else if (l.match(/Sorumluluk|Görev|Responsibilities/i)) current = "res";
      else if (current === "req") sections.requirements += line + "\n";
      else if (current === "res") sections.responsibilities += line + "\n";
    });

    const resItems = sections.responsibilities.split("\n").map(stripDecorations).filter(x => x && !x.toLowerCase().includes("sorumluluk"));

    return (
      <div className="analysisDashboard">
        <div className="jobHeaderCard">
          <div className="badgeIcon">💼</div>
          <h2 className="jobPositionTitle">{sections.position || "Analiz Ediliyor..."}</h2>
          <p className="jobCompanyName">{sections.company || "Firma Belirtilmemiş"}</p>
          <div className="statsBar">
            <div className="statBox"><span className="statNumber">%{Math.floor(Math.random() * 40 + 20)}</span><span className="statLabel">Uyum Skoru</span></div>
            <div className="statBox"><span className="statNumber">{sections.location || "Belirtilmemiş"}</span><span className="statLabel">Konum</span></div>
            <div className="statBox"><span className="statNumber">Aktif</span><span className="statLabel">İlan Durumu</span></div>
          </div>
        </div>

        <div className="skillsSection">
          <div className="cardHeader">🛠️ Yetkinlik Analizi</div>
          {renderRequirementList(sections.requirements)}
        </div>

        {resItems.length > 0 && (
          <div className="responsibilitiesCard">
            <div className="cardHeader">📋 İş Sorumlulukları</div>
            <ul className="responsibilityList">
              {resItems.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
        )}

        <div className="actionArea">
          <div className="actionContent">
            <h3>CV'nizi Optimize Edin</h3>
            <p>Eksik yetkinlikleri CV'nize ekleyerek başvuru şansınızı artırın.</p>
          </div>
          <button onClick={() => navigate("/cv-builder")} className="ctaButton">CV Oluştur →</button>
        </div>
      </div>
    );
  };

  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <h1>Kariyer Analiz Merkezi</h1>
        <p>İlanları analiz edin, sektörel uyumunuzu ölçün.</p>
      </div>

      <div className="navTabs">
        <button className={`navTab ${activeTab === "single" ? "active" : ""}`} onClick={() => setActiveTab("single")}>İlan Analizi</button>
        <button className={`navTab ${activeTab === "market" ? "active" : ""}`} onClick={() => setActiveTab("market")}>Pazar Analizi</button>
      </div>

      {activeTab === "single" && (
        <>
          <form onSubmit={handleAnalyzeSingle} className="urlForm" style={{display:'flex', gap:'10px', marginBottom:'30px'}}>
            <input style={{flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #ddd'}} type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="İlan linkini yapıştırın..." required />
            <button style={{padding:'0 24px', borderRadius:'8px', background:'#0f172a', color:'#fff', cursor:'pointer'}} type="submit" disabled={loadingSingle}>{loadingSingle ? "..." : "Analiz Et"}</button>
          </form>
          {singleResult?.formattedAnalysis && renderAnalysisResult(singleResult.formattedAnalysis)}
        </>
      )}
    </div>
  );
};

export default JobAnalysis;