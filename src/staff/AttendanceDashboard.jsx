
import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormSelect,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'
import {
  cilPeople,
  cilClock,
  cilWarning,
  cilUserFollow,
  cilUserUnfollow,
  cilHistory,
  cilSpeedometer,
  cilReload,
  cilArrowRight,
  cilSearch,
} from '@coreui/icons'

const AttendanceDashboard = () => {
  const API_URL = `${(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')}/api/v1`

  const [kpis, setKpis] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [activities, setActivities] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedStaff, setSelectedStaff] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  // =====================================================
  // FETCH DASHBOARD
  // =====================================================

  const fetchDashboard = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      const token = localStorage.getItem('token')

      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'application/json',
      }

      const [kpiResponse, attendanceResponse, activityResponse] = await Promise.all([
        axios.get(`${API_URL}/attendance/dashboard`, { headers }),
        axios.get(`${API_URL}/attendance/today`, { headers }),
        axios.get(`${API_URL}/attendance/activities?limit=50`, { headers }),
      ])

      setKpis(kpiResponse.data?.data || {})

      setAttendance(
        Array.isArray(attendanceResponse.data?.data)
          ? attendanceResponse.data.data
          : [],
      )

      setActivities(
        Array.isArray(activityResponse.data?.data)
          ? activityResponse.data.data
          : [],
      )
    } catch (err) {
      console.error('ATTENDANCE DASHBOARD ERROR:', err)

      setError(
        err.response?.data?.message ||
          'Unable to load attendance dashboard. Please try again.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [API_URL])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // =====================================================
  // STAFF IDENTIFICATION
  // =====================================================

  const getStaffId = (item) => {
    return (
      item?.staffId ||
      item?.Staff?.id ||
      item?.staff?.id ||
      item?.staff_id ||
      item?.id
    )
  }

  const getStaffName = (item) => {
    return (
      item?.Staff?.User?.fullname ||
      item?.Staff?.fullname ||
      item?.staff?.User?.fullname ||
      item?.staff?.fullname ||
      item?.User?.fullname ||
      'Unknown Staff'
    )
  }

  const getStaffPosition = (item) => {
    return (
      item?.Staff?.position ||
      item?.staff?.position ||
      item?.position ||
      '--'
    )
  }

  // =====================================================
  // REMOVE DUPLICATE ATTENDANCE RECORDS
  // One record per staff member per attendance date.
  // The most recently updated record is retained.
  // =====================================================

  const uniqueAttendance = useMemo(() => {
    const records = new Map()

    const getRecordTimestamp = (item) => {
      const date =
        item?.updatedAt ||
        item?.createdAt ||
        item?.clockIn ||
        item?.attendanceDate

      const timestamp = date ? new Date(date).getTime() : 0

      return Number.isNaN(timestamp) ? 0 : timestamp
    }

    attendance.forEach((item) => {
      const staffId = getStaffId(item)

      const attendanceDate = item?.attendanceDate
        ? new Date(item.attendanceDate).toISOString().slice(0, 10)
        : 'unknown-date'

      const uniqueKey = `${staffId}-${attendanceDate}`

      const existing = records.get(uniqueKey)

      if (!existing || getRecordTimestamp(item) >= getRecordTimestamp(existing)) {
        records.set(uniqueKey, item)
      }
    })

    return Array.from(records.values())
  }, [attendance])

  // =====================================================
  // REMOVE DUPLICATE ACTIVITY IDS
  // =====================================================

  const uniqueActivities = useMemo(() => {
    const seen = new Set()

    return activities.filter((activity) => {
      const key = activity?.id

      if (key === undefined || key === null) return true
      if (seen.has(key)) return false

      seen.add(key)
      return true
    })
  }, [activities])

  // =====================================================
  // DATE AND TIME FORMATTING
  // =====================================================

  const formatTime = (date) => {
    if (!date) return '--'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) return '--'

    return parsedDate.toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDateTime = (date) => {
    if (!date) return '--'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) return '--'

    return parsedDate.toLocaleString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatFullDate = (date) => {
    if (!date) return '--'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) return '--'

    return parsedDate.toLocaleDateString('en-NG', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const today = formatFullDate(new Date())

  // =====================================================
  // ATTENDANCE STATUS
  // =====================================================

  const getStatusBadge = (status) => {
    const normalizedStatus = String(status || '').toLowerCase()

    switch (normalizedStatus) {
      case 'present':
        return <CBadge color="success" className="status-badge">Present</CBadge>

      case 'late':
        return <CBadge color="warning" className="status-badge">Late</CBadge>

      case 'absent':
        return <CBadge color="danger" className="status-badge">Absent</CBadge>

      default:
        return (
          <CBadge color="secondary" className="status-badge">
            {status || 'Unknown'}
          </CBadge>
        )
    }
  }

  // =====================================================
  // LIVE STAFF STATUS
  // =====================================================

  const getLiveStatus = (item) => {
    if (item.clockOut) {
      return {
        label: 'Clocked Out',
        color: 'secondary',
        key: 'clockedout',
      }
    }

    const outside = uniqueActivities.some(
      (activity) =>
        String(activity.recordId) === String(item.id) &&
        String(activity.action || '').toUpperCase() === 'GO_OUT',
    )

    if (outside) {
      return {
        label: 'Outside',
        color: 'warning',
        key: 'out',
      }
    }

    if (item.clockIn) {
      return {
        label: 'Inside',
        color: 'success',
        key: 'in',
      }
    }

    return {
      label: 'Not Clocked In',
      color: 'danger',
      key: 'notclocked',
    }
  }

  // =====================================================
  // FILTER ATTENDANCE
  // Filters: All, Late, Present, Absent, Out, In
  // =====================================================

  const filteredAttendance = useMemo(() => {
    return uniqueAttendance.filter((item) => {
      const fullname = getStaffName(item).toLowerCase()
      const position = getStaffPosition(item).toLowerCase()
      const email = (item?.Staff?.User?.email || '').toLowerCase()
      const searchValue = search.trim().toLowerCase()

      const matchesSearch =
        fullname.includes(searchValue) ||
        position.includes(searchValue) ||
        email.includes(searchValue)

      const attendanceStatus = String(item.status || '').toLowerCase()
      const liveStatus = getLiveStatus(item)

      let matchesStatus = true

      switch (statusFilter) {
        case 'late':
          matchesStatus = attendanceStatus === 'late'
          break

        case 'present':
          matchesStatus = attendanceStatus === 'present'
          break

        case 'absent':
          matchesStatus = attendanceStatus === 'absent'
          break

        case 'out':
          matchesStatus = liveStatus.key === 'out'
          break

        case 'in':
          matchesStatus = liveStatus.key === 'in'
          break

        default:
          matchesStatus = true
      }

      return matchesSearch && matchesStatus
    })
  }, [uniqueAttendance, search, statusFilter, uniqueActivities])

  // =====================================================
  // LIVE STATUS LIST
  // =====================================================

  const liveStaff = useMemo(() => {
    return uniqueAttendance.map((item) => ({
      ...item,
      liveStatus: getLiveStatus(item),
    }))
  }, [uniqueAttendance, uniqueActivities])

  // =====================================================
  // FILTER BUTTONS
  // =====================================================

  const filterOptions = [
    { value: 'all', label: 'All Staff' },
    { value: 'late', label: 'Late' },
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'out', label: 'Out' },
    { value: 'in', label: 'In' },
  ]

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {
    return (
      <div className="attendance-loading">
        <div className="text-center">
          <div className="luxury-loader">
            <CSpinner />
          </div>
          <h6 className="mt-3 fw-semibold">Preparing Attendance Dashboard</h6>
          <small className="text-muted">Please wait...</small>
        </div>
      </div>
    )
  }

  // =====================================================
  // MAIN DASHBOARD
  // =====================================================

  return (
    <div className="attendance-dashboard">

      <style>{`
        .attendance-dashboard {
          --luxury-dark: #171717;
          --luxury-gold: #b99a5b;
          --luxury-gold-light: #f5efdf;
          --luxury-border: #e9e5dc;
          --luxury-muted: #77736b;
          color: #252525;
          padding: 12px 5px 40px;
        }

        .attendance-dashboard .luxury-header {
          background: linear-gradient(115deg, #171717 0%, #29251e 100%);
          border-radius: 17px;
          padding: 27px 30px;
          color: #fff;
          position: relative;
          overflow: hidden;
          margin-bottom: 25px;
        }

        .attendance-dashboard .luxury-header:after {
          content: '';
          position: absolute;
          width: 230px;
          height: 230px;
          border: 1px solid rgba(201,171,111,.22);
          border-radius: 50%;
          right: -65px;
          top: -110px;
          box-shadow: 0 0 0 25px rgba(201,171,111,.035),
                      0 0 0 50px rgba(201,171,111,.025);
          pointer-events: none;
        }

        .attendance-dashboard .header-kicker {
          color: #d2b77e;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 10px;
          font-weight: 800;
          margin-bottom: 7px;
        }

        .attendance-dashboard .luxury-header h3 {
          color: #fff;
          font-weight: 750;
          letter-spacing: -.5px;
          margin-bottom: 5px;
        }

        .attendance-dashboard .luxury-header .header-subtitle {
          color: #c8c3b9;
          font-size: 13px;
        }

        .attendance-dashboard .header-date {
          color: #d9c69f;
          font-size: 12px;
          margin-top: 13px;
        }

        .attendance-dashboard .luxury-refresh {
          background: #c3a46a;
          border: 1px solid #c3a46a;
          color: #171717;
          font-weight: 700;
          border-radius: 9px;
          padding: 10px 17px;
          position: relative;
          z-index: 1;
        }

        .attendance-dashboard .luxury-refresh:hover {
          background: #d5ba83;
          border-color: #d5ba83;
          color: #171717;
        }

        .attendance-dashboard .luxury-card {
          border: 1px solid var(--luxury-border) !important;
          border-radius: 14px !important;
          box-shadow: 0 4px 18px rgba(25,25,25,.035) !important;
          background: #fff;
          height: 100%;
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .attendance-dashboard .luxury-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(25,25,25,.07) !important;
        }

        .attendance-dashboard .kpi-icon {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 13px;
        }

        .attendance-dashboard .kpi-title {
          font-size: 11px;
          font-weight: 750;
          color: #77736b;
          text-transform: uppercase;
          letter-spacing: .65px;
        }

        .attendance-dashboard .kpi-value {
          font-size: 26px;
          line-height: 1.2;
          font-weight: 800;
          color: #242424;
          margin: 3px 0;
        }

        .attendance-dashboard .kpi-subtitle {
          font-size: 11px;
          color: #96918a;
        }

        .attendance-dashboard .section-card {
          border: 1px solid var(--luxury-border);
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(25,25,25,.035);
          background: #fff;
        }

        .attendance-dashboard .section-heading {
          font-size: 16px;
          font-weight: 800;
          color: #242424;
          margin-bottom: 3px;
        }

        .attendance-dashboard .section-description {
          font-size: 12px;
          color: #89847c;
        }

        .attendance-dashboard .section-header {
          padding: 19px 21px;
          border-bottom: 1px solid #f0ede7;
          background: #fff;
        }

        .attendance-dashboard .luxury-input {
          border: 1px solid #e5e0d6;
          border-radius: 9px;
          min-height: 41px;
          font-size: 13px;
          box-shadow: none !important;
        }

        .attendance-dashboard .luxury-input:focus {
          border-color: var(--luxury-gold);
        }

        .attendance-dashboard .filter-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          padding: 14px 20px;
          background: #fcfbf9;
          border-bottom: 1px solid #f0ede7;
        }

        .attendance-dashboard .filter-button {
          border: 1px solid #e7e2d8;
          color: #666158;
          background: #fff;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          padding: 7px 13px;
          transition: all .2s ease;
        }

        .attendance-dashboard .filter-button:hover {
          border-color: var(--luxury-gold);
          color: #8e713c;
        }

        .attendance-dashboard .filter-button.active {
          background: #24221e;
          border-color: #24221e;
          color: #e2c68d;
        }

        .attendance-dashboard .luxury-table {
          min-width: 900px;
        }

        .attendance-dashboard .luxury-table thead th {
          background: #f8f7f4;
          color: #777168;
          border-bottom: 1px solid #eae6de;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .65px;
          padding: 14px 15px;
          white-space: nowrap;
        }

        .attendance-dashboard .luxury-table tbody td {
          padding: 15px;
          border-color: #f1eee9;
          font-size: 12px;
          color: #514e48;
          vertical-align: middle;
        }

        .attendance-dashboard .luxury-table tbody tr:hover {
          background: #fcfbf8;
        }

        .attendance-dashboard .staff-avatar {
          width: 39px;
          height: 39px;
          min-width: 39px;
          border-radius: 11px;
          background: #24221e;
          color: #d7bd85;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 800;
          margin-right: 11px;
        }

        .attendance-dashboard .staff-name {
          font-size: 12px;
          font-weight: 800;
          color: #292929;
        }

        .attendance-dashboard .staff-secondary {
          font-size: 10px;
          color: #96918a;
          margin-top: 3px;
        }

        .attendance-dashboard .status-badge {
          font-size: 10px;
          font-weight: 750;
          border-radius: 6px;
          padding: 6px 9px;
        }

        .attendance-dashboard .view-button {
          background: #f6f3ec;
          border: 1px solid #e9e1d0;
          color: #79613a;
          font-size: 11px;
          font-weight: 750;
          border-radius: 7px;
        }

        .attendance-dashboard .view-button:hover {
          background: #eee5d3;
          color: #604a28;
        }

        .attendance-dashboard .live-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 13px 0;
          border-bottom: 1px solid #f0ede7;
        }

        .attendance-dashboard .live-row:last-child {
          border-bottom: 0;
        }

        .attendance-dashboard .activity-icon {
          width: 37px;
          height: 37px;
          min-width: 37px;
          border-radius: 11px;
          background: #f5f0e5;
          color: #9a7b43;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }

        .attendance-dashboard .activity-action {
          font-size: 12px;
          font-weight: 800;
          color: #302e2a;
        }

        .attendance-dashboard .activity-description {
          font-size: 11px;
          color: #8b867d;
          margin-top: 3px;
        }

        .attendance-dashboard .empty-state {
          padding: 45px 15px;
          text-align: center;
          color: #96918a;
          font-size: 13px;
        }

        .attendance-loading {
          min-height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .attendance-loading .luxury-loader {
          width: 55px;
          height: 55px;
          border-radius: 15px;
          background: #24221e;
          color: #d5b979;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: auto;
        }

        .attendance-dashboard .luxury-modal {
          background: #fff;
          border: 1px solid #e9e2d5;
          border-radius: 17px;
          overflow: hidden;
          box-shadow: 0 20px 70px rgba(0,0,0,.25);
        }

        .attendance-dashboard .modal-header-luxury {
          background: #22201c;
          color: #fff;
          padding: 18px 22px;
        }

        .attendance-dashboard .modal-header-luxury h6 {
          color: #fff;
          margin: 0;
          font-weight: 800;
        }

        .attendance-dashboard .modal-gold-avatar {
          width: 75px;
          height: 75px;
          border-radius: 20px;
          background: #24221e;
          color: #d7bd85;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 13px;
          font-size: 27px;
          font-weight: 800;
        }

        @media (max-width: 767px) {
          .attendance-dashboard .luxury-header {
            padding: 22px 18px;
          }

          .attendance-dashboard .header-actions {
            margin-top: 17px;
          }

          .attendance-dashboard .section-header {
            padding: 16px;
          }

          .attendance-dashboard .filter-strip {
            padding: 12px;
          }
        }
      `}</style>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="luxury-header">
        <CRow className="align-items-center">
          <CCol md={8}>
            <div className="header-kicker">Workforce Management</div>

            <h3>Attendance Overview</h3>

            <div className="header-subtitle">
              Monitor staff attendance, punctuality and daily activities.
            </div>

            <div className="header-date">
              <CIcon icon={cilClock} className="me-2" />
              {today}
            </div>
          </CCol>

          <CCol md={4} className="text-md-end header-actions">
            <CButton
              className="luxury-refresh"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <CSpinner size="sm" className="me-2" />
              ) : (
                <CIcon icon={cilReload} className="me-2" />
              )}
              Refresh Dashboard
            </CButton>
          </CCol>
        </CRow>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <CAlert
          color="danger"
          dismissible
          onClose={() => setError('')}
          className="mb-4"
        >
          {error}
        </CAlert>
      )}

      {/* =================================================
          KPI CARDS
      ================================================= */}

      <CRow className="g-3 mb-4">
        <CCol xs={12} sm={6} xl={3}>
          <KpiCard
            title="Present Today"
            value={kpis?.presentToday ?? 0}
            subtitle="Staff attendance"
            icon={cilUserFollow}
            color="#23845b"
            background="#e9f5ef"
          />
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <KpiCard
            title="Late Today"
            value={kpis?.lateToday ?? 0}
            subtitle="Requires attention"
            icon={cilWarning}
            color="#b17b29"
            background="#faf2e3"
          />
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <KpiCard
            title="Absent Today"
            value={kpis?.absentToday ?? 0}
            subtitle="Not yet clocked in"
            icon={cilUserUnfollow}
            color="#bd4c4c"
            background="#f9ebeb"
          />
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <KpiCard
            title="Currently Outside"
            value={kpis?.currentlyOutside ?? 0}
            subtitle="Away from workplace"
            icon={cilPeople}
            color="#b17b29"
            background="#faf2e3"
          />
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <KpiCard
            title="Clocked Out"
            value={kpis?.clockedOutToday ?? 0}
            subtitle="Completed attendance"
            icon={cilUserUnfollow}
            color="#547a9b"
            background="#edf2f7"
          />
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <KpiCard
            title="Average Hours"
            value={`${kpis?.averageWorkingHours ?? 0}h`}
            subtitle="Average working time"
            icon={cilClock}
            color="#8067a8"
            background="#f1edf7"
          />
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <KpiCard
            title="Overtime"
            value={`${kpis?.overtimeHours ?? 0}h`}
            subtitle="Total overtime"
            icon={cilSpeedometer}
            color="#4f7186"
            background="#edf3f5"
          />
        </CCol>
      </CRow>

      {/* =================================================
          ATTENDANCE TABLE
      ================================================= */}

      <div className="section-card mb-4">
        <div className="section-header">
          <CRow className="align-items-center g-3">
            <CCol lg={5}>
              <div className="section-heading">Today's Attendance</div>
              <div className="section-description">
                {filteredAttendance.length} unique staff record(s) displayed
              </div>
            </CCol>

            <CCol lg={7}>
              <CRow className="g-2">
                <CCol sm={7}>
                  <div className="position-relative">
                    <CIcon
                      icon={cilSearch}
                      className="position-absolute"
                      style={{
                        left: 13,
                        top: 13,
                        color: '#999',
                        zIndex: 2,
                      }}
                    />

                    <CFormInput
                      className="luxury-input"
                      style={{ paddingLeft: 36 }}
                      placeholder="Search staff name, position or email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </CCol>

                <CCol sm={5}>
                  <CFormSelect
                    className="luxury-input"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Staff</option>
                    <option value="late">Late</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="out">Out - Outside</option>
                    <option value="in">In - Inside</option>
                  </CFormSelect>
                </CCol>
              </CRow>
            </CCol>
          </CRow>
        </div>

        {/* QUICK FILTERS */}

        <div className="filter-strip">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`filter-button ${
                statusFilter === option.value ? 'active' : ''
              }`}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <CTable hover responsive className="luxury-table mb-0 align-middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Staff Member</CTableHeaderCell>
                <CTableHeaderCell>Position</CTableHeaderCell>
                <CTableHeaderCell>Clock In</CTableHeaderCell>
                <CTableHeaderCell>Attendance</CTableHeaderCell>
                <CTableHeaderCell>Live Status</CTableHeaderCell>
                <CTableHeaderCell>Clock Out</CTableHeaderCell>
                <CTableHeaderCell>Working Hours</CTableHeaderCell>
                <CTableHeaderCell>Overtime</CTableHeaderCell>
                <CTableHeaderCell>Action</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {filteredAttendance.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={9}>
                    <div className="empty-state">
                      <CIcon icon={cilPeople} size="3xl" className="mb-3" />
                      <div className="fw-semibold">
                        No attendance records found
                      </div>
                      <small>
                        Try changing your search or attendance filter.
                      </small>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                filteredAttendance.map((item) => {
                  const staffName = getStaffName(item)
                  const liveStatus = getLiveStatus(item)

                  return (
                    <CTableRow key={`${getStaffId(item)}-${item.attendanceDate || item.id}`}>
                      <CTableDataCell>
                        <div className="d-flex align-items-center">
                          <div className="staff-avatar">
                            {staffName.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div className="staff-name">{staffName}</div>
                            <div className="staff-secondary">
                              {item?.Staff?.User?.email || '--'}
                            </div>
                          </div>
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>
                        {getStaffPosition(item)}
                      </CTableDataCell>

                      <CTableDataCell>
                        <span className="fw-semibold">
                          {formatTime(item.clockIn)}
                        </span>
                      </CTableDataCell>

                      <CTableDataCell>
                        {getStatusBadge(item.status)}
                      </CTableDataCell>

                      <CTableDataCell>
                        <CBadge
                          color={liveStatus.color}
                          className="status-badge"
                        >
                          {liveStatus.label}
                        </CBadge>
                      </CTableDataCell>

                      <CTableDataCell>
                        {formatTime(item.clockOut)}
                      </CTableDataCell>

                      <CTableDataCell>
                        {item.workingHours !== undefined &&
                        item.workingHours !== null
                          ? `${item.workingHours}h`
                          : '--'}
                      </CTableDataCell>

                      <CTableDataCell>
                        {item.overtime !== undefined &&
                        item.overtime !== null
                          ? `${item.overtime}h`
                          : '--'}
                      </CTableDataCell>

                      <CTableDataCell>
                        <CButton
                          size="sm"
                          className="view-button"
                          onClick={() => {
                            setSelectedStaff(item.Staff || item.staff || item)
                            setShowDetails(true)
                          }}
                        >
                          View
                          <CIcon icon={cilArrowRight} className="ms-1" />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })
              )}
            </CTableBody>
          </CTable>
        </div>
      </div>

      {/* =================================================
          LIVE STAFF STATUS AND RECENT ACTIVITIES
      ================================================= */}

      <CRow className="g-4 mb-4">

        {/* LIVE STAFF STATUS */}

        <CCol lg={5}>
          <div className="section-card h-100">
            <div className="section-header">
              <div className="section-heading">Live Staff Status</div>
              <div className="section-description">
                Current staff location and attendance state
              </div>
            </div>

            <CCardBody style={{ maxHeight: 430, overflowY: 'auto' }}>
              {liveStaff.length === 0 ? (
                <div className="empty-state">
                  No staff attendance records available.
                </div>
              ) : (
                liveStaff.map((item) => {
                  const staffName = getStaffName(item)
                  const liveStatus = item.liveStatus

                  return (
                    <div
                      key={`${getStaffId(item)}-${item.attendanceDate || item.id}`}
                      className="live-row"
                    >
                      <div className="d-flex align-items-center">
                        <div className="staff-avatar">
                          {staffName.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="staff-name">{staffName}</div>
                          <div className="staff-secondary">
                            {getStaffPosition(item)}
                          </div>
                        </div>
                      </div>

                      <CBadge
                        color={liveStatus.color}
                        className="status-badge"
                      >
                        {liveStatus.label}
                      </CBadge>
                    </div>
                  )
                })
              )}
            </CCardBody>
          </div>
        </CCol>

        {/* RECENT ACTIVITIES */}

        <CCol lg={7}>
          <div className="section-card h-100">
            <div className="section-header">
              <div className="section-heading">Recent Staff Activities</div>
              <div className="section-description">
                Latest attendance kiosk transactions
              </div>
            </div>

            <CCardBody
              className="p-0"
              style={{ maxHeight: 430, overflowY: 'auto' }}
            >
              {uniqueActivities.length === 0 ? (
                <div className="empty-state">
                  No activities have been recorded.
                </div>
              ) : (
                uniqueActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="d-flex align-items-center px-3 px-md-4 py-3 border-bottom"
                  >
                    <div className="activity-icon">
                      <CIcon icon={cilHistory} />
                    </div>

                    <div className="flex-grow-1">
                      <div className="activity-action">
                        {String(activity.action || 'Activity').replace(/_/g, ' ')}
                      </div>

                      <div className="activity-description">
                        {activity.description || '--'}
                      </div>
                    </div>

                    <div className="text-end ms-2">
                      <small
                        className="text-muted"
                        style={{ fontSize: 10, whiteSpace: 'nowrap' }}
                      >
                        {formatDateTime(activity.createdAt)}
                      </small>
                    </div>
                  </div>
                ))
              )}
            </CCardBody>
          </div>
        </CCol>
      </CRow>

      {/* =================================================
          STAFF DETAILS MODAL
      ================================================= */}

      {showDetails && selectedStaff && (
        <StaffDetailsModal
          staff={selectedStaff}
          onClose={() => {
            setShowDetails(false)
            setSelectedStaff(null)
          }}
        />
      )}
    </div>
  )
}

