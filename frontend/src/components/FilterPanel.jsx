import { useState } from 'react'
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react'

export const DEFAULT_FILTERS = {
  difficulty: '',
  label: '',
  language: '',
  minScore: 0,
  sort: 'best',
}

export default function FilterPanel({
  filters,
  onChange,
  availableLabels = [],
  availableLanguages = [],
}) {
  const [isOpen, setIsOpen] = useState(false)

  const activeCount = [
    filters.difficulty,
    filters.label,
    filters.language,
    filters.minScore > 0,
    filters.sort !== 'best',
  ].filter(Boolean).length

  const update = (key, val) => onChange({ ...filters, [key]: val })
  const reset = () => onChange(DEFAULT_FILTERS)

  return (
    <>
      <style>{`
        .filter-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .filter-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 7px 14px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .filter-toggle-btn:hover,
        .filter-toggle-btn.active {
          color: var(--primary);
          border-color: var(--border-active);
          background: var(--primary-muted);
        }

        .filter-active-count {
          background: var(--primary);
          color: #ffffff;
          border-radius: 10px;
          padding: 1px 6px;
          font-size: 11px;
          font-weight: 700;
        }

        .active-filter-chips {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: var(--primary-muted);
          border: 1px solid var(--primary-border);
          color: var(--primary);
          border-radius: 16px;
          padding: 3px 10px;
          font-size: 12px;
          font-weight: 500;
        }

        .filter-chip-remove {
          background: none;
          border: none;
          color: inherit;
          display: flex;
          align-items: center;
          cursor: pointer;
          padding: 0;
        }

        .filter-reset-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 5px 12px;
          color: var(--muted);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .filter-reset-btn:hover {
          color: var(--danger);
          border-color: var(--danger-border);
        }

        .filter-drawer-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px 20px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 16px;
          box-shadow: var(--shadow-sm);
          animation: fadeIn 0.15s ease;
        }

        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-field-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          justify-content: space-between;
        }

        .filter-select-input {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
          color: var(--text);
          font-size: 13px;
          cursor: pointer;
          width: 100%;
          transition: border-color 0.15s ease;
        }

        .filter-select-input:focus {
          outline: none;
          border-color: var(--border-active);
        }

        .filter-range-slider {
          width: 100%;
          accent-color: var(--primary);
          margin-top: 6px;
        }
      `}</style>

      <div className="filter-section">
        <div className="filter-toolbar">
          <button
            type="button"
            className={`filter-toggle-btn${isOpen ? ' active' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {activeCount > 0 && <span className="filter-active-count">{activeCount}</span>}
          </button>

          <div className="active-filter-chips">
            {filters.difficulty && (
              <span className="filter-chip">
                <span>Diff: {filters.difficulty}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => update('difficulty', '')}
                  aria-label="Remove difficulty filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {filters.label && (
              <span className="filter-chip">
                <span>Label: {filters.label}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => update('label', '')}
                  aria-label="Remove label filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {filters.language && (
              <span className="filter-chip">
                <span>Lang: {filters.language}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => update('language', '')}
                  aria-label="Remove language filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {filters.minScore > 0 && (
              <span className="filter-chip">
                <span>Score ≥ {filters.minScore}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => update('minScore', 0)}
                  aria-label="Remove min score filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {filters.sort !== 'best' && (
              <span className="filter-chip">
                <span>Sort: Recently Updated</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => update('sort', 'best')}
                  aria-label="Reset sort"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {activeCount > 0 && (
              <button
                type="button"
                className="filter-reset-btn"
                onClick={reset}
                aria-label="Reset all filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {isOpen && (
          <div className="filter-drawer-card">
            <div className="filter-field">
              <label className="filter-field-label" htmlFor="filter-difficulty">
                Difficulty
              </label>
              <select
                id="filter-difficulty"
                className="filter-select-input"
                value={filters.difficulty}
                onChange={(e) => update('difficulty', e.target.value)}
              >
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {availableLabels.length > 0 && (
              <div className="filter-field">
                <label className="filter-field-label" htmlFor="filter-label">
                  Issue Label
                </label>
                <select
                  id="filter-label"
                  className="filter-select-input"
                  value={filters.label}
                  onChange={(e) => update('label', e.target.value)}
                >
                  <option value="">All Labels</option>
                  {availableLabels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {availableLanguages.length > 0 && (
              <div className="filter-field">
                <label className="filter-field-label" htmlFor="filter-lang">
                  Language
                </label>
                <select
                  id="filter-lang"
                  className="filter-select-input"
                  value={filters.language}
                  onChange={(e) => update('language', e.target.value)}
                >
                  <option value="">All Languages</option>
                  {availableLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="filter-field">
              <label className="filter-field-label" htmlFor="filter-score">
                <span>Min Match Score</span>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  {filters.minScore}
                </span>
              </label>
              <input
                id="filter-score"
                type="range"
                className="filter-range-slider"
                min={0}
                max={100}
                step={5}
                value={filters.minScore}
                onChange={(e) => update('minScore', Number(e.target.value))}
              />
            </div>

            <div className="filter-field">
              <label className="filter-field-label" htmlFor="filter-sort">
                Sort Order
              </label>
              <select
                id="filter-sort"
                className="filter-select-input"
                value={filters.sort}
                onChange={(e) => update('sort', e.target.value)}
              >
                <option value="best">Best Match Score</option>
                <option value="recent">Recently Updated</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
