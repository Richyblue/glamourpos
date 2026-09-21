import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CBadge,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CFormInput,
  CFormSelect,
  CSpinner,
} from '@coreui/react'

import { useState, useEffect } from 'react'

import axios from 'axios'

import Swal from 'sweetalert2'

import * as XLSX from 'xlsx'

const Commission = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [commissions, setCommissions] = useState([])

  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')

  const [statusFilter, setStatusFilter] = useState('')

  const [monthFilter, setMonthFilter] = useState('')

  const [yearFilter, setYearFilter] = useState('')

  const [selectedStaff, setSelectedStaff] = useState('')

  const [staffs, setStaffs] = useState([])

  // =========================================================
  // GET COMMISSIONS
  // =========================================================

  const getCommissions = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/commissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setCommissions(response.data.commissions || [])
    } catch (error) {
      console.error('Commission Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // GET STAFF
  // =========================================================

  const getStaffs = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/staffs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setStaffs(response.data.staffs || [])
    } catch (error) {
      console.error('Staff Error:', error)
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    const fetchData = async () => {
      await getCommissions()
      await getStaffs()
    }

    fetchData()
  }, [])

  // =========================================================
  // RETURN STATUS
  // =========================================================

  const isReturned = (item) => {
    /*
     * The backend should return a value such as:
     *
     * item.returned
     *
     * or:
     *
     * item.Sale.status === "refunded"
     *
     * We support both.
     */

    if (item.returned === true) {
      return true
    }

    if (item.isReturned === true) {
      return true
    }

    if (item.Sale?.status === 'refunded') {
      return true
    }

    return false
  }

  // =========================================================
  // ORIGINAL COMMISSION
  // =========================================================

  const getOriginalCommission = (item) => {
    /*
     * If backend provides originalCommissionAmount,
     * use it.
     *
     * Otherwise use current commission amount.
     */

    if (item.originalCommissionAmount !== undefined) {
      return Number(item.originalCommissionAmount || 0)
    }

    return Number(item.commissionAmount || 0)
  }

  // =========================================================
  // CURRENT COMMISSION
  // =========================================================

  const getCurrentCommission = (item) => {
    return Number(item.commissionAmount || 0)
  }

  // =========================================================
  // RETURNED COMMISSION
  // =========================================================

  const getReturnedCommission = (item) => {
    const original = getOriginalCommission(item)

    const current = getCurrentCommission(item)

    return Math.max(original - current, 0)
  }

  // =========================================================
  // FILTER COMMISSIONS
  // =========================================================

  const filteredCommissions = commissions.filter((commission) => {
    const staffName = commission.Staff?.User?.fullname || ''

    const staffId = commission.StaffId

    const searchMatch = staffName.toLowerCase().includes(search.toLowerCase())

    const staffMatch = selectedStaff === '' ? true : Number(staffId) === Number(selectedStaff)

    const statusMatch = statusFilter === '' ? true : commission.status === statusFilter

    const date = new Date(commission.commissionDate)

    const monthMatch = monthFilter === '' ? true : date.getMonth() + 1 === Number(monthFilter)

    const yearMatch = yearFilter === '' ? true : date.getFullYear() === Number(yearFilter)

    return searchMatch && staffMatch && statusMatch && monthMatch && yearMatch
  })

  // =========================================================
  // KPI
  // =========================================================

  const totalCommission = filteredCommissions.reduce(
    (sum, item) => sum + getCurrentCommission(item),
    0,
  )

  const pendingCommission = filteredCommissions.reduce(
    (sum, item) => (item.status === 'pending' ? sum + getCurrentCommission(item) : sum),
    0,
  )

  const paidCommission = filteredCommissions.reduce(
    (sum, item) => (item.status === 'paid' ? sum + getCurrentCommission(item) : sum),
    0,
  )

  const returnedCommission = filteredCommissions.reduce(
    (sum, item) => sum + getReturnedCommission(item),
    0,
  )

  // =========================================================
  // MARK PAID
  // =========================================================

  const markPaid = async (id) => {
    const commission = commissions.find((item) => Number(item.id) === Number(id))

    if (!commission) {
      return
    }

    const currentAmount = getCurrentCommission(commission)

    // -------------------------------------------------------
    // DO NOT PAY ZERO COMMISSION
    // -------------------------------------------------------

    if (currentAmount <= 0) {
      Swal.fire(
        'Cannot Pay',
        'This commission has been fully returned and the payable amount is ₦0.',
        'warning',
      )

      return
    }

    const result = await Swal.fire({
      title: 'Mark as Paid?',
      text: `Commission amount: ₦${currentAmount.toLocaleString()}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Mark Paid',
      cancelButtonText: 'Cancel',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      const token = localStorage.getItem('token')

      await axios.put(
        `${API_URL}api/v1/commissions/${id}/pay`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      Swal.fire('Success', 'Commission paid', 'success')

      getCommissions()
    } catch (error) {
      console.error(error)

      Swal.fire('Error', 'Failed to mark commission as paid', 'error')
    }
  }

  // =========================================================
  // EXPORT EXCEL
  // =========================================================

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredCommissions.map((item) => ({
        Staff: item.Staff?.User?.fullname || '-',

        'Original Commission': getOriginalCommission(item),

        'Current Commission': getCurrentCommission(item),

        'Returned Commission': getReturnedCommission(item),

        Rate: item.commissionRate,

        Date: item.commissionDate,

        Status: item.status,

        Returned: isReturned(item) ? 'YES' : 'NO',
      })),
    )

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Commissions')

    XLSX.writeFile(workbook, 'CommissionReport.xlsx')
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <CRow className="mb-4">
        {/* TOTAL */}

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Total Commission</h6>

              <h3>₦{totalCommission.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        {/* PENDING */}

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Pending</h6>

              <h3>₦{pendingCommission.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        {/* PAID */}

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Paid</h6>

              <h3>₦{paidCommission.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        {/* RETURNED */}

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Returned Commission</h6>

              <h3 className="text-danger">₦{returnedCommission.toLocaleString()}</h3>

              <small className="text-medium-emphasis">Commission removed because of returns</small>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          COMMISSION CARD
      ===================================================== */}

      <CCard>
        <CCardHeader>Staff Commissions</CCardHeader>

        <CCardBody>
          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="d-flex gap-2 mb-3 flex-wrap">
            {/* STAFF */}

            <CFormSelect
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              style={{
                minWidth: '180px',
              }}
            >
              <option value="">All Staff</option>

              {staffs.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.User?.fullname}
                </option>
              ))}
            </CFormSelect>

            {/* STATUS */}

            <CFormSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                minWidth: '150px',
              }}
            >
              <option value="">All Status</option>

              <option value="pending">Pending</option>

              <option value="paid">Paid</option>
            </CFormSelect>

            {/* MONTH */}

            <CFormSelect
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{
                minWidth: '150px',
              }}
            >
              <option value="">All Months</option>

              <option value="1">January</option>

              <option value="2">February</option>

              <option value="3">March</option>

              <option value="4">April</option>

              <option value="5">May</option>

              <option value="6">June</option>

              <option value="7">July</option>

              <option value="8">August</option>

              <option value="9">September</option>

              <option value="10">October</option>

              <option value="11">November</option>

              <option value="12">December</option>
            </CFormSelect>

            {/* YEAR */}

            <CFormInput
              type="number"
              placeholder="Year"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{
                maxWidth: '120px',
              }}
            />

            {/* SEARCH */}

            <CFormInput
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                minWidth: '180px',
              }}
            />

            {/* EXPORT */}

            <CButton onClick={exportExcel} color="success">
              Export Excel
            </CButton>
          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          {loading ? (
            <div className="text-center py-5">
              <CSpinner />

              <div className="mt-2 text-medium-emphasis">Loading commissions...</div>
            </div>
          ) : (
            <CTable hover responsive bordered>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Staff</CTableHeaderCell>

                  <CTableHeaderCell>Rate %</CTableHeaderCell>

                  <CTableHeaderCell>Original</CTableHeaderCell>

                  <CTableHeaderCell>Returned</CTableHeaderCell>

                  <CTableHeaderCell>Current Amount</CTableHeaderCell>

                  <CTableHeaderCell>Date</CTableHeaderCell>

                  <CTableHeaderCell>Status</CTableHeaderCell>

                  <CTableHeaderCell>Return</CTableHeaderCell>

                  <CTableHeaderCell>Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredCommissions.length > 0 ? (
                  filteredCommissions.map((item) => {
                    const originalAmount = getOriginalCommission(item)

                    const currentAmount = getCurrentCommission(item)

                    const returnedAmount = getReturnedCommission(item)

                    const returned = isReturned(item)

                    return (
                      <CTableRow key={item.id}>
                        {/* STAFF */}

                        <CTableDataCell>{item.Staff?.User?.fullname}</CTableDataCell>

                        {/* RATE */}

                        <CTableDataCell>{item.commissionRate}%</CTableDataCell>

                        {/* ORIGINAL */}

                        <CTableDataCell>₦{originalAmount.toLocaleString()}</CTableDataCell>

                        {/* RETURNED */}

                        <CTableDataCell>
                          {returnedAmount > 0 ? (
                            <span className="text-danger fw-semibold">
                              -₦
                              {returnedAmount.toLocaleString()}
                            </span>
                          ) : (
                            '-'
                          )}
                        </CTableDataCell>

                        {/* CURRENT */}

                        <CTableDataCell>
                          <strong className={currentAmount <= 0 ? 'text-danger' : ''}>
                            ₦{currentAmount.toLocaleString()}
                          </strong>
                        </CTableDataCell>

                        {/* DATE */}

                        <CTableDataCell>{item.commissionDate}</CTableDataCell>

                        {/* STATUS */}

                        <CTableDataCell>
                          <CBadge
                            color={
                              item.status === 'paid'
                                ? 'success'
                                : currentAmount <= 0
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {currentAmount <= 0 && item.status === 'pending'
                              ? 'returned'
                              : item.status}
                          </CBadge>
                        </CTableDataCell>

                        {/* RETURN */}

                        <CTableDataCell>
                          {returnedAmount > 0 ? (
                            <CBadge color="danger">Returned</CBadge>
                          ) : (
                            <CBadge color="success">No Return</CBadge>
                          )}
                        </CTableDataCell>

                        {/* ACTION */}

                        <CTableDataCell>
                          {item.status === 'pending' && currentAmount > 0 ? (
                            <CButton size="sm" color="success" onClick={() => markPaid(item.id)}>
                              Mark Paid
                            </CButton>
                          ) : item.status === 'pending' && currentAmount <= 0 ? (
                            <CBadge color="danger">No Payment</CBadge>
                          ) : (
                            <CBadge color="secondary">Paid</CBadge>
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan="9" className="text-center py-5">
                      No commissions found.
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}

export default Commission
