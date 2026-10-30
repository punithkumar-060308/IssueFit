import IssueRow from './IssueRow'

export default function IssueTable({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null

  return (
    <>
      <style>{`
        .table-responsive-wrapper {
          width: 100%;
          overflow-x: auto;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
        }

        .issue-dashboard-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .issue-dashboard-table th {
          background: var(--surface-2);
          padding: 12px 16px;
          font-size: 11px;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }

        .th-center {
          text-align: center;
        }
      `}</style>

      <div className="table-responsive-wrapper">
        <table className="issue-dashboard-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>State</th>
              <th style={{ minWidth: '280px' }}>Name</th>
              <th style={{ minWidth: '150px' }}>Labels</th>
              <th style={{ minWidth: '130px' }}>Repository</th>
              <th style={{ minWidth: '130px' }}>Languages</th>
              <th className="th-center" style={{ width: '90px' }}>Match Score</th>
              <th style={{ width: '90px' }}>Action</th>
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
