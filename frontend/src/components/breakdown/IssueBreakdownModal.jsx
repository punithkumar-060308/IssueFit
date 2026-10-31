import { useState, useEffect, useRef } from 'react'
import {
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileCode2,
  Terminal,
  BookOpen,
  Layers,
  ShieldAlert,
  Cpu,
  ArrowRight,
  RotateCw,
  ExternalLink,
  Lightbulb,
  Check,
  Zap,
} from 'lucide-react'
import DifficultyBadge from '../DifficultyBadge'
import { getIssueBreakdown } from '../../services/issuefitApi'

// In-memory module cache for breakdowns across modal opens
const breakdownCache = new Map()

export default function IssueBreakdownModal({ issue, owner, repo, onClose }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState(null)
  const [breakdownData, setBreakdownData] = useState(null)
  const [isCached, setIsCached] = useState(false)

  const issueNumber = issue?.number
  const cacheKey = `${owner}/${repo}#${issueNumber}`

  // Loading step message rotation
  const loadingSteps = [
    'Gathering GitHub issue context & maintainer comments...',
    'Inspecting repository architecture & candidate files...',
    'Analyzing edge cases, regressions, and testing scenarios...',
    'Synthesizing maintainer-level technical guidance...',
  ]

  useEffect(() => {
    let interval
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length)
      }, 2500)
    }
    return () => clearInterval(interval)
  }, [loading])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const fetchBreakdown = async (forceRefresh = false) => {
    if (!owner || !repo || !issueNumber) {
      setError('Missing repository or issue parameters.')
      setLoading(false)
      return
    }

    if (!forceRefresh && breakdownCache.has(cacheKey)) {
      const cached = breakdownCache.get(cacheKey)
      setBreakdownData(cached)
      setIsCached(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await getIssueBreakdown(owner, repo, issueNumber)
      if (res?.success && res?.breakdown) {
        breakdownCache.set(cacheKey, res.breakdown)
        setBreakdownData(res.breakdown)
        setIsCached(Boolean(res.cached))
      } else {
        throw new Error(res?.error?.message || 'Failed to retrieve breakdown.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while generating the issue breakdown.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBreakdown()
  }, [owner, repo, issueNumber])

  if (!issue) return null

  const {
    problem_explanation: problem,
    expected_outcome: outcome,
    technical_context: tech,
    implementation_approach: approach,
    edge_cases_and_testing: testing,
    prerequisite_knowledge: prereqs,
    difficulty_assessment: difficulty,
    meta,
  } = breakdownData || {}

  return (
    <>
      <style>{`
        .breakdown-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(4, 7, 18, 0.78);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: modalFadeIn 0.2s ease-out;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .breakdown-modal-window {
          background: var(--surface-solid, #0f172a);
          border: 1px solid var(--border-bright, rgba(255, 255, 255, 0.16));
          border-radius: var(--radius-lg, 18px);
          width: 100%;
          max-width: 920px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.75), var(--shadow-glow);
          overflow: hidden;
          animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalPop {
          from { transform: scale(0.96) translateY(8px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        .breakdown-modal-header {
          padding: 20px 24px;
          background: var(--surface-card, rgba(17, 24, 39, 0.65));
          border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .breakdown-header-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .breakdown-tagline-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--text-muted);
          font-family: 'JetBrains Mono', monospace;
          flex-wrap: wrap;
        }

        .breakdown-badge-ai {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 9999px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%);
          border: 1px solid var(--border-accent);
          color: #a5b4fc;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .breakdown-cached-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 7px;
          border-radius: 6px;
          background: rgba(16, 185, 129, 0.1);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.25);
          font-size: 10.5px;
          font-weight: 600;
        }

        .breakdown-issue-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.4;
          letter-spacing: -0.015em;
          margin: 0;
        }

        .breakdown-close-btn {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .breakdown-close-btn:hover {
          background: var(--surface-hover);
          color: var(--text);
          border-color: var(--border-bright);
        }

        /* Navigation tabs */
        .breakdown-tabs-bar {
          display: flex;
          padding: 0 24px;
          background: rgba(15, 23, 42, 0.5);
          border-bottom: 1px solid var(--border);
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .breakdown-tabs-bar::-webkit-scrollbar {
          display: none;
        }

        .breakdown-tab-btn {
          padding: 12px 14px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .breakdown-tab-btn:hover {
          color: var(--text);
        }

        .breakdown-tab-btn.active {
          color: #ffffff;
          border-bottom-color: var(--primary);
        }

        .breakdown-modal-body {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex: 1;
        }

        /* Bento cards inside tabs */
        .breakdown-bento-card {
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .breakdown-card-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .breakdown-prose {
          font-size: 13.5px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .breakdown-grid-2col {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
        }

        /* Evidence tags */
        .evidence-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.02em;
        }

        .evidence-pill.verified {
          background: rgba(16, 185, 129, 0.12);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .evidence-pill.inferred {
          background: rgba(168, 85, 247, 0.12);
          color: var(--accent-purple);
          border: 1px solid rgba(168, 85, 247, 0.3);
        }

        .evidence-pill.hypothesis {
          background: rgba(245, 158, 11, 0.12);
          color: var(--warning);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        /* Implementation steps */
        .step-timeline-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
        }

        .step-item-card {
          display: flex;
          gap: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 16px;
          position: relative;
        }

        .step-number-bubble {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--primary-gradient);
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 10px var(--primary-glow);
        }

        .step-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .step-heading {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
        }

        .step-details-list {
          margin: 6px 0 0 0;
          padding-left: 18px;
          color: var(--text-muted);
          font-size: 13px;
          line-height: 1.5;
        }

        /* Relevant files list */
        .file-item-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px 14px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }

        .file-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .file-path-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--accent-cyan);
          font-weight: 600;
          word-break: break-all;
        }

        /* Alert / Avoid Box */
        .avoid-box {
          background: rgba(244, 63, 94, 0.07);
          border: 1px solid rgba(244, 63, 94, 0.25);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .avoid-heading {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--danger);
          font-size: 13px;
          font-weight: 700;
        }

        /* Loading Animation */
        .breakdown-loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 18px;
          text-align: center;
        }

        .breakdown-spinner {
          width: 44px;
          height: 44px;
          border: 3px solid rgba(99, 102, 241, 0.15);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
        }

        .loading-step-text {
          font-size: 13px;
          color: var(--text-muted);
          min-height: 20px;
          font-family: 'JetBrains Mono', monospace;
        }

        /* Error state */
        .breakdown-error-state {
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
        }

        .retry-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: var(--radius-sm);
          background: var(--primary-gradient);
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .retry-action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }
      `}</style>

      <div
        className="breakdown-modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="breakdown-title"
      >
        <div className="breakdown-modal-window">
          {/* Header */}
          <div className="breakdown-modal-header">
            <div className="breakdown-header-content">
              <div className="breakdown-tagline-row">
                <span className="breakdown-badge-ai">
                  <Sparkles size={11} />
                  AI Issue Breakdown
                </span>
                <span>•</span>
                <span>#{issueNumber}</span>
                <span>•</span>
                <span>{owner}/{repo}</span>
                {isCached && (
                  <span className="breakdown-cached-pill" title="Loaded from instant cache">
                    <Zap size={10} />
                    Cached
                  </span>
                )}
                {breakdownData && (
                  <DifficultyBadge
                    difficulty={difficulty?.level || issue.difficulty || 'Medium'}
                  />
                )}
              </div>
              <h2 id="breakdown-title" className="breakdown-issue-title">
                {issue.title}
              </h2>
            </div>

            <button
              className="breakdown-close-btn"
              onClick={onClose}
              aria-label="Close issue breakdown"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Tabs (visible once loaded) */}
          {!loading && !error && (
            <div className="breakdown-tabs-bar">
              <button
                className={`breakdown-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <BookOpen size={14} />
                Overview & Outcome
              </button>
              <button
                className={`breakdown-tab-btn ${activeTab === 'technical' ? 'active' : ''}`}
                onClick={() => setActiveTab('technical')}
              >
                <FileCode2 size={14} />
                Technical Context & Files
              </button>
              <button
                className={`breakdown-tab-btn ${activeTab === 'approach' ? 'active' : ''}`}
                onClick={() => setActiveTab('approach')}
              >
                <Terminal size={14} />
                Implementation Steps
              </button>
              <button
                className={`breakdown-tab-btn ${activeTab === 'testing' ? 'active' : ''}`}
                onClick={() => setActiveTab('testing')}
              >
                <ShieldAlert size={14} />
                Edge Cases & Tests
              </button>
              <button
                className={`breakdown-tab-btn ${activeTab === 'prereqs' ? 'active' : ''}`}
                onClick={() => setActiveTab('prereqs')}
              >
                <Layers size={14} />
                Prerequisites & Difficulty
              </button>
            </div>
          )}

          {/* Modal Body */}
          <div className="breakdown-modal-body">
            {loading && (
              <div className="breakdown-loading-state">
                <div className="breakdown-spinner" />
                <div className="loading-title">Generating Maintainer Breakdown</div>
                <div className="loading-step-text">
                  {loadingSteps[loadingStep]}
                </div>
              </div>
            )}

            {error && (
              <div className="breakdown-error-state">
                <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  Unable to Generate Breakdown
                </div>
                <div className="breakdown-prose" style={{ maxWidth: 480 }}>
                  {error}
                </div>
                <button className="retry-action-btn" onClick={() => fetchBreakdown(true)}>
                  <RotateCw size={13} />
                  Retry Analysis
                </button>
              </div>
            )}

            {!loading && !error && breakdownData && (
              <>
                {/* TAB 1: OVERVIEW & OUTCOME */}
                {activeTab === 'overview' && (
                  <>
                    <div
                      className="breakdown-bento-card"
                      style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)',
                        borderLeft: '4px solid var(--primary)',
                      }}
                    >
                      <div className="breakdown-card-title">
                        <Lightbulb size={16} style={{ color: 'var(--primary)' }} />
                        Problem Summary
                      </div>
                      <p className="breakdown-prose" style={{ color: 'var(--text)', fontSize: 14 }}>
                        {problem?.summary}
                      </p>
                    </div>

                    <div className="breakdown-grid-2col">
                      <div className="breakdown-bento-card">
                        <div className="breakdown-card-title" style={{ color: 'var(--danger)' }}>
                          <AlertCircle size={15} />
                          What is Currently Wrong or Missing
                        </div>
                        <p className="breakdown-prose">{problem?.what_is_wrong}</p>
                      </div>

                      <div className="breakdown-bento-card">
                        <div className="breakdown-card-title" style={{ color: 'var(--success)' }}>
                          <CheckCircle2 size={15} />
                          Expected Behavior
                        </div>
                        <p className="breakdown-prose">{problem?.expected_behavior}</p>
                      </div>
                    </div>

                    <div className="breakdown-grid-2col">
                      <div className="breakdown-bento-card">
                        <div className="breakdown-card-title">
                          Why This Issue Matters
                        </div>
                        <p className="breakdown-prose">{problem?.why_it_matters}</p>
                      </div>

                      <div className="breakdown-bento-card">
                        <div className="breakdown-card-title">
                          Developer / User Impact
                        </div>
                        <p className="breakdown-prose">{problem?.impact}</p>
                      </div>
                    </div>

                    {/* Requirements & Criteria */}
                    <div className="breakdown-bento-card">
                      <div className="breakdown-card-title">
                        Requirements & Acceptance Criteria
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                        {outcome?.explicit_requirements?.map((req, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <span className="evidence-pill verified">Verified</span>
                            <span className="breakdown-prose" style={{ color: 'var(--text)' }}>
                              {req.text}
                            </span>
                          </div>
                        ))}

                        {outcome?.inferred_requirements?.map((req, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <span className="evidence-pill inferred">Inferred</span>
                            <span className="breakdown-prose">
                              {req.text}
                            </span>
                          </div>
                        ))}

                        {outcome?.acceptance_criteria?.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <span className={`evidence-pill ${item.evidence_level || 'verified'}`}>
                              {item.evidence_level || 'verified'}
                            </span>
                            <span className="breakdown-prose">
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 2: TECHNICAL CONTEXT & FILES */}
                {activeTab === 'technical' && (
                  <>
                    <div className="breakdown-bento-card">
                      <div className="breakdown-card-title">
                        <Cpu size={16} style={{ color: 'var(--primary)' }} />
                        Core Stack & Technologies
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {tech?.languages?.map((lang, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {lang}
                          </span>
                        ))}
                        {tech?.frameworks_and_libraries?.map((fw, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: 'rgba(168, 85, 247, 0.12)',
                              color: '#c084fc',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {fw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="breakdown-grid-2col">
                      <div className="breakdown-bento-card">
                        <div className="breakdown-card-title">Architectural Concepts</div>
                        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13 }}>
                          {tech?.architectural_concepts?.map((c, i) => (
                            <li key={i} style={{ marginBottom: 4 }}>{c}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="breakdown-bento-card">
                        <div className="breakdown-card-title">Components & Dependencies</div>
                        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13 }}>
                          {tech?.components_involved?.map((comp, i) => (
                            <li key={i} style={{ marginBottom: 4 }}><strong>Component:</strong> {comp}</li>
                          ))}
                          {tech?.dependencies_to_investigate?.map((dep, i) => (
                            <li key={i} style={{ marginBottom: 4 }}><strong>Dependency:</strong> {dep}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Relevant files with grounding verification */}
                    <div className="breakdown-bento-card">
                      <div className="breakdown-card-title">
                        <FileCode2 size={16} />
                        Candidate Source Files & Locations
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {tech?.relevant_files && tech.relevant_files.length > 0 ? (
                          tech.relevant_files.map((file, idx) => (
                            <div key={idx} className="file-item-box">
                              <div className="file-header-row">
                                <span className="file-path-text">{file.file_path}</span>
                                <span className={`evidence-pill ${file.evidence_level}`}>
                                  {file.evidence_level === 'verified' ? 'Verified in Repo' : 'Hypothesis'}
                                </span>
                              </div>
                              <div style={{ fontSize: 12.5, color: 'var(--text)' }}>
                                <strong>Why: </strong>{file.relevance_reason}
                              </div>
                              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                                <strong>Investigate: </strong>{file.investigation_guidance}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="breakdown-prose">
                            No specific file paths verified from repository tree. Refer to project layout.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 3: STEP-BY-STEP IMPLEMENTATION */}
                {activeTab === 'approach' && (
                  <>
                    <div className="breakdown-bento-card">
                      <div className="breakdown-card-title">Maintainer's Recommended Approach</div>
                      <p className="breakdown-prose">{approach?.overview}</p>
                    </div>

                    <div className="step-timeline-container">
                      {approach?.steps?.map((step) => (
                        <div key={step.step_number} className="step-item-card">
                          <div className="step-number-bubble">{step.step_number}</div>
                          <div className="step-content">
                            <div className="step-heading">{step.title}</div>
                            <div className="breakdown-prose">{step.description}</div>
                            {step.details && step.details.length > 0 && (
                              <ul className="step-details-list">
                                {step.details.map((detail, idx) => (
                                  <li key={idx}>{detail}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {approach?.things_to_avoid && approach.things_to_avoid.length > 0 && (
                      <div className="avoid-box">
                        <div className="avoid-heading">
                          <AlertCircle size={15} />
                          Common Pitfalls & Things to Avoid
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13 }}>
                          {approach.things_to_avoid.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {/* TAB 4: EDGE CASES & TESTING */}
                {activeTab === 'testing' && (
                  <>
                    <div className="breakdown-grid-2col">
                      <div className="breakdown-bento-card">
                        <div className="breakdown-card-title">
                          <AlertCircle size={15} style={{ color: 'var(--warning)' }} />
                          Potential Edge Cases
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13 }}>
                          {testing?.edge_cases?.map((ec, idx) => (
                            <li key={idx} style={{ marginBottom: 4 }}>{ec}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="breakdown-bento-card">
                        <div className="breakdown-card-title">
                          <ShieldAlert size={15} style={{ color: 'var(--danger)' }} />
                          Failure Scenarios & Regression Risks
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13 }}>
                          {testing?.failure_scenarios?.map((fs, idx) => (
                            <li key={idx} style={{ marginBottom: 4 }}><strong>Failure: </strong>{fs}</li>
                          ))}
                          {testing?.regression_risks?.map((rr, idx) => (
                            <li key={idx} style={{ marginBottom: 4 }}><strong>Regression Risk: </strong>{rr}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="breakdown-bento-card">
                      <div className="breakdown-card-title">Input Validation & Compatibility</div>
                      <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13 }}>
                        {testing?.input_validation?.map((iv, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}><strong>Validation: </strong>{iv}</li>
                        ))}
                        {testing?.compatibility_considerations?.map((comp, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}><strong>Compatibility: </strong>{comp}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="breakdown-bento-card">
                      <div className="breakdown-card-title">Suggested Test Scenarios</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {testing?.suggested_tests?.map((t, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '10px 14px',
                              background: 'rgba(0,0,0,0.2)',
                              border: '1px solid var(--border)',
                              borderRadius: 6,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>
                                {t.name}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: 'rgba(99, 102, 241, 0.15)',
                                  color: '#a5b4fc',
                                }}
                              >
                                {t.test_type}
                              </span>
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                              {t.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 5: PREREQUISITES & DIFFICULTY */}
                {activeTab === 'prereqs' && (
                  <>
                    <div className="breakdown-grid-2col">
                      <div className="breakdown-bento-card">
                        <div className="breakdown-card-title" style={{ color: 'var(--primary)' }}>
                          Essential Knowledge (Required)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {prereqs?.essential?.map((item, idx) => (
                            <div key={idx}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                                {item.concept}
                              </div>
                              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                                {item.why_it_matters}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="breakdown-bento-card">
                        <div className="breakdown-card-title" style={{ color: '#06b6d4' }}>
                          Helpful Knowledge (Bonus)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {prereqs?.helpful?.map((item, idx) => (
                            <div key={idx}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                                {item.concept}
                              </div>
                              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                                {item.why_it_matters}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="breakdown-bento-card">
                      <div className="breakdown-card-title">
                        Maintainer Difficulty Assessment
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                        <DifficultyBadge difficulty={difficulty?.level || 'Medium'} />
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          Complexity based on scope of changes, dependencies, and testing requirements.
                        </span>
                      </div>
                      <p className="breakdown-prose" style={{ marginTop: 6 }}>
                        {difficulty?.reasoning}
                      </p>
                      {difficulty?.complexity_factors && difficulty.complexity_factors.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {difficulty.complexity_factors.map((f, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: 11,
                                padding: '3px 8px',
                                borderRadius: 6,
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

