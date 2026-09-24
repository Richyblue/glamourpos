import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
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
import { cilCheck, cilPlus, cilTrash, cilX, cilSearch, cilInfo, cilWarning } from '@coreui/icons'

const API_URL = import.meta.env.VITE_BACKEND_URL

const ProductConsumption = () => {
  // ============================================================
  // STATE
  // ============================================================

  const [consumptions, setConsumptions] = useState([])
  const [products, setProducts] = useState([])
  const [staff, setStaff] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [staffFilter, setStaffFilter] = useState('all')

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedConsumption, setSelectedConsumption] = useState(null)

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState(null)

  // Form
  const [form, setForm] = useState({
    staff_id: '',
    reason: '',
    notes: '',
  })

  const [formItems, setFormItems] = useState([
    {
      product_id: '',
      quantity: 1,
    },
  ])

  // ============================================================
  // HELPERS
  // ============================================================

  const getToken = () => {
    return localStorage.getItem('token')
  }

  const getStaffName = (person) => {
    if (!person) return 'Unknown Staff'

    return (
      person.User?.fullname ||
      person.User?.name ||
      person.fullname ||
      person.name ||
      `${person.firstName || ''} ${person.lastName || ''}`.trim() ||
      `Staff #${person.id}`
    )
  }

  const getProductName = (product) => {
    if (!product) return 'Unknown Product'

    return product.name || product.Product?.name || `Product #${product.id}`
  }

  const formatCurrency = (value) => {
    return `₦${Number(value || 0).toLocaleString()}`
  }

  const formatDate = (date) => {
    if (!date) return '-'

    return new Date(date).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <CBadge color="success">Approved</CBadge>

      case 'rejected':
        return <CBadge color="danger">Rejected</CBadge>

      case 'pending':
        return <CBadge color="warning">Pending</CBadge>

      default:
        return <CBadge color="secondary">{status || 'Unknown'}</CBadge>
    }
  }

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleItemChange = (index, field, value) => {
    setFormItems((prev) => {
      const updated = [...prev]

      updated[index] = {
        ...updated[index],
        [field]: value,
      }

      return updated
    })
  }

  const addItem = () => {
    setFormItems((prev) => [
      ...prev,
      {
        product_id: '',
        quantity: 1,
      },
    ])
  }

  const removeItem = (index) => {
    if (formItems.length === 1) {
      return
    }

    setFormItems((prev) => prev.filter((_, i) => i !== index))
  }

  // ============================================================
  // GET STAFF
  // ============================================================

  const getStaff = async () => {
    try {
      const token = getToken()

      const response = await axios.get(`${API_URL}api/v1/staffs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Staff API response:', response.data)

      setStaff(response.data.staffs || [])
    } catch (error) {
      console.error('Staff Error:', error)

      setError(error.response?.data?.message || 'Unable to load staff members.')
    }
  }

  // ============================================================
  // GET PRODUCTS
  // ============================================================

  const getProducts = async () => {
    try {
      const token = getToken()

      const response = await axios.get(`${API_URL}api/v1/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Products API response:', response.data)

      setProducts(response.data.products || [])
    } catch (error) {
      console.error('Products Error:', error)

      setError(error.response?.data?.message || 'Unable to load products.')
    }
  }

  // ============================================================
  // GET CONSUMPTIONS
  // ============================================================

  const getConsumptions = async () => {
    try {
      const token = getToken()

      const response = await axios.get(`${API_URL}api/v1/product-consumptions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Consumption API response:', response.data)

      setConsumptions(response.data.consumptions || [])
    } catch (error) {
      console.error('Consumption Error:', error)

      setError(error.response?.data?.message || 'Unable to load product consumption records.')
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')

      try {
        await Promise.all([getConsumptions(), getProducts(), getStaff()])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // ============================================================
  // CREATE CONSUMPTION
  // ============================================================

  const handleCreate = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    // Staff validation
    if (!form.staff_id) {
      setError('Please select a staff member.')
      return
    }

    // Product validation
    const validItems = formItems.filter((item) => item.product_id && Number(item.quantity) > 0)

    if (validItems.length === 0) {
      setError('Please select at least one product and enter a valid quantity.')
      return
    }

    // Check duplicate products
    const productIds = validItems.map((item) => String(item.product_id))

    const hasDuplicates = new Set(productIds).size !== productIds.length

    if (hasDuplicates) {
      setError('You cannot add the same product more than once.')
      return
    }

    try {
      setSaving(true)

      const token = getToken()

      const payload = {
        staff_id: Number(form.staff_id),

        reason: form.reason,

        notes: form.notes,

        items: validItems.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
        })),
      }

      console.log('Creating consumption:', payload)

      const response = await axios.post(`${API_URL}api/v1/product-consumptions`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Create consumption response:', response.data)

      setSuccess(response.data.message || 'Product consumption request created successfully.')

      setForm({
        staff_id: '',
        reason: '',
        notes: '',
      })

      setFormItems([
        {
          product_id: '',
          quantity: 1,
        },
      ])

      setShowCreateModal(false)

      await getConsumptions()
    } catch (error) {
      console.error('Create Consumption Error:', error)

      setError(error.response?.data?.message || 'Unable to create product consumption request.')
    } finally {
      setSaving(false)
    }
  }

  // ============================================================
  // VIEW DETAILS
  // ============================================================

  const handleView = async (id) => {
    setError('')

    try {
      const token = getToken()

      const response = await axios.get(`${API_URL}api/v1/product-consumptions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Consumption details:', response.data)

      setSelectedConsumption(response.data.consumption || response.data)

      setShowDetailsModal(true)
    } catch (error) {
      console.error('Get Consumption Error:', error)

      setError(error.response?.data?.message || 'Unable to load consumption details.')
    }
  }

  // ============================================================
  // APPROVE
  // ============================================================

  const handleApprove = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to approve this product consumption request? Stock will be deducted.',
    )

    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      setActionLoading(true)

      const token = getToken()

      const response = await axios.patch(
        `${API_URL}api/v1/product-consumptions/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setSuccess(response.data.message || 'Product consumption approved successfully.')

      await getConsumptions()

      if (selectedConsumption?.id === id) {
        await handleView(id)
      }
    } catch (error) {
      console.error('Approve Consumption Error:', error)

      setError(error.response?.data?.message || 'Unable to approve product consumption.')
    } finally {
      setActionLoading(false)
    }
  }

  // ============================================================
  // OPEN REJECT MODAL
  // ============================================================

  const openRejectModal = (id) => {
    setRejectingId(id)
    setRejectReason('')
    setShowRejectModal(true)
  }

  // ============================================================
  // REJECT
  // ============================================================

  const handleReject = async () => {
    if (!rejectingId) {
      return
    }

    if (!rejectReason.trim()) {
      setError('Please enter a reason for rejecting this request.')
      return
    }

    setError('')
    setSuccess('')

    try {
      setActionLoading(true)

      const token = getToken()

      const response = await axios.patch(
        `${API_URL}api/v1/product-consumptions/${rejectingId}/reject`,
        {
          rejection_reason: rejectReason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setSuccess(response.data.message || 'Product consumption request rejected.')

      setShowRejectModal(false)
      setRejectingId(null)
      setRejectReason('')

      await getConsumptions()

      if (selectedConsumption?.id === rejectingId) {
        await handleView(rejectingId)
      }
    } catch (error) {
      console.error('Reject Consumption Error:', error)

      setError(error.response?.data?.message || 'Unable to reject product consumption.')
    } finally {
      setActionLoading(false)
    }
  }

  // ============================================================
  // FILTER DATA
  // ============================================================

  const filteredConsumptions = useMemo(() => {
    return consumptions.filter((item) => {
      const staffName = getStaffName(item.Staff).toLowerCase()

      const referenceNumber = String(item.reference_number || '').toLowerCase()

      const reason = String(item.reason || '').toLowerCase()

      const searchValue = search.toLowerCase()

      const matchesSearch =
        !searchValue ||
        staffName.includes(searchValue) ||
        referenceNumber.includes(searchValue) ||
        reason.includes(searchValue)

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter

      const matchesStaff = staffFilter === 'all' || String(item.staff_id) === String(staffFilter)

      return matchesSearch && matchesStatus && matchesStaff
    })
  }, [consumptions, search, statusFilter, staffFilter])

  // ============================================================
  // SUMMARY
  // ============================================================

  const summary = useMemo(() => {
    const total = consumptions.length

    const pending = consumptions.filter((item) => item.status === 'pending').length

    const approved = consumptions.filter((item) => item.status === 'approved').length

    const rejected = consumptions.filter((item) => item.status === 'rejected').length

    return {
      total,
      pending,
      approved,
      rejected,
    }
  }, [consumptions])

  // ============================================================
  // RESET CREATE FORM
  // ============================================================

  const openCreateModal = () => {
    setError('')

    setForm({
      staff_id: '',
      reason: '',
      notes: '',
    })

    setFormItems([
      {
        product_id: '',
        quantity: 1,
      },
    ])

    setShowCreateModal(true)
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="product-consumption-page">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody className="p-4">
          <CRow className="align-items-center">
            <CCol md={8}>
              <div>
                <h3 className="fw-bold mb-1">Staff Product Consumption</h3>

                <p className="text-medium-emphasis mb-0">
                  Manage products taken by staff for business use.
                </p>
              </div>
            </CCol>

            <CCol md={4} className="text-md-end mt-3 mt-md-0">
              <CButton color="primary" className="px-4" onClick={openCreateModal}>
                <CIcon icon={cilPlus} className="me-2" />
                New Consumption
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* ======================================================
          ALERTS
      ====================================================== */}

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}

      {success && (
        <CAlert color="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </CAlert>
      )}

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <CRow className="mb-4">
        <CCol md={3} sm={6} className="mb-3">
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-1">Total Requests</div>

              <h3 className="fw-bold mb-0">{summary.total}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3} sm={6} className="mb-3">
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-1">Pending</div>

              <h3 className="fw-bold text-warning mb-0">{summary.pending}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3} sm={6} className="mb-3">
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-1">Approved</div>

              <h3 className="fw-bold text-success mb-0">{summary.approved}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3} sm={6} className="mb-3">
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-1">Rejected</div>

              <h3 className="fw-bold text-danger mb-0">{summary.rejected}</h3>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody>
          <CRow className="align-items-end">
            <CCol lg={4} md={6} className="mb-3">
              <CFormLabel>Search</CFormLabel>

              <div className="position-relative">
                <CFormInput
                  placeholder="Search reference, staff or reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CCol>

            <CCol lg={3} md={6} className="mb-3">
              <CFormLabel>Staff</CFormLabel>

              <CFormSelect value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
                <option value="all">All Staff</option>

                {staff.map((person) => (
                  <option key={person.id} value={person.id}>
                    {getStaffName(person)}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol lg={3} md={6} className="mb-3">
              <CFormLabel>Status</CFormLabel>

              <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>

                <option value="pending">Pending</option>

                <option value="approved">Approved</option>

                <option value="rejected">Rejected</option>
              </CFormSelect>
            </CCol>

            <CCol lg={2} md={6} className="mb-3">
              <CButton
                color="light"
                className="w-100"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setStaffFilter('all')
                }}
              >
                Clear Filters
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-white border-0 p-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold mb-1">Consumption Requests</h5>

              <small className="text-medium-emphasis">
                {filteredConsumptions.length} request
                {filteredConsumptions.length !== 1 ? 's' : ''}
              </small>
            </div>
          </div>
        </CCardHeader>

        <CCardBody className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <CSpinner />

              <div className="mt-2 text-medium-emphasis">Loading records...</div>
            </div>
          ) : filteredConsumptions.length === 0 ? (
            <div className="text-center py-5">
              <CIcon icon={cilInfo} size="xl" className="text-medium-emphasis mb-3" />

              <h5>No consumption records</h5>

              <p className="text-medium-emphasis mb-0">
                No product consumption records match your search.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <CTable hover align="middle" className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Reference</CTableHeaderCell>

                    <CTableHeaderCell>Staff</CTableHeaderCell>

                    <CTableHeaderCell>Products</CTableHeaderCell>

                    <CTableHeaderCell>Reason</CTableHeaderCell>

                    <CTableHeaderCell>Date</CTableHeaderCell>

                    <CTableHeaderCell>Status</CTableHeaderCell>

                    <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {filteredConsumptions.map((item) => (
                    <CTableRow key={item.id}>
                      <CTableDataCell>
                        <span className="fw-semibold">
                          {item.reference_number || `#${item.id}`}
                        </span>
                      </CTableDataCell>

                      <CTableDataCell>{getStaffName(item.Staff)}</CTableDataCell>

                      <CTableDataCell>
                        <div>
                          {item.Items?.length || 0} product
                          {item.Items?.length !== 1 ? 's' : ''}
                        </div>

                        {item.Items?.slice(0, 2).map((consumptionItem, index) => (
                          <small
                            key={consumptionItem.id || index}
                            className="d-block text-medium-emphasis"
                          >
                            {getProductName(consumptionItem.Product)} × {consumptionItem.quantity}
                          </small>
                        ))}

                        {item.Items?.length > 2 && (
                          <small className="text-primary">+{item.Items.length - 2} more</small>
                        )}
                      </CTableDataCell>

                      <CTableDataCell>{item.reason || '-'}</CTableDataCell>

                      <CTableDataCell>
                        {formatDate(item.requested_at || item.createdAt)}
                      </CTableDataCell>

                      <CTableDataCell>{getStatusBadge(item.status)}</CTableDataCell>

                      <CTableDataCell>
                        <div className="d-flex justify-content-end gap-2">
                          <CButton size="sm" color="light" onClick={() => handleView(item.id)}>
                            View
                          </CButton>

                          {item.status === 'pending' && (
                            <>
                              <CButton
                                size="sm"
                                color="success"
                                variant="outline"
                                disabled={actionLoading}
                                onClick={() => handleApprove(item.id)}
                              >
                                <CIcon icon={cilCheck} className="me-1" />
                                Approve
                              </CButton>

                              <CButton
                                size="sm"
                                color="danger"
                                variant="outline"
                                disabled={actionLoading}
                                onClick={() => openRejectModal(item.id)}
                              >
                                <CIcon icon={cilX} className="me-1" />
                                Reject
                              </CButton>
                            </>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* ======================================================
          CREATE MODAL
      ====================================================== */}

      <CModal
        visible={showCreateModal}
        onClose={() => !saving && setShowCreateModal(false)}
        size="lg"
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle className="fw-bold">New Product Consumption</CModalTitle>
        </CModalHeader>

        <CForm onSubmit={handleCreate}>
          <CModalBody>
            {error && (
              <CAlert color="danger" dismissible onClose={() => setError('')}>
                {error}
              </CAlert>
            )}

            <CRow>
              {/* STAFF */}

              <CCol md={6} className="mb-3">
                <CFormLabel>
                  Staff Member <span className="text-danger">*</span>
                </CFormLabel>

                <CFormSelect
                  value={form.staff_id}
                  onChange={(e) => handleFormChange('staff_id', e.target.value)}
                >
                  <option value="">Select staff member</option>

                  {staff.map((person) => (
                    <option key={person.id} value={person.id}>
                      {getStaffName(person)}
                    </option>
                  ))}
                </CFormSelect>

                {staff.length === 0 && (
                  <small className="text-danger">No staff members found.</small>
                )}
              </CCol>

              {/* REASON */}

              <CCol md={6} className="mb-3">
                <CFormLabel>Reason</CFormLabel>

                <CFormInput
                  placeholder="e.g. Product used for client service"
                  value={form.reason}
                  onChange={(e) => handleFormChange('reason', e.target.value)}
                />
              </CCol>
            </CRow>

            {/* PRODUCTS */}

            <div className="border rounded p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-0">Products</h6>

                  <small className="text-medium-emphasis">
                    Select products and the quantities taken.
                  </small>
                </div>

                <CButton
                  size="sm"
                  color="primary"
                  variant="outline"
                  type="button"
                  onClick={addItem}
                >
                  <CIcon icon={cilPlus} className="me-1" />
                  Add Product
                </CButton>
              </div>

              {formItems.map((item, index) => (
                <CRow key={index} className="align-items-end mb-3">
                  <CCol md={7}>
                    <CFormLabel>Product</CFormLabel>

                    <CFormSelect
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                    >
                      <option value="">Select product</option>

                      {products.map((product) => (
                        <option
                          key={product.id}
                          value={product.id}
                          disabled={Number(product.quantity) <= 0}
                        >
                          {product.name} — Stock: {product.quantity}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Quantity</CFormLabel>

                    <CFormInput
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    />
                  </CCol>

                  <CCol md={2}>
                    <CButton
                      type="button"
                      color="danger"
                      variant="outline"
                      className="w-100"
                      disabled={formItems.length === 1}
                      onClick={() => removeItem(index)}
                    >
                      <CIcon icon={cilTrash} />
                    </CButton>
                  </CCol>
                </CRow>
              ))}
            </div>

            {/* NOTES */}

            <div className="mb-3">
              <CFormLabel>Notes</CFormLabel>

              <CFormTextarea
                rows={3}
                placeholder="Additional notes..."
                value={form.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
              />
            </div>

            {/* INFO */}

            <CAlert color="info" className="mb-0">
              <CIcon icon={cilInfo} className="me-2" />
              Stock will only be deducted after the request is approved.
            </CAlert>
          </CModalBody>

          <CModalFooter>
            <CButton
              color="secondary"
              variant="outline"
              type="button"
              disabled={saving}
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </CButton>

            <CButton color="primary" type="submit" disabled={saving}>
              {saving ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CIcon icon={cilCheck} className="me-2" />
                  Submit Request
                </>
              )}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* ======================================================
          DETAILS MODAL
      ====================================================== */}

      <CModal visible={showDetailsModal} onClose={() => setShowDetailsModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle className="fw-bold">Consumption Details</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {selectedConsumption && (
            <>
              <CRow className="mb-4">
                <CCol md={6}>
                  <small className="text-medium-emphasis">Reference</small>

                  <div className="fw-bold">
                    {selectedConsumption.reference_number || `#${selectedConsumption.id}`}
                  </div>
                </CCol>

                <CCol md={6}>
                  <small className="text-medium-emphasis">Status</small>

                  <div className="mt-1">{getStatusBadge(selectedConsumption.status)}</div>
                </CCol>
              </CRow>

              <CRow className="mb-4">
                <CCol md={6}>
                  <small className="text-medium-emphasis">Staff</small>

                  <div className="fw-semibold">{getStaffName(selectedConsumption.Staff)}</div>
                </CCol>

                <CCol md={6}>
                  <small className="text-medium-emphasis">Requested At</small>

                  <div className="fw-semibold">
                    {formatDate(selectedConsumption.requested_at || selectedConsumption.createdAt)}
                  </div>
                </CCol>
              </CRow>

              <div className="mb-4">
                <small className="text-medium-emphasis">Reason</small>

                <div className="fw-semibold">{selectedConsumption.reason || '-'}</div>
              </div>

              <div className="mb-4">
                <small className="text-medium-emphasis">Notes</small>

                <div>{selectedConsumption.notes || '-'}</div>
              </div>

              <h6 className="fw-bold mb-3">Products</h6>

              <CTable bordered hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Product</CTableHeaderCell>

                    <CTableHeaderCell>Quantity</CTableHeaderCell>

                    <CTableHeaderCell>Unit Cost</CTableHeaderCell>

                    <CTableHeaderCell>Total Cost</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {selectedConsumption.Items?.map((consumptionItem) => (
                    <CTableRow key={consumptionItem.id}>
                      <CTableDataCell>{getProductName(consumptionItem.Product)}</CTableDataCell>

                      <CTableDataCell>{consumptionItem.quantity}</CTableDataCell>

                      <CTableDataCell>{formatCurrency(consumptionItem.unit_cost)}</CTableDataCell>

                      <CTableDataCell>{formatCurrency(consumptionItem.total_cost)}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              {selectedConsumption.status === 'rejected' && (
                <CAlert color="danger" className="mt-4 mb-0">
                  <strong>Rejection Reason:</strong>{' '}
                  {selectedConsumption.rejection_reason || 'No reason provided.'}
                </CAlert>
              )}

              {selectedConsumption.status === 'approved' && (
                <CAlert color="success" className="mt-4 mb-0">
                  <CIcon icon={cilCheck} className="me-2" />
                  This request has been approved and the product stock was deducted.
                </CAlert>
              )}
            </>
          )}
        </CModalBody>

        <CModalFooter>
          {selectedConsumption?.status === 'pending' && (
            <>
              <CButton
                color="danger"
                variant="outline"
                disabled={actionLoading}
                onClick={() => openRejectModal(selectedConsumption.id)}
              >
                <CIcon icon={cilX} className="me-2" />
                Reject
              </CButton>

              <CButton
                color="success"
                disabled={actionLoading}
                onClick={() => handleApprove(selectedConsumption.id)}
              >
                {actionLoading ? (
                  <CSpinner size="sm" />
                ) : (
                  <>
                    <CIcon icon={cilCheck} className="me-2" />
                    Approve
                  </>
                )}
              </CButton>
            </>
          )}

          <CButton color="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ======================================================
          REJECT MODAL
      ====================================================== */}

      <CModal
        visible={showRejectModal}
        onClose={() => !actionLoading && setShowRejectModal(false)}
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle className="fw-bold">Reject Consumption Request</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <CAlert color="warning">
            <CIcon icon={cilWarning} className="me-2" />
            Rejecting this request will not deduct any stock.
          </CAlert>

          <CFormLabel>
            Rejection Reason <span className="text-danger">*</span>
          </CFormLabel>

          <CFormTextarea
            rows={4}
            placeholder="Enter the reason for rejecting this request..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </CModalBody>

        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            disabled={actionLoading}
            onClick={() => setShowRejectModal(false)}
          >
            Cancel
          </CButton>

          <CButton color="danger" disabled={actionLoading} onClick={handleReject}>
            {actionLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Rejecting...
              </>
            ) : (
              <>
                <CIcon icon={cilX} className="me-2" />
                Reject Request
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default ProductConsumption
