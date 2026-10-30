import IssueCard from './IssueCard'

export default function IssueList({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {recommendations.map((issue, i) => (
        <IssueCard key={issue.number ?? i} issue={issue} />
      ))}
    </div>
  )
}