// =====================================================
// KPI CARD
// =====================================================

const KpiCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
  background,
}) => {
  return (
    <CCard className="luxury-card">
      <CCardBody className="d-flex align-items-center p-3">
        <div
          className="kpi-icon"
          style={{
            background,
            color,
          }}
        >
          <CIcon icon={icon} size="xl" />
        </div>

        <div className="min-w-0">
          <div className="kpi-title">{title}</div>
          <div className="kpi-value">{value}</div>
          <div className="kpi-subtitle">{subtitle}</div>
        </div>
      </CCardBody>
    </CCard>
  )
}

// =====================================================
// STAFF DETAILS MODAL
// =====================================================

const StaffDetailsModal = ({ staff, onClose }) => {
  const fullname =
    staff?.User?.fullname ||
    staff?.fullname ||
    staff?.user?.fullname ||
    'Staff Member'

  const email =
    staff?.User?.email ||
    staff?.email ||
    staff?.user?.email ||
    '--'

  const phone =
    staff?.User?.phone ||
    staff?.phone ||
    staff?.user?.phone ||
    '--'

  const position = staff?.position || '--'
  const employmentType = staff?.employmentType || '--'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 15, 15, .68)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
      }}
      onClick={onClose}
    >
      <div
        className="luxury-modal"
        style={{
          width: '100%',
          maxWidth: 480,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-luxury d-flex justify-content-between align-items-center">
          <div>
            <div
              style={{
                color: '#c8ad76',
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 1.7,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Workforce Profile
            </div>

            <h6>Staff Details</h6>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: '1px solid rgba(255,255,255,.2)',
              background: 'transparent',
              color: '#fff',
              width: 32,
              height: 32,
              borderRadius: 8,
              fontSize: 17,
            }}
          >
            ×
          </button>
        </div>

        <CCardBody className="p-4">
          <div className="text-center mb-4">
            <div className="modal-gold-avatar">
              {fullname.charAt(0).toUpperCase()}
            </div>

            <h5 className="fw-bold mb-1">{fullname}</h5>

            <div className="text-muted" style={{ fontSize: 12 }}>
              {position}
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid #eee9df',
              paddingTop: 18,
            }}
          >
            {[
              ['Email Address', email],
              ['Phone Number', phone],
              ['Position', position],
              ['Employment Type', employmentType],
            ].map(([label, value]) => (
              <div
                key={label}
                className="d-flex justify-content-between align-items-start gap-3 mb-3"
              >
                <span
                  className="text-muted"
                  style={{ fontSize: 12 }}
                >
                  {label}
                </span>

                <strong
                  className="text-end"
                  style={{
                    fontSize: 12,
                    color: '#292929',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {value}
                </strong>
              </div>
            ))}
          </div>

          <CButton
            className="w-100 mt-2"
            style={{
              background: '#24221e',
              color: '#d7bd85',
              border: 'none',
              borderRadius: 9,
              fontWeight: 700,
              padding: 10,
            }}
            onClick={onClose}
          >
            Close Profile
          </CButton>
        </CCardBody>
      </div>
    </div>
  )
}

export default AttendanceDashboard
