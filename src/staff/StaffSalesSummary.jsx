import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './StaffSalesSummary.css'

const formatMoney = (value) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const formatNumber = (value) => new Intl.NumberFormat('en-NG').format(Number(value) || 0)

function Icon({ name, size = 21 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const paths = {
    money: (
      <>
        <rect x="2.5" y="5" width="19" height="14" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M6 9h.01M18 15h.01" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    receipt: (
      <>
        <path d="M4 3h16v18l-3-2-3 2-4-2-3 2-3-2z" />
        <path d="M8 8h8M8 12h8M8 16h4" />
      </>
    ),
    boxes: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5M12 13v8" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5M12 15V3" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3" />
      </>
    ),
    trend: (
      <>
        <path d="m3 17 6-6 4 4 8-9" />
        <path d="M15 6h6v6" />
      </>
    ),
  }

  return <svg {...common}>{paths[name] || paths.money}</svg>
}

const EMPTY_TOTALS = {
  totalSales: 0,
  totalTransactions: 0,
  totalItems: 0,
}

export default function StaffSalesSummary() {
  const [report, setReport] = useState({ data: [], totals: EMPTY_TOTALS })
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()

      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const query = params.toString()
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_URL}api/v1/summary${query ? `?${query}` : ''}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to load the staff sales report.')
      }

      const result = payload?.data ?? payload

      setReport({
        data: Array.isArray(result.data) ? result.data : [],
        totals: {
          ...EMPTY_TOTALS,
          ...(result.totals || {}),
        },
      })
    } catch (err) {
      setError(err.message || 'Unable to load the staff sales report.')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const filteredStaff = useMemo(() => {
    const term = search.trim().toLowerCase()

    return report.data.filter((staff) =>
      String(staff.staffName || '')
        .toLowerCase()
        .includes(term),
    )
  }, [report.data, search])

  const topPerformer = useMemo(() => {
    return [...report.data].sort((a, b) => Number(b.totalSales || 0) - Number(a.totalSales || 0))[0]
  }, [report.data])

  const exportCSV = () => {
    const rows = [
      ['Staff Sales Summary'],
      ['Period', startDate || 'All time', endDate || ''],
      [],
      ['Staff Name', 'Total Sales (NGN)', 'Transactions', 'Items Sold'],
      ...filteredStaff.map((staff) => [
        staff.staffName || 'Unknown Staff',
        Number(staff.totalSales || 0).toFixed(2),
        Number(staff.totalTransactions || 0),
        Number(staff.totalItems || 0),
      ]),
      [],
      [
        'TOTAL',
        Number(report.totals.totalSales || 0).toFixed(2),
        Number(report.totals.totalTransactions || 0),
        Number(report.totals.totalItems || 0),
      ],
    ]

    const csv = rows
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n')

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `glamour-staff-sales-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const clearDates = () => {
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="glamour-report">
      <header className="gr-header">
        <div className="gr-brand">
          <div className="gr-brand-mark">G</div>
          <div>
            <div className="gr-brand-name">GLAMOUR</div>
            <div className="gr-brand-caption">UNISEX SALON · MANAGEMENT</div>
          </div>
        </div>

        <div className="gr-header-right">
          <span className="gr-live-dot" />
          <span>SALES ANALYTICS</span>
        </div>
      </header>

      <main className="gr-content">
        <div className="gr-heading-row">
          <div>
            <div className="gr-eyebrow">BUSINESS PERFORMANCE</div>
            <h1>Staff Sales Summary</h1>
            <p className="gr-subtitle">
              Track staff performance, sales revenue and transactions in one place.
            </p>
          </div>

          <button
            type="button"
            className="gr-button gr-button-gold"
            onClick={exportCSV}
            disabled={loading || filteredStaff.length === 0}
          >
            <Icon name="download" size={18} />
            Export Report
          </button>
        </div>

        <section className="gr-filter-panel">
          <div className="gr-filter-title">
            <Icon name="calendar" size={19} />
            <span>Report Filters</span>
          </div>

          <div className="gr-filter-fields">
            <label className="gr-field">
              <span>From date</span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>

            <label className="gr-field">
              <span>To date</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>

            <button
              type="button"
              className="gr-button gr-button-dark"
              onClick={fetchReport}
              disabled={loading || Boolean(startDate && endDate && startDate > endDate)}
            >
              <Icon name="refresh" size={17} />
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>

            <button
              type="button"
              className="gr-button gr-button-plain"
              onClick={clearDates}
              disabled={loading || (!startDate && !endDate)}
            >
              Clear dates
            </button>
          </div>

          <div className="gr-filter-note">
            {startDate || endDate ? (
              <>
                Showing sales
                {startDate ? ` from ${startDate}` : ''}
                {endDate ? ` through ${endDate}` : ''}.
              </>
            ) : (
              'Showing all available dates. Select a date range to narrow the report.'
            )}
          </div>
        </section>

        {error && (
          <div className="gr-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={fetchReport}>
              Try again
            </button>
          </div>
        )}

        <section className="gr-stat-grid">
          <article className="gr-stat-card gr-stat-primary">
            <div className="gr-stat-top">
              <span className="gr-stat-label">Total Staff Sales</span>
              <span className="gr-stat-icon">
                <Icon name="money" size={22} />
              </span>
            </div>
            <div className="gr-stat-value">{formatMoney(report.totals.totalSales)}</div>
            <div className="gr-stat-foot">
              <Icon name="trend" size={15} />
              <span>Revenue attributed to service providers</span>
            </div>
          </article>

          <article className="gr-stat-card">
            <div className="gr-stat-top">
              <span className="gr-stat-label">Staff Members</span>
              <span className="gr-stat-icon">
                <Icon name="users" size={22} />
              </span>
            </div>
            <div className="gr-stat-value">{formatNumber(report.data.length)}</div>
            <div className="gr-stat-foot">Staff included in the report</div>
          </article>

          <article className="gr-stat-card">
            <div className="gr-stat-top">
              <span className="gr-stat-label">Transactions</span>
              <span className="gr-stat-icon">
                <Icon name="receipt" size={22} />
              </span>
            </div>
            <div className="gr-stat-value">{formatNumber(report.totals.totalTransactions)}</div>
            <div className="gr-stat-foot">Completed and approved sales</div>
          </article>

          <article className="gr-stat-card">
            <div className="gr-stat-top">
              <span className="gr-stat-label">Items Sold</span>
              <span className="gr-stat-icon">
                <Icon name="boxes" size={22} />
              </span>
            </div>
            <div className="gr-stat-value">{formatNumber(report.totals.totalItems)}</div>
            <div className="gr-stat-foot">Services and products attributed to staff</div>
          </article>
        </section>

        <section className="gr-table-panel">
          <div className="gr-table-heading">
            <div>
              <h2>Staff Performance</h2>
              <p>Sales breakdown by individual service provider</p>
            </div>

            <div className="gr-search">
              <Icon name="search" size={18} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search staff..."
                aria-label="Search staff"
              />
            </div>
          </div>

          <div className="gr-table-wrap">
            <table className="gr-table">
              <thead>
                <tr>
                  <th>STAFF MEMBER</th>
                  <th className="gr-align-right">TOTAL SALES</th>
                  <th className="gr-align-right">TRANSACTIONS</th>
                  <th className="gr-align-right">ITEMS SOLD</th>
                  <th className="gr-align-right">SALES SHARE</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="gr-state-cell">
                      <span className="gr-spinner" />
                      Loading staff sales...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="gr-state-cell">
                      {error
                        ? 'The report could not be loaded.'
                        : search
                          ? 'No staff members match your search.'
                          : 'No staff sales found for this period.'}
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff, index) => {
                    const sales = Number(staff.totalSales || 0)
                    const totalSales = Number(report.totals.totalSales || 0)
                    const share = totalSales > 0 ? (sales / totalSales) * 100 : 0

                    return (
                      <tr key={staff.staffId ?? staff.staffName ?? index}>
                        <td>
                          <div className="gr-staff-cell">
                            <div className="gr-avatar">
                              {String(staff.staffName || 'S')
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="gr-staff-name">
                                {staff.staffName || 'Unknown Staff'}
                              </div>
                              <div className="gr-staff-meta">Staff ID: {staff.staffId ?? '—'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="gr-align-right gr-money-cell">{formatMoney(sales)}</td>

                        <td className="gr-align-right">{formatNumber(staff.totalTransactions)}</td>

                        <td className="gr-align-right">{formatNumber(staff.totalItems)}</td>

                        <td className="gr-align-right">
                          <div className="gr-share">
                            <span>{share.toFixed(1)}%</span>
                            <div className="gr-share-track">
                              <div
                                className="gr-share-fill"
                                style={{
                                  width: `${Math.min(100, share)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>

              {!loading && filteredStaff.length > 0 && (
                <tfoot>
                  <tr>
                    <td>REPORT TOTAL</td>
                    <td className="gr-align-right">{formatMoney(report.totals.totalSales)}</td>
                    <td className="gr-align-right">
                      {formatNumber(report.totals.totalTransactions)}
                    </td>
                    <td className="gr-align-right">{formatNumber(report.totals.totalItems)}</td>
                    <td className="gr-align-right">
                      {report.totals.totalSales
                        ? `${(
                            (filteredStaff.reduce(
                              (sum, staff) => sum + Number(staff.totalSales || 0),
                              0,
                            ) /
                              Number(report.totals.totalSales)) *
                            100
                          ).toFixed(1)}%`
                        : '0.0%'}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="gr-table-footer">
            <span>
              Showing <strong>{loading ? '—' : filteredStaff.length}</strong> staff member
              {filteredStaff.length === 1 ? '' : 's'}
            </span>
            {topPerformer && (
              <span className="gr-top-performer">
                <span className="gr-crown">★</span>
                Top performer: <strong>{topPerformer.staffName}</strong>
              </span>
            )}
          </div>
        </section>

        <footer className="gr-footer">
          <span>GLAMOUR UNISEX SALON</span>
          <span>STAFF SALES ANALYTICS</span>
        </footer>
      </main>
    </div>
  )
}
