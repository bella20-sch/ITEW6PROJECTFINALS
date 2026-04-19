import { useEffect, useState } from 'react'

export const GRADE_PERIODS = [
  { id: 'prelim', label: 'Prelim' },
  { id: 'midterm', label: 'Midterm' },
  { id: 'finals', label: 'Finals' },
]

export function buildGradeDraft(row) {
  const out = {}
  GRADE_PERIODS.forEach(({ id }) => {
    const p = row.periods[id] || {}
    out[id] = {
      attendancePct: p.attendancePct ?? 0,
      quizPct: p.quizFromPostedActivities ? (p.quizPct ?? 0) : (p.quizManualPct ?? 0),
      examPct: p.examFromPostedActivities ? (p.examPct ?? 0) : (p.examManualPct ?? 0),
    }
  })
  return out
}

export default function FacultyStudentGradeCard({ row, busy, onSavePeriod }) {
  const [draft, setDraft] = useState(() => buildGradeDraft(row))

  useEffect(() => {
    setDraft(buildGradeDraft(row))
  }, [row])

  return (
    <div className="faculty-grade-card">
      <div className="faculty-grade-card-head">
        <h3 className="faculty-grade-card-name">{row.studentName}</h3>
        <div className="faculty-grade-avg-pill" aria-label="Semester average">
          <span className="faculty-grade-avg-pill-label">Semester avg</span>
          <span className="faculty-grade-avg-pill-value">{row.semesterAverage != null ? row.semesterAverage : '—'}</span>
        </div>
      </div>

      <div className="faculty-grade-matrix-scroll">
        <table className="faculty-grade-matrix">
          <thead>
            <tr>
              <th scope="col" className="faculty-grade-matrix-corner">
                Component
              </th>
              {GRADE_PERIODS.map(({ id, label }) => (
                <th key={id} scope="col" className="faculty-grade-matrix-period">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Activities (20%)</th>
              {GRADE_PERIODS.map(({ id }) => {
                const p = row.periods[id] || {}
                return (
                  <td key={id}>
                    <span className="faculty-grade-cell-read">{p.activityPct != null ? `${p.activityPct}%` : '—'}</span>
                  </td>
                )
              })}
            </tr>
            <tr>
              <th scope="row">Attendance (10%)</th>
              {GRADE_PERIODS.map(({ id }) => {
                const d = draft[id] || { attendancePct: 0, quizPct: 0, examPct: 0 }
                return (
                  <td key={id}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="faculty-grade-field"
                      value={d.attendancePct}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          [id]: { ...prev[id], attendancePct: e.target.value },
                        }))
                      }
                    />
                  </td>
                )
              })}
            </tr>
            <tr>
              <th scope="row">
                Quiz (20%)
                <span className="faculty-grade-row-hint">Posted quizzes override manual</span>
              </th>
              {GRADE_PERIODS.map(({ id }) => {
                const p = row.periods[id] || {}
                const d = draft[id] || { attendancePct: 0, quizPct: 0, examPct: 0 }
                return (
                  <td key={id}>
                    {p.quizFromPostedActivities ? (
                      <span className="faculty-grade-cell-read">{p.quizPct ?? '—'}%</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="faculty-grade-field"
                        value={d.quizPct}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [id]: { ...prev[id], quizPct: e.target.value },
                          }))
                        }
                      />
                    )}
                  </td>
                )
              })}
            </tr>
            <tr>
              <th scope="row">
                Exam (50%)
                <span className="faculty-grade-row-hint">Posted exams override manual</span>
              </th>
              {GRADE_PERIODS.map(({ id }) => {
                const p = row.periods[id] || {}
                const d = draft[id] || { attendancePct: 0, quizPct: 0, examPct: 0 }
                return (
                  <td key={id}>
                    {p.examFromPostedActivities ? (
                      <span className="faculty-grade-cell-read">{p.examPct ?? '—'}%</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="faculty-grade-field"
                        value={d.examPct}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [id]: { ...prev[id], examPct: e.target.value },
                          }))
                        }
                      />
                    )}
                  </td>
                )
              })}
            </tr>
            <tr className="faculty-grade-matrix-totals">
              <th scope="row">Period total</th>
              {GRADE_PERIODS.map(({ id }) => {
                const p = row.periods[id] || {}
                return (
                  <td key={id}>
                    <span className="faculty-grade-total">{p.periodTotal != null ? p.periodTotal : '—'}</span>
                  </td>
                )
              })}
            </tr>
            <tr className="faculty-grade-matrix-actions">
              <th scope="row">Save changes</th>
              {GRADE_PERIODS.map(({ id, label }) => {
                const d = draft[id] || { attendancePct: 0, quizPct: 0, examPct: 0 }
                const saving = busy === `${row.studentID}-${id}`
                return (
                  <td key={id}>
                    <button
                      type="button"
                      className="btn btn-outline faculty-grade-save-btn"
                      disabled={saving}
                      onClick={() =>
                        onSavePeriod(row.studentID, id, {
                          attendancePct: d.attendancePct,
                          quizPct: d.quizPct,
                          examPct: d.examPct,
                        })
                      }
                    >
                      {saving ? 'Saving…' : `Save ${label}`}
                    </button>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
