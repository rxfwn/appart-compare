"use client";
import { useState, useRef } from "react";
import styles from "./page.module.css";

const DEFAULT_CRITERIA = ["Prix", "Surface", "Localisation", "Pièces", "Étage", "Charges", "Points forts", "Points faibles"];

function ScoreBar({ score }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "#4ade80" : score >= 5 ? "#fbbf24" : "#f87171";
  return (
    <div className={styles.scoreWrap}>
      <div className={styles.scoreBar}>
        <div className={styles.scoreFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.scoreNum} style={{ color }}>{score}/10</span>
    </div>
  );
}

function AppartCard({ appart, criteria, onDelete, rank }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.rank}>#{rank}</span>
        <div className={styles.cardTitle}>
          <h3>{appart.title || "Appartement"}</h3>
          <a href={appart.url} target="_blank" rel="noopener" className={styles.link}>↗ Voir l'annonce</a>
        </div>
        <button className={styles.deleteBtn} onClick={() => onDelete(appart.id)}>✕</button>
      </div>
      <ScoreBar score={appart.score || 5} />
      <p className={styles.summary}>{appart.summary}</p>
      <div className={styles.criteriaGrid}>
        {criteria.map(c => (
          <div key={c} className={styles.criteriaItem}>
            <span className={styles.criteriaLabel}>{c}</span>
            <span className={styles.criteriaValue}>{appart.criteria?.[c] || appart.criteria?.[c.toLowerCase()] || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [apartments, setApartments] = useState([]);
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newCriterion, setNewCriterion] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState("cards"); // cards | table
  const inputRef = useRef();

  const analyze = async () => {
    if (!url.trim()) return;
    if (!apiKey.trim()) {
      setError("⚠️ Entrez votre clé API Gemini dans les paramètres");
      setShowSettings(true);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-gemini-key": apiKey },
        body: JSON.stringify({ url: url.trim(), criteria }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erreur inconnue");
      setApartments(prev => [...prev, json.data]);
      setUrl("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const addCriterion = () => {
    if (newCriterion.trim() && !criteria.includes(newCriterion.trim())) {
      setCriteria(prev => [...prev, newCriterion.trim()]);
      setNewCriterion("");
    }
  };

  const removeCriterion = (c) => setCriteria(prev => prev.filter(x => x !== c));
  const deleteAppart = (id) => setApartments(prev => prev.filter(a => a.id !== id));

  const sorted = [...apartments].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>🏠</div>
          <div>
            <h1 className={styles.title}>AppartCompare</h1>
            <p className={styles.subtitle}>Comparez vos appartements avec l'IA</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.viewToggle} onClick={() => setView(v => v === "cards" ? "table" : "cards")}>
            {view === "cards" ? "⊞ Tableau" : "⊟ Cartes"}
          </button>
          <button className={styles.settingsBtn} onClick={() => setShowSettings(s => !s)}>⚙ Paramètres</button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <section className={styles.settings}>
          <h2 className={styles.sectionTitle}>Paramètres</h2>
          <div className={styles.settingsGrid}>
            <div className={styles.settingsBlock}>
              <label className={styles.label}>🔑 Clé API Gemini</label>
              <input
                type="password"
                className={styles.input}
                placeholder="AIza..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <p className={styles.hint}>Obtenez votre clé sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className={styles.link}>Google AI Studio</a></p>
            </div>
            <div className={styles.settingsBlock}>
              <label className={styles.label}>📋 Critères de comparaison</label>
              <div className={styles.chips}>
                {criteria.map(c => (
                  <span key={c} className={styles.chip}>
                    {c}
                    <button className={styles.chipDel} onClick={() => removeCriterion(c)}>×</button>
                  </span>
                ))}
              </div>
              <div className={styles.addCriteria}>
                <input
                  className={styles.inputSmall}
                  placeholder="Nouveau critère..."
                  value={newCriterion}
                  onChange={e => setNewCriterion(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCriterion()}
                />
                <button className={styles.addBtn} onClick={addCriterion}>+ Ajouter</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* URL Input */}
      <section className={styles.inputSection}>
        <div className={styles.inputBar}>
          <span className={styles.inputIcon}>🔗</span>
          <input
            ref={inputRef}
            className={styles.urlInput}
            type="url"
            placeholder="Collez le lien d'une annonce (SeLoger, LeBonCoin, PAP, Airbnb...)"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && analyze()}
            disabled={loading}
          />
          <button className={styles.analyzeBtn} onClick={analyze} disabled={loading || !url.trim()}>
            {loading ? <span className={styles.spinner} /> : "Analyser ✨"}
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </section>

      {/* Results */}
      {apartments.length === 0 && !loading && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🏘️</div>
          <p>Ajoutez des appartements pour commencer la comparaison</p>
          <p className={styles.emptyHint}>Collez un lien SeLoger, LeBonCoin, PAP, Bien'ici, etc.</p>
        </div>
      )}

      {loading && apartments.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.loadingPulse}>Analyse en cours avec Gemini AI...</div>
        </div>
      )}

      {sorted.length > 0 && view === "cards" && (
        <section className={styles.grid}>
          {sorted.map((a, i) => (
            <AppartCard key={a.id} appart={a} criteria={criteria} onDelete={deleteAppart} rank={i + 1} />
          ))}
        </section>
      )}

      {sorted.length > 0 && view === "table" && (
        <section className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Appartement</th>
                <th>Score</th>
                {criteria.map(c => <th key={c}>{c}</th>)}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a, i) => (
                <tr key={a.id}>
                  <td className={styles.rankCell}>#{i + 1}</td>
                  <td>
                    <a href={a.url} target="_blank" rel="noopener" className={styles.link}>{a.title || "Appartement"}</a>
                  </td>
                  <td>
                    <ScoreBar score={a.score || 5} />
                  </td>
                  {criteria.map(c => (
                    <td key={c}>{a.criteria?.[c] || a.criteria?.[c.toLowerCase()] || "—"}</td>
                  ))}
                  <td>
                    <button className={styles.deleteBtn} onClick={() => deleteAppart(a.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
