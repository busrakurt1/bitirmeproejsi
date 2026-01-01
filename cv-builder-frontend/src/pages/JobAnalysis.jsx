import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { userManager } from "../services/api"; // ✅ PATH’i projene göre düzelt
import "./JobAnalysis.css";

const JobAnalysis = () => {
  const navigate = useNavigate();

  // ✅ userId: login olmuş kullanıcıdan gelsin, yoksa 1'e düşsün
  const [userId, setUserId] = useState(() => String(userManager.getUserId() ?? 1));

  // TAB
  const [activeTab, setActiveTab] = useState("single");

  // SINGLE JOB ANALYSIS
  const [url, setUrl] = useState("");
  const [singleResult, setSingleResult] = useState(null);
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [singleMessage, setSingleMessage] = useState("");

  // MARKET ANALYSIS
  const [area, setArea] = useState("");
  const [marketResult, setMarketResult] = useState(null);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [marketMessage, setMarketMessage] = useState("");
  const [userProfile, setUserProfile] = useState(null);

  // SUGGESTED AREAS
  const [suggestedAreas] = useState([
    "Yazılım Mühendisliği",
    "Bilgisayar Mühendisliği",
    "Elektrik-Elektronik Mühendisliği",
    "Makine Mühendisliği",
    "Endüstri Mühendisliği",
    "İnşaat Mühendisliği",
    "Yapay Zeka",
    "Machine Learning",
    "Frontend Development",
    "Backend Development",
    "Full Stack Development",
    "DevOps",
    "Data Science",
    "Cybersecurity",
    "Mobile Development",
    "Cloud Computing",
    "Web Development",
    "UI/UX Design",
  ]);

  // ✅ (opsiyonel) profil bilgisini frontend'de örneklemek
  useEffect(() => {
    // Eğer profile/me endpoint’in varsa burada çekebilirsin:
    // api.get("/profile/me").then(res => setUserProfile(res.data));

    // Şimdilik demo: (istersen kaldır)
    setUserProfile({
      department: "Bilgisayar Mühendisliği",
      title: "Öğrenci / Yeni Mezun",
    });
    setArea("Bilgisayar Mühendisliği");
  }, []);

  // ---------------- HELPERS ----------------
  const safe = (v) => (v && String(v).trim() ? String(v).trim() : "Belirtilmemiş");
  const uniq = (arr) =>
    Array.from(new Set((arr || []).map((x) => String(x).trim()).filter(Boolean)));

  // ---------------- SINGLE: ANALYZE BY URL ----------------
  const handleAnalyzeSingle = async (e) => {
    e.preventDefault();

    if (!url || !url.trim()) {
      setSingleMessage("❌ Lütfen bir URL girin");
      return;
    }

    try {
      setLoadingSingle(true);
      setSingleResult(null);
      setSingleMessage("");

      // ✅ BACKEND: POST /api/job/analyze-by-url
      const response = await api.post("/job/analyze-by-url", {
        userId: parseInt(userId, 10),
        url: url.trim(),
      });

      setSingleResult(response.data);
      setSingleMessage("✅ Analiz Başarıyla Tamamlandı");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Sunucu hatası";
      setSingleMessage("❌ Analiz sırasında bir hata oluştu: " + msg);
      console.error("İlan analizi hatası:", err);
    } finally {
      setLoadingSingle(false);
    }
  };

  // ---------------- MARKET: AUTO ANALYZE ----------------
  const handleAutoAnalyze = async () => {
    try {
      setLoadingMarket(true);
      setMarketResult(null);
      setMarketMessage("");

      // ✅ BACKEND: POST /api/market/analyze (area boş -> otomatik)
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        setMarketMessage("❌ Geçersiz kullanıcı ID");
        setLoadingMarket(false);
        return;
      }

      const response = await api.post("/market/analyze", {
        userId: userIdNum,
        area: null,
      });

      setMarketResult(response.data);
      setMarketMessage(`✅ "${response.data.area || "Seçilen Alan"}" için otomatik pazar analizi tamamlandı`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Sunucu hatası";
      setMarketMessage("❌ Analiz hatası: " + msg);
      console.error("Otomatik pazar analizi hatası:", err);
    } finally {
      setLoadingMarket(false);
    }
  };

  // ---------------- MARKET: MANUAL ANALYZE ----------------
  const handleMarketAnalysis = async (e) => {
    e.preventDefault();

    try {
      setLoadingMarket(true);
      setMarketResult(null);
      setMarketMessage("");

      // ✅ BACKEND: POST /api/market/analyze
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        setMarketMessage("❌ Geçersiz kullanıcı ID");
        setLoadingMarket(false);
        return;
      }

      const areaValue = (area ?? "").trim();
      const response = await api.post("/market/analyze", {
        userId: userIdNum,
        area: areaValue || null,
      });

      setMarketResult(response.data);

      if (response.data?.isAutoAnalyzed) {
        setMarketMessage(`✅ "${response.data.area}" alanı için otomatik pazar analizi tamamlandı`);
      } else {
        setMarketMessage(`✅ "${response.data.area}" alanı için özel pazar analizi tamamlandı`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Sunucu hatası";
      setMarketMessage("❌ Analiz hatası: " + msg);
      console.error("Pazar analizi hatası:", err);
    } finally {
      setLoadingMarket(false);
    }
  };

  // ---------------- RENDER: SKILLS ----------------
  const renderSkills = (result) => {
    const matched = uniq(result?.matchedSkills || []);
    const missing = uniq(result?.missingSkills || []);

    return (
      <div className="skillsGrid">
        <div className="skillList">
          <p className="skillListTitle successTitle">✓ Eşleşen Teknik Yetenekler</p>
          {matched.length === 0 ? (
            <div className="emptyBox">Eşleşen yetenek bulunamadı.</div>
          ) : (
            matched.map((s, i) => (
              <div key={i} className="skillCard success">
                ✓ {s}
              </div>
            ))
          )}
        </div>

        <div className="skillList">
          <p className="skillListTitle dangerTitle">! Eksik Yetenekler</p>
          {missing.length === 0 ? (
            <div className="emptyBox">Kritik bir eksiklik tespit edilmedi.</div>
          ) : (
            missing.map((s, i) => (
              <div key={i} className="skillCard danger">
                ! {s}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // ---------------- RENDER: SINGLE RESULT ----------------
  const renderResult = () => {
    if (!singleResult) return null;

    const {
      position,
      company,
      location,
      workType,
      educationLevel,
      experienceLevel,
      militaryStatus,
      salary,
      summary,
      responsibilities,
      matchScore,
      matchedSkills,
      missingSkills,
      formattedAnalysis, // ✅ AI raporu
    } = singleResult;

    const matchedCount = Array.isArray(matchedSkills) ? matchedSkills.length : 0;
    const missingCount = Array.isArray(missingSkills) ? missingSkills.length : 0;

    return (
      <div className="analysisDashboard">
        <div className="jobHeaderCard">
          <div className="badgeIcon">💼</div>
          <h2 className="jobPositionTitle">{safe(position)}</h2>
          <p className="jobCompanyName">{safe(company)}</p>

          <div className="metaRow">
            <div className="metaItem">
              <span className="metaLabel">📍 Konum</span>
              <span className="metaValue">{safe(location)}</span>
            </div>
            <div className="metaItem">
              <span className="metaLabel">💼 Çalışma</span>
              <span className="metaValue">{safe(workType)}</span>
            </div>
            <div className="metaItem">
              <span className="metaLabel">⏳ Deneyim</span>
              <span className="metaValue">{safe(experienceLevel)}</span>
            </div>
            <div className="metaItem">
              <span className="metaLabel">🎓 Eğitim</span>
              <span className="metaValue">{safe(educationLevel)}</span>
            </div>
            {militaryStatus && safe(militaryStatus) !== "Belirtilmemiş" && (
              <div className="metaItem">
                <span className="metaLabel">🎖️ Askerlik</span>
                <span className="metaValue">{safe(militaryStatus)}</span>
              </div>
            )}
            {salary && safe(salary) !== "Belirtilmemiş" && (
              <div className="metaItem">
                <span className="metaLabel">💰 Maaş</span>
                <span className="metaValue">{safe(salary)}</span>
              </div>
            )}
          </div>

          <div className="statsBar">
            <div className="statBox">
              <span className="statNumber">%{matchScore || 0}</span>
              <span className="statLabel">Uyum</span>
            </div>
            <div className="statBox">
              <span className="statNumber">{matchedCount}</span>
              <span className="statLabel">Eşleşen</span>
            </div>
            <div className="statBox">
              <span className="statNumber">{missingCount}</span>
              <span className="statLabel">Eksik</span>
            </div>
          </div>
        </div>

        {summary && safe(summary) !== "" && safe(summary) !== "Belirtilmemiş" && (
          <div className="responsibilitiesCard">
            <div className="cardHeader">📝 İŞ ÖZETİ</div>
            <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-primary)' }}>{safe(summary)}</p>
          </div>
        )}

        <div className="skillsSection">
          <div className="cardHeader">🛠️ YETENEK ANALİZİ</div>
          {renderSkills(singleResult)}
        </div>

        {Array.isArray(responsibilities) && responsibilities.length > 0 && (
          <div className="responsibilitiesCard">
            <div className="cardHeader">📋 SORUMLULUKLAR ({responsibilities.length} madde)</div>
            <ul className="responsibilityList">
              {responsibilities.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ✅ AI raporu mutlaka göster
        {formattedAnalysis && String(formattedAnalysis).trim().length > 0 && (
          <div className="aiAnalysisCard singleAiCard">
            <div className="cardHeader">🤖 DETAYLI AI ANALİZİ</div>
            <pre className="singleAiText">{formattedAnalysis}</pre>
          </div>
        )} */}

        <div className="actionArea">
          <button onClick={() => navigate("/cv-builder")} className="ctaButton">
            Profilimi Optimize Et →
          </button>
        </div>
      </div>
    );
  };

  // ---------------- HELPER: Parse AI Recommendation ----------------
  const parseAIRecommendation = (text) => {
    if (!text || typeof text !== 'string') return { careerAdvice: null, roadmap: null, fullText: null };
    
    const lowerText = text.toLowerCase();
    if (lowerText.includes("şu anda mevcut değil") || 
        lowerText.includes("gerçekleştirilemiyor") ||
        lowerText.includes("hazırlanıyor") ||
        lowerText.includes("lütfen")) {
      return { careerAdvice: null, roadmap: null, fullText: null };
    }

    // Yol haritası bölümünü ayır
    const roadmapMatch = text.match(/### 🎯 Gelişim Yol Haritanız([\s\S]*?)(?=###|$)/i);
    const roadmap = roadmapMatch ? roadmapMatch[1].trim() : null;

    // Yol haritasını ana metinden çıkar
    let careerAdvice = text;
    if (roadmap) {
      careerAdvice = text.replace(/### 🎯 Gelişim Yol Haritanız[\s\S]*?(?=###|$)/i, '').trim();
    }

    return {
      careerAdvice: careerAdvice || null,
      roadmap: roadmap || null,
      fullText: text
    };
  };

  // ---------------- RENDER: MARKET RESULT ----------------
  const renderMarketResult = () => {
    if (!marketResult) return null;

    const { area, userTitle, topSkillsInMarket, userMissingSkills, aiRecommendation, isAutoAnalyzed } = marketResult;
    const { careerAdvice, roadmap } = parseAIRecommendation(aiRecommendation);
    const hasValidAI = careerAdvice && careerAdvice.length > 50;

    return (
      <div className="analysisDashboard">
        <div className="marketHeaderCard">
          <div className="badgeIcon">{isAutoAnalyzed ? "🤖" : "📊"}</div>
          <h2 className="marketTitle">
            {isAutoAnalyzed ? `${area} Mezunları İçin Pazar Analizi` : `${area} Alanı Pazar Analizi`}
          </h2>
          <div className={`analysisTypeBadge ${isAutoAnalyzed ? "auto" : "manual"}`}>
            {isAutoAnalyzed ? "Otomatik Analiz" : "Özel Analiz"}
          </div>
          {userTitle && (
            <p className="marketSubtitle">
              Mevcut Unvanınız: <strong>{userTitle}</strong>
            </p>
          )}
        </div>

        {/* Kariyer Danışmanı Önerisi - Ayrı Tablo */}
        {hasValidAI && (
          <div className="aiAnalysisCard careerAdviceCard">
            <div className="careerAdviceHeader">
              <span className="careerAdviceIcon">🤖</span>
              <div>
                <h3 className="careerAdviceTitle">Kariyer Danışmanı Önerisi</h3>
                <p className="careerAdviceSubtitle">
                  <strong>{area}</strong> alanı için profiliniz analiz edildi
                </p>
              </div>
            </div>
            <div className="aiAnalysisContent careerAdviceContent">
              <div className="careerAdviceText">
                <pre style={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  margin: 0,
                  padding: 0,
                  fontSize: '0.95rem',
                  lineHeight: '1.7'
                }}>{careerAdvice}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Yol Haritası - Ayrı Tablo */}
        {roadmap && roadmap.trim().length > 20 && (
          <div className="aiAnalysisCard roadmapCard">
            <div className="careerAdviceHeader">
              <span className="careerAdviceIcon">🎯</span>
              <div>
                <h3 className="careerAdviceTitle">Gelişim Yol Haritanız</h3>
                <p className="careerAdviceSubtitle">
                  <strong>{area}</strong> alanı için önerilen öğrenme planı
                </p>
              </div>
            </div>
            <div className="aiAnalysisContent careerAdviceContent">
              <div className="careerAdviceText">
                <pre style={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  margin: 0,
                  padding: 0,
                  fontSize: '0.95rem',
                  lineHeight: '1.7'
                }}>{roadmap}</pre>
              </div>
            </div>
          </div>
        )}

        {/* AI yoksa mesaj göster */}
        {!hasValidAI && (
          <div className="aiAnalysisCard careerAdviceCard">
            <div className="careerAdviceHeader">
              <span className="careerAdviceIcon">🤖</span>
              <div>
                <h3 className="careerAdviceTitle">Kariyer Danışmanı Önerisi</h3>
                <p className="careerAdviceSubtitle">
                  <strong>{area}</strong> alanı için profiliniz analiz edildi
                </p>
              </div>
            </div>
            <div className="aiAnalysisContent careerAdviceContent">
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#64748b',
                fontStyle: 'italic'
              }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>
                  🤖 AI analizi hazırlanıyor...
                </p>
                <p style={{ fontSize: '0.9rem' }}>
                  Lütfen birkaç saniye bekleyip tekrar deneyin veya daha sonra tekrar analiz yapın.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="marketDataGrid">
          <div className="skillsSection">
            <div className="cardHeader">🔥 Sektörde En Çok Arananlar</div>
            <div className="marketStatsTable">
              {topSkillsInMarket &&
                Object.entries(topSkillsInMarket)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 15)
                  .map(([skill, count], index) => (
                    <div key={index} className="marketStatRow">
                      <span className="skillRankNumber">{index + 1}.</span>
                      <span className="skillName">{skill}</span>
                      <span className="skillDemand">{count} ilanda geçiyor</span>
                    </div>
                  ))}
            </div>
          </div>

          <div className="skillsSection">
            <div className="cardHeader">⚠️ Sizin İçin Kritik Eksikler</div>
            {userMissingSkills && userMissingSkills.length > 0 ? (
              <div className="missingSkillsGrid">
                {userMissingSkills.map((skill, index) => (
                  <div key={index} className="missingSkillRow">
                    <span className="skillWarningIcon">⚠️</span>
                    <span className="skillName">{skill}</span>
                    <span className="skillHint">Pazarda Çok Popüler</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="emptyBox successBox">✓ Pazarın istediği tüm ana yeteneklere sahipsiniz!</div>
            )}
          </div>
        </div>

        <div className="actionArea">
          <div className="actionContent">
            <h3>Eksikleri Tamamla</h3>
            <p>AI'nın önerdiği bu yetenekleri CV'ne eklemek için hemen düzenle.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate("/cv-builder")} className="ctaButton">
              CV'mi Güncelle →
            </button>
            <button 
              onClick={() => {
                setMarketResult(null);
                setMarketMessage(null);
                setArea("");
              }} 
              className="ctaButton"
              style={{ 
                background: 'var(--bg-subtle)', 
                color: 'var(--primary)',
                border: '1px solid var(--border)'
              }}
            >
              🔄 Yeni Analiz Yap
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---------------- RENDER: MARKET TAB ----------------
  const renderMarketTab = () => {
    // Analiz sonuçları varsa sadece sonuçları göster, formu gizle
    if (marketResult) {
      return (
        <>
          {marketMessage && (
            <div className={`messageLine ${marketMessage.includes("✅") ? "success" : "error"}`}>
              {marketMessage}
            </div>
          )}
          {renderMarketResult()}
        </>
      );
    }

    // Analiz sonuçları yoksa formu göster
    return (
      <div className="sectoralAnalysisContainer">
        {/* Ana Başlık ve Açıklama */}
        <div className="sectoralAnalysisHeader">
          <h2 className="sectoralAnalysisTitle">Sektörel Trend Analizi</h2>
          <p className="sectoralAnalysisDescription">
            İş ilanlarını ve pazar trendlerini yapay zeka ile analiz edin. Sektörde en çok aranan yetenekleri keşfedin ve kariyer yolunuzu optimize edin.
          </p>
        </div>

        {/* Otomatik Analiz Bölümü */}
        {userProfile?.department && (
          <div className="autoAnalysisCard">
            <div className="autoAnalysisContent">
              <div className="autoAnalysisIcon">🚀</div>
              <div className="autoAnalysisText">
                <h3 className="autoAnalysisTitle">Hızlı Analiz</h3>
                <p className="autoAnalysisSubtitle">
                  <strong>{userProfile.department}</strong> mezunları için otomatik sektör analizi
                </p>
              </div>
            </div>
            <button 
              className="autoAnalyzeButton" 
              onClick={handleAutoAnalyze} 
              disabled={loadingMarket}
            >
              {loadingMarket ? (
                <>
                  <span className="spinner"></span> Analiz Ediliyor...
                </>
              ) : (
                <>
                  <span className="buttonIcon">🚀</span>
                  {userProfile.department} İçin Otomatik Analiz Yap
                </>
              )}
            </button>
          </div>
        )}

        {/* Ayırıcı */}
        {userProfile?.department && (
          <div className="orDivider">
            <div className="orDividerLine"></div>
            <span className="orDividerText">veya</span>
            <div className="orDividerLine"></div>
          </div>
        )}

        {/* Özel Alan Analizi Formu */}
        <div className="customAnalysisCard">
          <div className="customAnalysisHeader">
            <div className="customAnalysisIcon">📊</div>
            <div>
              <h3 className="customAnalysisTitle">
                {userProfile?.department ? "Farklı Bir Alan Analiz Et" : "Özel Alan Analizi"}
              </h3>
              <p className="customAnalysisSubtitle">
                {userProfile?.department
                  ? "Mezun olduğunuz bölüm dışında bir alanı analiz etmek isterseniz buraya yazın"
                  : "Hangi alanda kariyer yapmak istiyorsanız o alanı yazın"}
              </p>
            </div>
          </div>

          <form onSubmit={handleMarketAnalysis} className="marketForm">
            <div className="formGroup">
              <label htmlFor="area" className="formLabel">
                Analiz Edilecek Alan
              </label>
              <input
                id="area"
                className="areaInput"
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder={userProfile?.department ? userProfile.department : "Örn: Yazılım Mühendisliği, Backend Development, Yapay Zeka..."}
                list="suggestedAreas"
              />
              <datalist id="suggestedAreas">
                {suggestedAreas.map((areaOption, index) => (
                  <option key={index} value={areaOption} />
                ))}
              </datalist>
            </div>

            <button className="marketButton" type="submit" disabled={loadingMarket || !area.trim()}>
              {loadingMarket ? (
                <>
                  <span className="spinner"></span> Analiz Ediliyor...
                </>
              ) : (
                <>
                  <span className="buttonIcon">📊</span>
                  Özel Alan Analizi Yap
                </>
              )}
            </button>
          </form>
        </div>

        {marketMessage && (
          <div className={`messageLine ${marketMessage.includes("✅") ? "success" : "error"}`}>
            {marketMessage}
          </div>
        )}
      </div>
    );
  };

  // ---------------- MAIN RENDER ----------------
  return (
    <div className="pageContainer">
      <div className="pageHeader" style={{ position: 'relative' }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            padding: '10px 20px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          ← Dashboard'a Dön
        </button>
        <h1>Kariyer Analiz Merkezi</h1>
        <p>İş ilanlarını ve pazar trendlerini yapay zeka ile analiz edin.</p>
      </div>

      {/* (İstersen kullanıcı id gösterme/kontrol alanı ekleyebilirsin) */}
      {/* <div style={{marginBottom: 10}}>UserId: {userId}</div> */}

      <div className="navTabs">
        <button className={`navTab ${activeTab === "single" ? "active" : ""}`} onClick={() => setActiveTab("single")}>
          İlan Analizi
        </button>
        <button className={`navTab ${activeTab === "market" ? "active" : ""}`} onClick={() => setActiveTab("market")}>
          Sektörel Trend Analizi
        </button>
      </div>

      {activeTab === "single" ? (
        <>
          {/* Form sadece sonuç yoksa göster */}
          {!singleResult && (
            <form onSubmit={handleAnalyzeSingle} className="urlForm">
              <input
                className="urlInput"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="İlan linkini yapıştırın (LinkedIn, Kariyer.net, vb.)..."
                required
                disabled={loadingSingle}
              />
              <button className="urlButton" type="submit" disabled={loadingSingle || !url.trim()}>
                {loadingSingle ? "Analiz Ediliyor..." : "Analiz Et"}
              </button>
            </form>
          )}

          {singleMessage && (
            <div className={`messageLine ${singleMessage.includes("✅") ? "success" : "error"}`}>{singleMessage}</div>
          )}

          {singleResult && (
            <>
              {renderResult()}
              {/* Yeni analiz yapmak için buton */}
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button 
                  onClick={() => {
                    setSingleResult(null);
                    setSingleMessage("");
                    setUrl("");
                  }} 
                  className="ctaButton"
                  style={{ 
                    background: 'var(--bg-subtle)', 
                    color: 'var(--primary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  🔄 Yeni Analiz Yap
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        renderMarketTab()
      )}
    </div>
  );
};

export default JobAnalysis;
