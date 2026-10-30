import IssueRow from './IssueRow'

export default function IssueTable({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null

  return (
    <>
      <style>{`
        .table-outer-frame {
          width: 100%;
          overflow-x: auto;
          background: var(--surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-glass);
        }

        .issue-table-aligned {
          width: 100%;
          min-width: 900px;
          table-layout: fixed;
          border-collapse: collapse;
          text-align: left;
        }

        .issue-table-aligned th {
          background: var(--surface-solid);
          padding: 14px 16px;
          font-size: 11px;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
          box-sizing: border-box;
        }

        .th-center {
          text-align: center;
        }
      `}</style>

      <div className="table-outer-frame">
        <table className="issue-table-aligned">
          <colgroup>
            <col style={{ width: '85px' }} />
            <col style={{ width: '38%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '90px' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Status</th>
              <th>Issue Title</th>
              <th>Labels</th>
              <th>Repository</th>
              <th>Language</th>
              <th className="th-center">Score</th>
              <th className="th-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((issue, idx) => (
              <IssueRow key={issue.number || idx} issue={issue} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
