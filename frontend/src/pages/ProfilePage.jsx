import { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  FileText,
  Code2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { startGitHubConnect } from '../services/authApi'

const POPULAR_SKILLS = [
  'Python',
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Go',
  'Rust',
  'Java',
  'C++',
  'Docker',
  'FastAPI',
  'PostgreSQL',
]

export default function ProfilePage() {
  const { user, updateUserProfile } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    location: '',
    bio: '',
    experience_level: 'Beginner',
    skills: [],
  })

  const [newSkill, setNewSkill] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        dob: user.dob || '',
        location: user.location || '',
        bio: user.bio || '',
        experience_level: user.experience_level || 'Beginner',
        skills: Array.isArray(user.skills) ? user.skills : [],
      })
    }
  }, [user])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSuccessMsg('')
    setErrorMsg('')
  }

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || newSkill).trim()
    if (!trimmed) return
    if (!formData.skills.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }))
    }
    setNewSkill('')
    setSuccessMsg('')
  }

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }))
    setSuccessMsg('')
  }

  const handleReset = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        dob: user.dob || '',
        location: user.location || '',
        bio: user.bio || '',
        experience_level: user.experience_level || 'Beginner',
        skills: Array.isArray(user.skills) ? user.skills : [],
      })
    }
    setSuccessMsg('')
    setErrorMsg('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      await updateUserProfile(formData)
      setSuccessMsg('Your profile has been updated successfully!')
      setTimeout(() => {
        setSuccessMsg('')
      }, 4000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return null
  }

  const isGitHubConnected = Boolean(user.github?.connected)

  return (
    <div className="profile-page-root">
      <style>{`
        .profile-page-root {
          max-width: 880px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .profile-card {
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 28px;
          box-shadow: var(--shadow-card);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .profile-hero {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .profile-avatar-large {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--border-bright);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.25);
          background: var(--primary-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        .profile-hero-meta {
          flex: 1;
          min-width: 220px;
        }

        .profile-hero-name {
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 6px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .profile-hero-email {
          font-size: 14px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }

        .profile-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-pill.verified {
          background: var(--success-bg);
          border: 1px solid var(--success-glow);
          color: var(--success);
        }

        .badge-pill.github {
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: var(--primary);
        }

        .badge-pill.warning {
          background: var(--warning-bg);
          border: 1px solid var(--warning-glow);
          color: var(--warning);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .section-header h2 {
          font-size: 17px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
        }

        .section-header p {
          font-size: 13px;
          color: var(--text-muted);
          margin: 2px 0 0 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 11px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text);
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s ease;
          outline: none;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
          background: var(--surface-hover);
        }

        .form-input[readonly] {
          opacity: 0.7;
          cursor: not-allowed;
          background: var(--surface-subtle, rgba(0,0,0,0.15));
        }

        .form-hint {
          font-size: 12px;
          color: var(--text-subtle);
          margin-top: 2px;
        }

        .skills-tag-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
          min-height: 38px;
          padding: 8px;
          border: 1px dashed var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface);
        }

        .skill-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.35);
          color: var(--text);
          border-radius: var(--radius-xs);
          font-size: 12px;
          font-weight: 600;
        }

        .skill-remove-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 0 2px;
        }

        .skill-remove-btn:hover {
          color: var(--danger);
        }

        .skill-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .skill-suggestion-chip {
          padding: 3px 8px;
          background: var(--surface-hover);
          border: 1px solid var(--border);
          border-radius: 9999px;
          color: var(--text-muted);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .skill-suggestion-chip:hover {
          color: var(--text);
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.12);
        }

        .skill-input-row {
          display: flex;
          gap: 8px;
        }

        .skill-input-row button {
          flex-shrink: 0;
          padding: 0 16px;
          background: var(--surface-hover);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .skill-input-row button:hover {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }

        .status-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          animation: fadeIn 0.2s ease;
        }

        .status-banner.success {
          background: var(--success-bg);
          border: 1px solid var(--success-glow);
          color: var(--success);
        }

        .status-banner.error {
          background: var(--danger-bg);
          border: 1px solid var(--danger-glow);
          color: var(--danger);
        }

        .form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--border-subtle);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: var(--surface-hover);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          color: var(--text);
          border-color: var(--border-bright);
        }

        .btn-primary-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          background: var(--primary-gradient);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: var(--radius-sm);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
          transition: all 0.2s ease;
        }

        .btn-primary-action:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        }

        .btn-primary-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .github-connect-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          flex-wrap: wrap;
          gap: 12px;
        }

        .github-connect-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Hero Header Card */}
      <section className="profile-card">
        <div className="profile-hero">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || 'User'}
              className="profile-avatar-large"
            />
          ) : (
            <div className="profile-avatar-large">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="profile-hero-meta">
            <h1 className="profile-hero-name">
              {user.name || 'Anonymous Contributor'}
            </h1>
            <div className="profile-hero-email">
              <Mail size={15} />
              <span>{user.email || 'No email attached'}</span>
            </div>
            <div className="profile-badges">
              <span className="badge-pill verified">
                <ShieldCheck size={13} />
                <span>Verified Account</span>
              </span>
              {isGitHubConnected ? (
                <span className="badge-pill github">
                  <Code2 size={13} />
                  <span>GitHub @{user.github.username}</span>
                </span>
              ) : (
                <span className="badge-pill warning">
                  <span>GitHub Not Linked</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Status Banners */}
      {successMsg && (
        <div className="status-banner success" role="alert">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="status-banner error" role="alert">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="profile-card">
        <div className="section-header">
          <div>
            <h2>Personal Information</h2>
            <p>Update your public identity, contact details, and birth date.</p>
          </div>
        </div>

        <div className="form-grid">
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="user-fullname">
              <User size={15} />
              <span>Full Name</span>
            </label>
            <input
              id="user-fullname"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
            />
          </div>

          {/* Email (Read-only) */}
          <div className="form-group">
            <label className="form-label" htmlFor="user-email">
              <Mail size={15} />
              <span>Email Address</span>
            </label>
            <input
              id="user-email"
              type="email"
              className="form-input"
              value={user.email || ''}
              readOnly
              title="Email is managed by your sign-in provider"
            />
            <span className="form-hint">Provided by your OAuth account</span>
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label" htmlFor="user-phone">
              <Phone size={15} />
              <span>Phone Number</span>
            </label>
            <input
              id="user-phone"
              type="tel"
              className="form-input"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="e.g. +1 (555) 234-5678"
            />
            <span className="form-hint">For contact and notification updates</span>
          </div>

          {/* Date of Birth */}
          <div className="form-group">
            <label className="form-label" htmlFor="user-dob">
              <Calendar size={15} />
              <span>Date of Birth</span>
            </label>
            <input
              id="user-dob"
              type="date"
              className="form-input"
              value={formData.dob}
              onChange={(e) => handleInputChange('dob', e.target.value)}
            />
            <span className="form-hint">Your birth date (YYYY-MM-DD)</span>
          </div>
        </div>

        {/* Developer Profile & Preferences */}
        <div className="section-header" style={{ marginTop: '32px' }}>
          <div>
            <h2>Developer Profile & Match Preferences</h2>
            <p>Help IssueFit tailor issue difficulty and recommendation scores.</p>
          </div>
        </div>

        <div className="form-grid">
          {/* Location */}
          <div className="form-group">
            <label className="form-label" htmlFor="user-location">
              <MapPin size={15} />
              <span>Location / Timezone</span>
            </label>
            <input
              id="user-location"
              type="text"
              className="form-input"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g. San Francisco, CA or Bengaluru, IN"
            />
          </div>

          {/* Experience Level */}
          <div className="form-group">
            <label className="form-label" htmlFor="user-experience">
              <Briefcase size={15} />
              <span>Experience Level</span>
            </label>
            <select
              id="user-experience"
              className="form-select"
              value={formData.experience_level}
              onChange={(e) => handleInputChange('experience_level', e.target.value)}
            >
              <option value="Beginner">Beginner (0 - 1 year)</option>
              <option value="Intermediate">Intermediate (2 - 4 years)</option>
              <option value="Advanced">Advanced (5+ years)</option>
            </select>
          </div>

          {/* Bio / About */}
          <div className="form-group full-width">
            <label className="form-label" htmlFor="user-bio">
              <FileText size={15} />
              <span>About You (Bio)</span>
            </label>
            <textarea
              id="user-bio"
              className="form-textarea"
              rows={3}
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell other open-source contributors about your background, project interests, and goals..."
            />
          </div>

          {/* Preferred Tech Stack / Skills */}
          <div className="form-group full-width">
            <label className="form-label">
              <Code2 size={15} />
              <span>Preferred Technologies & Languages</span>
            </label>

            <div className="skills-tag-container">
              {formData.skills.length === 0 ? (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  No skills selected yet. Add skills below to improve issue matching.
                </span>
              ) : (
                formData.skills.map((skill) => (
                  <span key={skill} className="skill-tag">
                    {skill}
                    <button
                      type="button"
                      className="skill-remove-btn"
                      onClick={() => handleRemoveSkill(skill)}
                      title={`Remove ${skill}`}
                    >
                      &times;
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="skill-input-row">
              <input
                type="text"
                className="form-input"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSkill()
                  }
                }}
                placeholder="Add a language or tool (e.g. Next.js, Kubernetes)"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
              >
                Add
              </button>
            </div>

            <div className="skill-suggestions">
              <span style={{ fontSize: '11px', color: 'var(--text-subtle)', alignSelf: 'center' }}>
                Quick suggestions:
              </span>
              {POPULAR_SKILLS.filter((s) => !formData.skills.includes(s)).slice(0, 8).map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className="skill-suggestion-chip"
                  onClick={() => handleAddSkill(skill)}
                >
                  +{skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* GitHub Linked Account Info */}
        <div className="section-header" style={{ marginTop: '32px' }}>
          <div>
            <h2>Connected Accounts</h2>
            <p>Connect your GitHub profile to unlock personalized repository recommendations.</p>
          </div>
        </div>

        <div className="github-connect-box">
          <div className="github-connect-meta">
            <Code2 size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                GitHub Integration
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {isGitHubConnected
                  ? `Connected as @${user.github.username}`
                  : 'Link your GitHub account to access your repositories and star radar.'}
              </div>
            </div>
          </div>

          {isGitHubConnected ? (
            <a
              href={user.github.profile_url || `https://github.com/${user.github.username}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              <span>View Profile</span>
              <ExternalLink size={14} />
            </a>
          ) : (
            <button
              type="button"
              className="btn-primary-action"
              onClick={startGitHubConnect}
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              Connect GitHub
            </button>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>
          <button
            type="submit"
            className="btn-primary-action"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
