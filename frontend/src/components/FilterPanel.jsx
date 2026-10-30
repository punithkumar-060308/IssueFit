import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

export const DEFAULT_FILTERS = { difficulty: '', label: '', minScore: 0, sort: 'best' }

export default function FilterPanel({ filters, onChange, availableLabels = [] }) {
  const [open, setOpen] = useState(false)

  const hasActive =
    filters.difficulty || filters.label || filters.minScore > 0 || filters.sort !== 'best'

  const update = (key, val) => onChange({ ...filters, [key]: val })
  const reset = () => onChange(DEFAULT_FILTERS)

  return (
    <>
      <style>{`
        .filter-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .filter-toggle {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 7px 14px;
          color: var(--muted); font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.15s;
        }
        .filter-toggle:hover, .filter-toggle.open { border-color: var(--primary); color: var(--primary); }
        .filter-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--primary); flex-shrink: 0;
        }
        .filter-chip {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--primary-muted); border: 1px solid rgba(91,140,255,0.3);
          border-radius: 20px; padding: 3px 10px;
          font-size: 12px; color: var(--primary); font-weight: 500;
        }
        .chip-x {
          background: none; border: none; color: var(--primary);
          display: flex; align-items: center; cursor: pointer; padding: 0;
          line-height: 1;
        }
        .filter-reset {
          background: none; border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 5px 12px;
          color: var(--muted); font-size: 12px; cursor: pointer; transition: all 0.15s;
        }
        .filter-reset:hover { border-color: var(--danger); color: var(--danger); }
        .filter-panel {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 20px; margin-bottom: 16px;
          display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 16px; animation: fadeIn 0.15s ease;
        }
        .fp-group { display: flex; flex-direction: column; gap: 8px; }
        .fp-label {
          font-size: 11px; font-weight: 700; color: var(--muted);
          text-transform: uppercase; letter-spacing: 0.6px;
        }
        .fp-select {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 8px 10px;
          color: var(--text); font-size: 13px; cursor: pointer; width: 100%;
          transition: border-color 0.15s;
        }
        .fp-select:focus { outline: none; border-color: var(--primary); }
        .fp-range { width: 100%; accent-color: var(--primary); }
        .fp-range-val { font-size: 12px; color: var(--primary); font-weight: 600; }
      `}</style>

      <div className="filter-bar">
        <button
          className={`filter-toggle${open ? ' open' : ''}`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <SlidersHorizontal size={14} />
          Filters
          {hasActive && <span className="filter-dot" />}
        </button>

        {filters.difficulty && (
          <span className="filter-chip">
            {filters.difficulty}
            <button className="chip-x" onClick={() => update('difficulty', '')} aria-label="Remove filter">
              <X size={10} />
            </button>
          </span>
        )}
        {filters.label && (
          <span className="filter-chip">
            {filters.label}
            <button className="chip-x" onClick={() => update('label', '')} aria-label="Remove filter">
              <X size={10} />
            </button>
          </span>
        )}
        {filters.minScore > 0 && (
          <span className="filter-chip">
            Score ≥ {filters.minScore}
            <button className="chip-x" onClick={() => update('minScore', 0)} aria-label="Remove filter">
              <X size={10} />
            </button>
          </span>
        )}
        {hasActive && (
          <button className="filter-reset" onClick={reset}>Reset</button>
        )}
      </div>

      {open && (
        <div className="filter-panel">
          <div className="fp-group">
            <label className="fp-label" htmlFor="fp-diff">Difficulty</label>
            <select id="fp-diff" className="fp-select" value={filters.difficulty}
              onChange={(e) => update('difficulty', e.target.value)}>
              <option value="">All</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {availableLabels.length > 0 && (
            <div className="fp-group">
              <label className="fp-label" htmlFor="fp-label">Label</label>
              <select id="fp-label" className="fp-select" value={filters.label}
                onChange={(e) => update('label', e.target.value)}>
                <option value="">All</option>
                {availableLabels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}

          <div className="fp-group">
            <label className="fp-label" htmlFor="fp-score">Min Score</label>
            <span className="fp-range-val">{filters.minScore}</span>
            <input id="fp-score" type="range" className="fp-range"
              min={0} max={100} step={5} value={filters.minScore}
              onChange={(e) => update('minScore', Number(e.target.value))} />
          </div>

          <div className="fp-group">
            <label className="fp-label" htmlFor="fp-sort">Sort</label>
            <select id="fp-sort" className="fp-select" value={filters.sort}
              onChange={(e) => update('sort', e.target.value)}>
              <option value="best">Best Match</option>
              <option value="recent">Recently Updated</option>
            </select>
          </div>
        </div>
      )}
    </>
  )
}

