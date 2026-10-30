import { useRef } from 'react'
import { Search, X } from 'lucide-react'

export default function GlobalSearch({ searchQuery, onSearchChange }) {
  const inputRef = useRef(null)

  return (
    <>
      <style>{`
        .global-search-container {
          position: relative;
          width: 100%;
          max-width: 320px;
        }

        .global-search-input {
          width: 100%;
          height: 36px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0 32px 0 34px;
          font-size: 13px;
          color: var(--text);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .global-search-input::placeholder {
          color: var(--muted);
          opacity: 0.8;
        }

        .global-search-input:focus {
          outline: none;
          border-color: var(--border-active);
          box-shadow: 0 0 0 3px var(--primary-muted);
        }

        .global-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          pointer-events: none;
        }

        .global-search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 2px;
          color: var(--muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: var(--radius-xs);
        }

        .global-search-clear:hover {
          color: var(--text);
        }

        .search-shortcut-badge {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          font-weight: 600;
          color: var(--muted);
          background: var(--tag-bg);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 1px 5px;
          pointer-events: none;
        }

        @media (max-width: 820px) {
          .global-search-container {
            max-width: 200px;
          }
          .search-shortcut-badge {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .global-search-container {
            display: none;
          }
        }
      `}</style>

      <div className="global-search-container">
        <Search size={15} className="global-search-icon" />
        <input
          ref={inputRef}
          type="search"
          className="global-search-input"
          placeholder="Filter issues, labels, repos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Global search filter"
        />
        {searchQuery ? (
          <button
            type="button"
            className="global-search-clear"
            onClick={() => {
              onSearchChange('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : (
          <span className="search-shortcut-badge">/</span>
        )}
      </div>
    </>
  )
}

