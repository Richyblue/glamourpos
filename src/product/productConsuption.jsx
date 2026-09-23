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
  CFormInput,
  CFormLabel,
  CFormSelect,
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

import { cilCheck, cilClock, cilFilter, cilPlus, cilSearch, cilTrash, cilX } from '@coreui/icons'

import CIcon from '@coreui/icons-react'

const API_URL = import.meta.env.VITE_API_URL

const ProductConsumption = () => {
  // =========================================================
  // DATA
  // =========================================================

  const [consumptions, setConsumptions] = useState([])
  const [products, setProducts] = useState([])
  const [staff, setStaff] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // =========================================================
  // FILTERS
  // =========================================================

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [staffFilter, setStaffFilter] = useState('all')

  // =========================================================
  // MODALS
  // =========================================================

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  const [selectedConsumption, setSelectedConsumption] = useState(null)

  // =========================================================
  // REJECTION
  // =========================================================

  const [rejectionReason, setRejectionReason] = useState('')

  // =========================================================
  // FORM
  // =========================================================

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

  // =========================================================
  // API HELPERS
  // =========================================================

  const getToken = () => {
    return localStorage.getItem('token')
  }

  const authConfig = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  })

  // =========================================================
  // NORMALIZE API RESPONSE
  // =========================================================

  const normalizeArray = (response) => {
    if (Array.isArray(response?.data?.data)) {
      return response.data.data
    }

    if (Array.isArray(response?.data)) {
      return response.data
    }

    return []
  }

  // =========================================================
  // FETCH DATA
  // =========================================================

  const fetchConsumptions = async () => {
    try {
      const response = await axios.get(`${API_URL}api/v1/product-consumptions`, authConfig())

      setConsumptions(normalizeArray(response))
    } catch (error) {
      console.error('Failed to fetch product consumptions:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}api/v1/products`, authConfig())

      setProducts(normalizeArray(response))
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${API_URL}api/v1/staff`, authConfig())

      setStaff(normalizeArray(response))
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    }
  }

  const loadData = async () => {
    setLoading(true)

    try {
      await Promise.all([fetchConsumptions(), fetchProducts(), fetchStaff()])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // =========================================================
  // FILTERED DATA
  // =========================================================

  const filteredConsumptions = useMemo(() => {
    return consumptions.filter((item) => {
      const searchText = search.toLowerCase().trim()

      const matchesSearch =
        !searchText ||
        item.reference_number?.toLowerCase().includes(searchText) ||
        item.Staff?.fullname?.toLowerCase().includes(searchText) ||
        item.reason?.toLowerCase().includes(searchText)

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter

      const matchesStaff = staffFilter === 'all' || String(item.staff_id) === String(staffFilter)

      return matchesSearch && matchesStatus && matchesStaff
    })
  }, [consumptions, search, statusFilter, staffFilter])

  // =========================================================
  // KPIs
  // =========================================================

  const statistics = useMemo(() => {
    const approved = consumptions.filter((item) => item.status === 'approved')

    const pending = consumptions.filter((item) => item.status === 'pending')

    const rejected = consumptions.filter((item) => item.status === 'rejected')

    const totalCost = approved.reduce((sum, consumption) => {
      return (
        sum +
        (consumption.Items || []).reduce(
          (itemSum, item) => itemSum + Number(item.total_cost || 0),
          0,
        )
      )
    }, 0)

    return {
      total: consumptions.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      totalCost,
    }
  }, [consumptions])

  // =========================================================
  // FORM HANDLERS
  // =========================================================

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
    if (formItems.length === 1) return

    setFormItems((prev) => prev.filter((_, i) => i !== index))
  }

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
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
  }

  // =========================================================
  // CREATE REQUEST
  // =========================================================

  const handleCreateConsumption = async () => {
    if (!form.staff_id) {
      alert('Please select a staff member.')
      return
    }

    const validItems = formItems.filter((item) => item.product_id && Number(item.quantity) > 0)

    if (validItems.length === 0) {
      alert('Please add at least one product.')
      return
    }

    // Check duplicate products
    const productIds = validItems.map((item) => String(item.product_id))

    const hasDuplicate = new Set(productIds).size !== productIds.length

    if (hasDuplicate) {
      alert('The same product cannot be added twice. Please combine the quantities.')
      return
    }

    // Check stock
    for (const item of validItems) {
      const product = products.find((p) => String(p.id) === String(item.product_id))

      if (!product) {
        alert('One of the selected products no longer exists.')
        return
      }

      if (Number(item.quantity) > Number(product.quantity || 0)) {
        alert(`${product.name} only has ${product.quantity} in stock.`)
        return
      }
    }

    try {
      setSaving(true)

      await axios.post(
        `${API_URL}api/v1/product-consumptions`,
        {
          staff_id: form.staff_id,

          items: validItems.map((item) => ({
            product_id: Number(item.product_id),
            quantity: Number(item.quantity),
          })),

          reason: form.reason,
          notes: form.notes,
        },
        authConfig(),
      )

      setShowCreateModal(false)
      resetForm()

      await fetchConsumptions()

      alert('Product consumption request submitted successfully.')
    } catch (error) {
      console.error('Create consumption error:', error)

      alert(error?.response?.data?.message || 'Failed to create product consumption request.')
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // APPROVE
  // =========================================================

  const handleApprove = async (id) => {
    const confirmed = window.confirm(
      'Approve this product consumption request? Stock will be deducted immediately.',
    )

    if (!confirmed) return

    try {
      setSaving(true)

      await axios.patch(`${API_URL}api/v1/product-consumptions/${id}/approve`, {}, authConfig())

      await loadData()

      setShowDetailsModal(false)
    } catch (error) {
      console.error('Approve consumption error:', error)

      alert(error?.response?.data?.message || 'Failed to approve request.')
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // OPEN REJECT
  // =========================================================

  const openRejectModal = (item) => {
    setSelectedConsumption(item)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  // =========================================================
  // REJECT
  // =========================================================

  const handleReject = async () => {
    if (!selectedConsumption) return

    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason.')
      return
    }

    try {
      setSaving(true)

      await axios.patch(
        `${API_URL}api/v1/product-consumptions/${selectedConsumption.id}/reject`,
        {
          rejection_reason: rejectionReason.trim(),
        },
        authConfig(),
      )

      setShowRejectModal(false)
      setShowDetailsModal(false)

      await fetchConsumptions()
    } catch (error) {
      console.error('Reject consumption error:', error)

      alert(error?.response?.data?.message || 'Failed to reject request.')
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // STATUS BADGE
  // =========================================================

  const renderStatus = (status) => {
    if (status === 'approved') {
      return (
        <CBadge color="success">
          <CIcon icon={cilCheck} size="sm" className="me-1" />
          Approved
        </CBadge>
      )
    }

    if (status === 'rejected') {
      return (
        <CBadge color="danger">
          <CIcon icon={cilX} size="sm" className="me-1" />
          Rejected
        </CBadge>
      )
    }

    return (
      <CBadge color="warning">
        <CIcon icon={cilClock} size="sm" className="me-1" />
        Pending
      </CBadge>
    )
  }

  // =========================================================
  // TOTAL COST
  // =========================================================

  const getTotalCost = (item) => {
    return (item.Items || []).reduce((sum, product) => sum + Number(product.total_cost || 0), 0)
  }

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return '-'

    return new Date(date).toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '60vh' }}
      >
        <div className="text-center">
          <CSpinner />
          <div className="mt-3 text-body-secondary">Loading product usage records...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="product-consumption-page">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="mb-1 fw-semibold">Product Usage</h3>

          <div className="text-body-secondary">
            Track products issued for staff use and manage approvals.
          </div>
        </div>

        <CButton
          color="primary"
          className="px-4"
          onClick={() => {
            resetForm()
            setShowCreateModal(true)
          }}
        >
          <CIcon icon={cilPlus} className="me-2" />
          New Product Request
        </CButton>
      </div>

      {/* =====================================================
          KPI CARDS
      ====================================================== */}

      <CRow className="g-3 mb-4">
        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-body-secondary small mb-2">Total Requests</div>

              <div className="fs-3 fw-semibold">{statistics.total}</div>

              <div className="small text-body-secondary mt-2">All usage requests</div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-body-secondary small mb-2">Pending Approval</div>

              <div className="fs-3 fw-semibold text-warning">{statistics.pending}</div>

              <div className="small text-body-secondary mt-2">Awaiting action</div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-body-secondary small mb-2">Approved</div>

              <div className="fs-3 fw-semibold text-success">{statistics.approved}</div>

              <div className="small text-body-secondary mt-2">Stock deducted</div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-body-secondary small mb-2">Consumption Value</div>

              <div className="fs-3 fw-semibold">
                ₦
                {statistics.totalCost.toLocaleString('en-NG', {
                  minimumFractionDigits: 2,
                })}
              </div>

              <div className="small text-body-secondary mt-2">Approved usage</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          FILTER CARD
      ====================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody>
          <CRow className="g-3 align-items-end">
            <CCol xs={12} lg={5}>
              <CFormLabel className="small fw-semibold">Search</CFormLabel>

              <div className="position-relative">
                <CIcon
                  icon={cilSearch}
                  className="position-absolute text-body-secondary"
                  style={{
                    left: '12px',
                    top: '11px',
                  }}
                />

                <CFormInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reference, staff or reason..."
                  style={{
                    paddingLeft: '38px',
                  }}
                />
              </div>
            </CCol>

            <CCol xs={12} sm={6} lg={3}>
              <CFormLabel className="small fw-semibold">Status</CFormLabel>

              <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </CFormSelect>
            </CCol>

            <CCol xs={12} sm={6} lg={3}>
              <CFormLabel className="small fw-semibold">Staff</CFormLabel>

              <CFormSelect value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
                <option value="all">All staff</option>

                {staff.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullname ||
                      person.name ||
                      `${person.firstName || ''} ${person.lastName || ''}`}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol xs={12} lg={1}>
              <CButton
                color="light"
                className="w-100"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setStaffFilter('all')
                }}
              >
                <CIcon icon={cilFilter} />
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* =====================================================
          TABLE
      ====================================================== */}

      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-transparent py-3 border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-semibold">Product Usage Requests</div>

              <div className="small text-body-secondary">
                {filteredConsumptions.length} record
                {filteredConsumptions.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </CCardHeader>

        <CCardBody className="p-0">
          <div className="table-responsive">
            <CTable hover align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell className="px-4">Reference</CTableHeaderCell>

                  <CTableHeaderCell>Staff</CTableHeaderCell>

                  <CTableHeaderCell>Products</CTableHeaderCell>

                  <CTableHeaderCell>Requested</CTableHeaderCell>

                  <CTableHeaderCell>Value</CTableHeaderCell>

                  <CTableHeaderCell>Status</CTableHeaderCell>

                  <CTableHeaderCell className="text-end px-4">Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredConsumptions.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center py-5">
                      <div className="text-body-secondary">No product usage records found.</div>
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  filteredConsumptions.map((item) => (
                    <CTableRow key={item.id}>
                      <CTableDataCell className="px-4">
                        <div className="fw-semibold">{item.reference_number}</div>

                        <div className="small text-body-secondary">#{item.id}</div>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="fw-medium">
                          {item.Staff?.fullname || item.Staff?.name || 'Unknown Staff'}
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="fw-medium">
                          {item.Items?.length || 0} product
                          {item.Items?.length !== 1 ? 's' : ''}
                        </div>

                        <div className="small text-body-secondary">
                          {item.Items?.slice(0, 2).map((product, index) => (
                            <span key={index}>
                              {product.Product?.name || 'Product'}

                              {index < Math.min(item.Items.length, 2) - 1 ? ', ' : ''}
                            </span>
                          ))}

                          {item.Items?.length > 2 && ` +${item.Items.length - 2} more`}
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div>{formatDate(item.requested_at || item.createdAt)}</div>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="fw-semibold">
                          ₦
                          {getTotalCost(item).toLocaleString('en-NG', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>{renderStatus(item.status)}</CTableDataCell>

                      <CTableDataCell className="text-end px-4">
                        <CButton
                          color="light"
                          size="sm"
                          onClick={() => {
                            setSelectedConsumption(item)
                            setShowDetailsModal(true)
                          }}
                        >
                          View
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>

      {/* =====================================================
          CREATE REQUEST MODAL
      ====================================================== */}

      <CModal
        visible={showCreateModal}
        onClose={() => !saving && setShowCreateModal(false)}
        size="lg"
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>New Product Usage Request</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <CAlert color="info">
            Products will only be deducted from inventory after the request is approved.
          </CAlert>

          <CRow className="g-3">
            <CCol xs={12} md={6}>
              <CFormLabel className="fw-semibold">
                Staff Member
                <span className="text-danger"> *</span>
              </CFormLabel>

              <CFormSelect
                value={form.staff_id}
                onChange={(e) => handleFormChange('staff_id', e.target.value)}
              >
                <option value="">Select staff member</option>

                {staff.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullname ||
                      person.name ||
                      `${person.firstName || ''} ${person.lastName || ''}`}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol xs={12} md={6}>
              <CFormLabel className="fw-semibold">Reason</CFormLabel>

              <CFormInput
                value={form.reason}
                onChange={(e) => handleFormChange('reason', e.target.value)}
                placeholder="e.g. Product used during service"
              />
            </CCol>
          </CRow>

          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <div className="fw-semibold">Products</div>

                <div className="small text-body-secondary">
                  Select the products and quantities required.
                </div>
              </div>

              <CButton color="light" size="sm" onClick={addItem}>
                <CIcon icon={cilPlus} className="me-1" />
                Add Product
              </CButton>
            </div>

            {formItems.map((item, index) => {
              const selectedProduct = products.find(
                (product) => String(product.id) === String(item.product_id),
              )

              const stock = Number(selectedProduct?.quantity || 0)

              const quantity = Number(item.quantity || 0)

              const insufficient = selectedProduct && quantity > stock

              return (
                <CCard key={index} className="border mb-3">
                  <CCardBody>
                    <CRow className="g-3 align-items-end">
                      <CCol xs={12} md={6}>
                        <CFormLabel className="small fw-semibold">Product</CFormLabel>

                        <CFormSelect
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                        >
                          <option value="">Select product</option>

                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} — Stock: {product.quantity}
                            </option>
                          ))}
                        </CFormSelect>
                      </CCol>

                      <CCol xs={8} md={3}>
                        <CFormLabel className="small fw-semibold">Quantity</CFormLabel>

                        <CFormInput
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                      </CCol>

                      <CCol xs={4} md={2}>
                        <div className="small text-body-secondary mb-1">Available</div>

                        <div
                          className={
                            insufficient ? 'fw-semibold text-danger' : 'fw-semibold text-success'
                          }
                        >
                          {selectedProduct ? stock : '—'}
                        </div>
                      </CCol>

                      <CCol xs={12} md={1}>
                        <CButton
                          color="light"
                          className="w-100 text-danger"
                          disabled={formItems.length === 1}
                          onClick={() => removeItem(index)}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CCol>
                    </CRow>

                    {insufficient && (
                      <div className="text-danger small mt-2">
                        Requested quantity exceeds available stock.
                      </div>
                    )}
                  </CCardBody>
                </CCard>
              )
            })}
          </div>

          <div className="mt-3">
            <CFormLabel className="fw-semibold">Notes</CFormLabel>

            <CFormInput
              value={form.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton color="light" disabled={saving} onClick={() => setShowCreateModal(false)}>
            Cancel
          </CButton>

          <CButton color="primary" disabled={saving} onClick={handleCreateConsumption}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              <>
                <CIcon icon={cilCheck} className="me-2" />
                Submit Request
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* =====================================================
          DETAILS MODAL
      ====================================================== */}

      <CModal
        visible={showDetailsModal}
        onClose={() => !saving && setShowDetailsModal(false)}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Product Usage Details</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {selectedConsumption && (
            <>
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
                <div>
                  <div className="small text-body-secondary">Reference</div>

                  <div className="fs-5 fw-semibold">{selectedConsumption.reference_number}</div>
                </div>

                <div>{renderStatus(selectedConsumption.status)}</div>
              </div>

              <CRow className="g-3 mb-4">
                <CCol xs={12} md={4}>
                  <div className="small text-body-secondary">Staff</div>

                  <div className="fw-semibold">
                    {selectedConsumption.Staff?.fullname ||
                      selectedConsumption.Staff?.name ||
                      'Unknown'}
                  </div>
                </CCol>

                <CCol xs={12} md={4}>
                  <div className="small text-body-secondary">Requested</div>

                  <div className="fw-semibold">
                    {formatDate(selectedConsumption.requested_at || selectedConsumption.createdAt)}
                  </div>
                </CCol>

                <CCol xs={12} md={4}>
                  <div className="small text-body-secondary">Total Value</div>

                  <div className="fw-semibold">
                    ₦
                    {getTotalCost(selectedConsumption).toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </CCol>
              </CRow>

              <div className="mb-4">
                <div className="fw-semibold mb-2">Products</div>

                <div className="table-responsive border rounded">
                  <CTable hover className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Product</CTableHeaderCell>

                        <CTableHeaderCell>Quantity</CTableHeaderCell>

                        <CTableHeaderCell>Unit Cost</CTableHeaderCell>

                        <CTableHeaderCell className="text-end">Total</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {selectedConsumption.Items?.map((item) => (
                        <CTableRow key={item.id}>
                          <CTableDataCell>
                            <div className="fw-medium">{item.Product?.name}</div>
                          </CTableDataCell>

                          <CTableDataCell>{item.quantity}</CTableDataCell>

                          <CTableDataCell>
                            ₦
                            {Number(item.unit_cost || 0).toLocaleString('en-NG', {
                              minimumFractionDigits: 2,
                            })}
                          </CTableDataCell>

                          <CTableDataCell className="text-end fw-semibold">
                            ₦
                            {Number(item.total_cost || 0).toLocaleString('en-NG', {
                              minimumFractionDigits: 2,
                            })}
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              </div>

              {selectedConsumption.reason && (
                <div className="mb-3">
                  <div className="small text-body-secondary">Reason</div>

                  <div>{selectedConsumption.reason}</div>
                </div>
              )}

              {selectedConsumption.notes && (
                <div className="mb-3">
                  <div className="small text-body-secondary">Notes</div>

                  <div>{selectedConsumption.notes}</div>
                </div>
              )}

              {selectedConsumption.status === 'approved' && (
                <CAlert color="success">
                  <strong>Approved</strong>

                  <div className="small mt-1">
                    Approved on {formatDate(selectedConsumption.approved_at)}
                  </div>
                </CAlert>
              )}

              {selectedConsumption.status === 'rejected' && (
                <CAlert color="danger">
                  <strong>Rejected</strong>

                  <div className="small mt-1">{selectedConsumption.rejection_reason}</div>

                  <div className="small mt-1">
                    Rejected on {formatDate(selectedConsumption.rejected_at)}
                  </div>
                </CAlert>
              )}
            </>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton color="light" onClick={() => setShowDetailsModal(false)}>
            Close
          </CButton>

          {selectedConsumption?.status === 'pending' && (
            <>
              <CButton
                color="danger"
                variant="outline"
                disabled={saving}
                onClick={() => openRejectModal(selectedConsumption)}
              >
                <CIcon icon={cilX} className="me-2" />
                Reject
              </CButton>

              <CButton
                color="success"
                disabled={saving}
                onClick={() => handleApprove(selectedConsumption.id)}
              >
                <CIcon icon={cilCheck} className="me-2" />
                Approve & Deduct Stock
              </CButton>
            </>
          )}
        </CModalFooter>
      </CModal>

      {/* =====================================================
          REJECT MODAL
      ====================================================== */}

      <CModal
        visible={showRejectModal}
        onClose={() => !saving && setShowRejectModal(false)}
        size="sm"
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>Reject Request</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <div className="mb-3 text-body-secondary">
            Please provide a reason for rejecting this product usage request.
          </div>

          <CFormLabel className="fw-semibold">Rejection Reason</CFormLabel>

          <CFormInput
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            autoFocus
          />
        </CModalBody>

        <CModalFooter>
          <CButton color="light" disabled={saving} onClick={() => setShowRejectModal(false)}>
            Cancel
          </CButton>

          <CButton color="danger" disabled={saving} onClick={handleReject}>
            {saving ? (
              <CSpinner size="sm" />
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
