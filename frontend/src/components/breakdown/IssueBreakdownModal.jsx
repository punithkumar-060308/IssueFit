import { useState, useEffect, useRef } from 'react'
import {
  X,
  Sparkles,
  AlertCircle,
  AlertTriangle,
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
  StopCircle,
} from 'lucide-react'
import DifficultyBadge from '../DifficultyBadge'
import {
  startIssueBreakdown,
  getIssueBreakdownStatus,
  cancelIssueBreakdown,
  getIssueBreakdown,
} from '../../services/issuefitApi'

// In-memory module cache for breakdowns across modal opens
const breakdownCache = new Map()

export default function IssueBreakdownModal({ issue, owner, repo, onClose }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [breakdownData, setBreakdownData] = useState(null)
  const [isCached, setIsCached] = useState(false)
  const [jobStage, setJobStage] = useState('fetching_issue_context')
  const [stageDescription, setStageDescription] = useState('Fetching issue details and discussions from GitHub...')
  const [activeJobId, setActiveJobId] = useState(null)
  const [isCancelled, setIsCancelled] = useState(false)

  const pollTimerRef = useRef(null)
  const isMountedRef = useRef(true)

  const issueNumber = issue?.number
  const cacheKey = `${owner}/${repo}#${issueNumber}`
  const sessionCacheKey = `issuefit_breakdown_${cacheKey}`

  // Close on Escape key
  useEffect(() => {
    isMountedRef.current = true
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      isMountedRef.current = false
      window.removeEventListener('keydown', handleKeyDown)
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
      }
    }
  }, [onClose])

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  const handleCancel = async () => {
    stopPolling()
    if (activeJobId) {
      try {
        await cancelIssueBreakdown(activeJobId)
      } catch {
        // Safe ignore
      }
    }
    if (isMountedRef.current) {
      setLoading(false)
      setIsCancelled(true)
      setActiveJobId(null)
    }
  }

  const pollJobStatus = (jobId) => {
    stopPolling()

    pollTimerRef.current = setInterval(async () => {
      if (!isMountedRef.current) {
        stopPolling()
        return
      }

      try {
        const res = await getIssueBreakdownStatus(jobId)
        if (!isMountedRef.current) return

        if (res?.stage) setJobStage(res.stage)
        if (res?.stage_description) setStageDescription(res.stage_description)

        if (res?.status === 'completed' && res?.breakdown) {
          stopPolling()
          breakdownCache.set(cacheKey, res.breakdown)
          try {
            sessionStorage.setItem(sessionCacheKey, JSON.stringify(res.breakdown))
          } catch {
            // Safe ignore if storage quota exceeded
          }
          setBreakdownData(res.breakdown)
          setIsCached(Boolean(res.cached))
          setLoading(false)
          setActiveJobId(null)
        } else if (res?.status === 'failed') {
          stopPolling()
          setError(res?.error?.message || 'AI service encountered an issue. Please try again.')
          setLoading(false)
          setActiveJobId(null)
        } else if (res?.status === 'cancelled') {
          stopPolling()
          setIsCancelled(true)
          setLoading(false)
          setActiveJobId(null)
        }
      } catch (err) {
        // Transient network error during poll, continue polling until timeout
      }
    }, 850)
  }

  const fetchBreakdown = async (forceRefresh = false) => {
    if (!owner || !repo || !issueNumber) {
      setError('Missing repository or issue parameters.')
      setLoading(false)
      return
    }

    stopPolling()
    setIsCancelled(false)

    // 1. In-memory and session storage cache check (avoids calling API on page refresh)
    if (!forceRefresh) {
      if (breakdownCache.has(cacheKey)) {
        const cached = breakdownCache.get(cacheKey)
        setBreakdownData(cached)
        setIsCached(true)
        setLoading(false)
        return
      }

      try {
        const stored = sessionStorage.getItem(sessionCacheKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed && typeof parsed === 'object') {
            breakdownCache.set(cacheKey, parsed)
            setBreakdownData(parsed)
            setIsCached(true)
            setLoading(false)
            return
          }
        }
      } catch {
        // Safe ignore
      }
    }

    setLoading(true)
    setError(null)
    setJobStage('fetching_issue_context')
    setStageDescription('Fetching issue details and discussions from GitHub...')

    try {
      // Trigger asynchronous background job
      const startRes = await startIssueBreakdown(owner, repo, issueNumber, { forceRefresh })

      if (!isMountedRef.current) return

      if (startRes?.status === 'completed' && startRes?.breakdown) {
        // Immediate completion (backend cache hit)
        breakdownCache.set(cacheKey, startRes.breakdown)
        try {
          sessionStorage.setItem(sessionCacheKey, JSON.stringify(startRes.breakdown))
        } catch {
          // Safe ignore
        }
        setBreakdownData(startRes.breakdown)
        setIsCached(Boolean(startRes.cached))
        setLoading(false)
        return
      }

      if (startRes?.job_id) {
        setActiveJobId(startRes.job_id)
        if (startRes.stage) setJobStage(startRes.stage)
        if (startRes.stage_description) setStageDescription(startRes.stage_description)
        pollJobStatus(startRes.job_id)
      } else {
        throw new Error('Could not initialize analysis job.')
      }
    } catch (err) {
      if (!isMountedRef.current) return
      // Graceful fallback to legacy synchronous breakdown if start endpoint fails
      try {
        const syncRes = await getIssueBreakdown(owner, repo, issueNumber)
        if (syncRes?.success && syncRes?.breakdown) {
          breakdownCache.set(cacheKey, syncRes.breakdown)
          try {
            sessionStorage.setItem(sessionCacheKey, JSON.stringify(syncRes.breakdown))
          } catch {
            // Safe ignore
          }
          setBreakdownData(syncRes.breakdown)
          setIsCached(Boolean(syncRes.cached))
          setLoading(false)
          return
        }
      } catch {
        // Ignore fallback error and present clean user error
      }

      let friendlyMsg = 'An error occurred while generating the issue breakdown.'
      if (err.status === 429) {
        friendlyMsg = 'AI rate limit reached. Please wait a moment and click Retry.'
      } else if (err.status === 503) {
        friendlyMsg = 'AI service is temporarily unavailable. Please retry shortly.'
      } else if (err.status === 504) {
        friendlyMsg = 'Analysis timed out. The repository tree or issue discussion is very large.'
      } else if (err.message) {
        friendlyMsg = err.message
      }
      setError(friendlyMsg)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBreakdown()
    return () => {
      stopPolling()
    }
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

        /* Stage Tracker & Skeletons */
        .stage-tracker-bar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px 18px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }

        .stage-steps-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .stage-step-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 11.5px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-muted);
          border: 1px solid var(--border);
          transition: all 0.2s ease;
        }

        .stage-step-pill.active {
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
          border-color: rgba(99, 102, 241, 0.4);
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.2);
        }

        .stage-step-pill.done {
          background: rgba(16, 185, 129, 0.1);
          color: #6ee7b7;
          border-color: rgba(16, 185, 129, 0.3);
        }

        .stage-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.6;
        }

        .stage-live-desc {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12.5px;
          color: var(--text-muted);
        }

        .breakdown-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 8px var(--primary);
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(0.9); opacity: 1; }
        }

        .cancel-analysis-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: transparent;
          border: 1px solid rgba(244, 63, 94, 0.3);
          color: var(--danger);
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-analysis-btn:hover {
          background: rgba(244, 63, 94, 0.1);
          border-color: var(--danger);
        }

        /* Shimmer Skeletons */
        .breakdown-skeleton-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }

        .skeleton-card {
          border-radius: var(--radius-md);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.08) 50%,
            rgba(255, 255, 255, 0.03) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.8s infinite;
          border: 1px solid var(--border);
        }

        .skeleton-banner {
          height: 90px;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* Fallback Banner */
        .breakdown-fallback-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: var(--radius-sm);
        }

        .breakdown-fallback-retry-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.4);
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .breakdown-fallback-retry-btn:hover {
          background: rgba(245, 158, 11, 0.25);
        }

        /* Learning Resource Cards */
        .learning-resource-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px 14px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .learning-resource-card:hover {
          border-color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.04);
          transform: translateY(-1px);
        }

        .learning-resource-type-pill {
          display: inline-block;
          align-self: flex-start;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(6, 182, 212, 0.12);
          color: var(--accent-cyan);
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

        @media (max-width: 640px) {
          .breakdown-modal-backdrop {
            padding: 8px 6px;
            align-items: flex-end;
          }

          .breakdown-modal-window {
            max-height: 94vh;
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          }

          .breakdown-modal-header {
            padding: 14px 16px;
            gap: 10px;
          }

          .breakdown-issue-title {
            font-size: 15px;
          }

          .breakdown-tabs-bar {
            padding: 0 10px;
          }

          .breakdown-tab-btn {
            padding: 10px 8px;
            font-size: 12px;
            gap: 5px;
          }

          .breakdown-modal-body {
            padding: 14px 12px;
            gap: 14px;
          }

          .breakdown-grid-2col {
            grid-template-columns: 1fr;
          }

          .step-item-card {
            gap: 10px;
            padding: 12px;
          }

          .step-number-bubble {
            width: 26px;
            height: 26px;
            font-size: 11px;
          }

          .file-item-box {
            padding: 10px 12px;
          }
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
              <div className="breakdown-skeleton-container">
                <div className="stage-tracker-bar">
                  <div className="stage-steps-row">
                    {[
                      { key: 'fetching_issue_context', label: '1. Issue Context' },
                      { key: 'inspecting_repository', label: '2. Codebase Tree' },
                      { key: 'synthesizing_ai_breakdown', label: '3. AI Synthesis' },
                      { key: 'validating_and_grounding', label: '4. Grounding' },
                    ].map((s) => {
                      const stages = ['fetching_issue_context', 'inspecting_repository', 'synthesizing_ai_breakdown', 'validating_and_grounding', 'completed']
                      const currentIdx = stages.indexOf(jobStage)
                      const thisIdx = stages.indexOf(s.key)
                      const isDone = currentIdx > thisIdx
                      const isActive = currentIdx === thisIdx
                      return (
                        <div key={s.key} className={`stage-step-pill ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                          {isDone ? <Check size={11} /> : <span className="stage-dot" />}
                          <span>{s.label}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div className="stage-live-desc">
                      <div className="breakdown-pulse-dot" />
                      <span>{stageDescription || 'Analyzing issue context...'}</span>
                    </div>
                    <button className="cancel-analysis-btn" onClick={handleCancel}>
                      <StopCircle size={13} />
                      Cancel Analysis
                    </button>
                  </div>
                </div>

                {/* Shimmer layout */}
                <div className="skeleton-card skeleton-banner" />
                <div className="breakdown-grid-2col">
                  <div className="skeleton-card" style={{ height: 120 }} />
                  <div className="skeleton-card" style={{ height: 120 }} />
                </div>
                <div className="breakdown-grid-2col">
                  <div className="skeleton-card" style={{ height: 90 }} />
                  <div className="skeleton-card" style={{ height: 90 }} />
                </div>
                <div className="skeleton-card" style={{ height: 130 }} />
              </div>
            )}

            {isCancelled && !loading && (
              <div className="breakdown-error-state">
                <StopCircle size={40} style={{ color: 'var(--text-muted)' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  Analysis Cancelled
                </div>
                <div className="breakdown-prose" style={{ maxWidth: 460 }}>
                  The analysis job was cancelled. You can restart it at any time.
                </div>
                <button className="retry-action-btn" onClick={() => fetchBreakdown(true)}>
                  <RotateCw size={13} />
                  Restart Analysis
                </button>
              </div>
            )}

            {error && !loading && (
              <div className="breakdown-error-state">
                <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  Unable to Complete Analysis
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

            {!loading && !error && !isCancelled && breakdownData && (
              <>
                {/* Fallback Banner */}
                {breakdownData.is_fallback && (
                  <div className="breakdown-fallback-banner">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                      <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fde68a' }}>
                          Deterministic Grounded Fallback Mode
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {breakdownData.fallback_reason || 'AI service is temporarily unavailable. This plan was deterministically synthesized from verified repository files and tests.'}
                        </div>
                      </div>
                    </div>
                    <button className="breakdown-fallback-retry-btn" onClick={() => fetchBreakdown(true)}>
                      <RotateCw size={12} />
                      Try AI Again
                    </button>
                  </div>
                )}
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

                    {/* Potential Challenges & Pitfalls */}
                    {breakdownData?.potential_challenges && breakdownData.potential_challenges.length > 0 && (
                      <div className="breakdown-bento-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                        <div className="breakdown-card-title" style={{ color: '#f59e0b' }}>
                          <AlertTriangle size={15} />
                          Potential Challenges & Pitfalls
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {breakdownData.potential_challenges.map((challenge, idx) => (
                            <li key={idx}>
                              <span style={{ color: 'var(--text)' }}>{challenge}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Relevant Learning Resources */}
                    {breakdownData?.learning_resources && breakdownData.learning_resources.length > 0 && (
                      <div className="breakdown-bento-card">
                        <div className="breakdown-card-title" style={{ color: 'var(--accent-cyan)' }}>
                          <BookOpen size={15} />
                          Relevant Learning Resources
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                          {breakdownData.learning_resources.map((res, idx) => (
                            <a
                              key={idx}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="learning-resource-card"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                                  {res.title}
                                </span>
                                <ExternalLink size={12} style={{ color: 'var(--accent-cyan)' }} />
                              </div>
                              <span className="learning-resource-type-pill">
                                {res.resource_type}
                              </span>
                              {res.description && (
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                                  {res.description}
                                </p>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
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

