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
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CProgress,
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
  cilCheckCircle,
  cilCloudDownload,
  cilPencil,
  cilPlus,
  cilReload,
  cilSearch,
  cilSettings,
  cilTrash,
  cilXCircle,
} from '@coreui/icons'

const ServiceCommission = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  // ==========================================
  // STATE
  // ==========================================

  const [services, setServices] = useState([])
  const [commissions, setCommissions] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')

  const [defaultStaffPercentage, setDefaultStaffPercentage] = useState(30)

  const [defaultOwnerPercentage, setDefaultOwnerPercentage] = useState(70)

  const [showModal, setShowModal] = useState(false)

  const [editingCommission, setEditingCommission] = useState(null)

  const [selectedService, setSelectedService] = useState('')

  const [staffPercentage, setStaffPercentage] = useState(30)

  const [isActive, setIsActive] = useState(true)

  const [message, setMessage] = useState({
    type: '',
    text: '',
  })

  // ==========================================
  // TOKEN
  // ==========================================

  const token = localStorage.getItem('token')

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  // ==========================================
  // FETCH SERVICES
  // ==========================================

  const getServices = async () => {
    try {
      const response = await axios.get(`${API_URL}api/v1/services`, axiosConfig)

      setServices(response.data.data || response.data || [])
    } catch (error) {
      console.error('Failed to fetch services:', error)

      showMessage('danger', 'Unable to load services.')
    }
  }

  // ==========================================
  // FETCH COMMISSIONS
  // ==========================================

  const getCommissions = async () => {
    try {
      const response = await axios.get(`${API_URL}api/v1/service-commissions`, axiosConfig)

      setCommissions(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch commissions:', error)

      showMessage('danger', 'Unable to load commission settings.')
    }
  }

  // ==========================================
  // LOAD DATA
  // ==========================================

  const loadData = async () => {
    try {
      setLoading(true)

      await Promise.all([getServices(), getCommissions()])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ==========================================
  // MESSAGE
  // ==========================================

  const showMessage = (type, text) => {
    setMessage({
      type,
      text,
    })

    setTimeout(() => {
      setMessage({
        type: '',
        text: '',
      })
    }, 4000)
  }

  // ==========================================
  // OWNER PERCENTAGE
  // ==========================================

  const calculateOwnerPercentage = (staff) => {
    const value = Number(staff)

    if (Number.isNaN(value)) {
      return 100
    }

    return Math.max(0, Math.min(100, 100 - value))
  }

  // ==========================================
  // OPEN CREATE MODAL
  // ==========================================

  const openCreateModal = () => {
    setEditingCommission(null)
    setSelectedService('')
    setStaffPercentage(defaultStaffPercentage)
    setIsActive(true)

    setShowModal(true)
  }

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const openEditModal = (commission) => {
    setEditingCommission(commission)

    setSelectedService(commission.service_id)

    setStaffPercentage(Number(commission.staff_percentage))

    setIsActive(commission.is_active)

    setShowModal(true)
  }

  // ==========================================
  // SAVE COMMISSION
  // ==========================================

  const saveCommission = async () => {
    if (!selectedService) {
      showMessage('danger', 'Please select a service.')

      return
    }

    const percentage = Number(staffPercentage)

    if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
      showMessage('danger', 'Staff commission must be between 0% and 100%.')

      return
    }

    try {
      setSaving(true)

      await axios.post(
        `${API_URL}api/v1/service-commissions`,
        {
          service_id: selectedService,
          staff_percentage: percentage,
          is_active: isActive,
        },
        axiosConfig,
      )

      showMessage('success', 'Commission setting saved successfully.')

      setShowModal(false)

      await getCommissions()
    } catch (error) {
      console.error('Save commission error:', error)

      showMessage('danger', error.response?.data?.message || 'Failed to save commission setting.')
    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // DELETE COMMISSION
  // ==========================================

  const deleteCommission = async (commission) => {
    const serviceName = commission.Service?.name || 'this service'

    const confirmed = window.confirm(
      `Remove the custom commission for ${serviceName}? This service will return to the default commission.`,
    )

    if (!confirmed) return

    try {
      setSaving(true)

      await axios.delete(
        `${API_URL}api/v1/service-commissions/${commission.service_id}`,
        axiosConfig,
      )

      showMessage('success', `${serviceName} has been reset to the default commission.`)

      await getCommissions()
    } catch (error) {
      console.error('Delete commission error:', error)

      showMessage('danger', error.response?.data?.message || 'Failed to remove commission.')
    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // TOGGLE COMMISSION
  // ==========================================

  const toggleCommission = async (commission) => {
    try {
      await axios.patch(
        `${API_URL}api/v1/service-commissions/${commission.service_id}/toggle`,
        {},
        axiosConfig,
      )

      showMessage(
        'success',
        commission.is_active ? 'Custom commission disabled.' : 'Custom commission enabled.',
      )

      await getCommissions()
    } catch (error) {
      console.error('Toggle commission error:', error)

      showMessage('danger', 'Failed to update commission status.')
    }
  }

  // ==========================================
  // DEFAULT COMMISSION
  // ==========================================

  const handleDefaultStaffChange = (value) => {
    const percentage = Number(value)

    if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
      return
    }

    setDefaultStaffPercentage(percentage)

    setDefaultOwnerPercentage(100 - percentage)
  }

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredServices = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    return services.filter((service) => service.name?.toLowerCase().includes(keyword))
  }, [services, search])

  // ==========================================
  // COMMISSION LOOKUP
  // ==========================================

  const commissionMap = useMemo(() => {
    const map = {}

    commissions.forEach((commission) => {
      map[commission.service_id] = commission
    })

    return map
  }, [commissions])

  // ==========================================
  // STATISTICS
  // ==========================================

  const totalServices = services.length

  const customServices = commissions.length

  const activeCustomServices = commissions.filter((item) => item.is_active).length

  const inactiveCustomServices = commissions.filter((item) => !item.is_active).length

  // ==========================================
  // SERVICE NAME
  // ==========================================

  const getServiceName = (serviceId) => {
    const service = services.find((item) => Number(item.id) === Number(serviceId))

    return service?.name || 'Unknown Service'
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="service-commission-settings">
      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody className="p-4">
          <CRow className="align-items-center">
            <CCol md={8}>
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '55px',
                    height: '55px',
                  }}
                >
                  <CIcon icon={cilSettings} size="xl" className="text-primary" />
                </div>

                <div>
                  <h3 className="mb-1 fw-bold">Staff Commission</h3>

                  <p className="text-medium-emphasis mb-0">
                    Configure how service revenue is shared between your business and service
                    providers.
                  </p>
                </div>
              </div>
            </CCol>

            <CCol md={4} className="text-md-end mt-3 mt-md-0">
              <CButton color="light" className="me-2" onClick={loadData} disabled={loading}>
                <CIcon icon={cilReload} className="me-1" />
                Refresh
              </CButton>

              <CButton color="primary" onClick={openCreateModal}>
                <CIcon icon={cilPlus} className="me-1" />
                Add Custom Rule
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* ======================================
          ALERT
      ====================================== */}

      {message.text && (
        <CAlert
          color={message.type}
          dismissible
          onClose={() =>
            setMessage({
              type: '',
              text: '',
            })
          }
        >
          {message.text}
        </CAlert>
      )}

      {/* ======================================
          STATISTICS
      ====================================== */}

      <CRow className="mb-4">
        <CCol md={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-medium-emphasis small">Total Services</div>

                  <h3 className="fw-bold mt-2 mb-0">{totalServices}</h3>
                </div>

                <CIcon icon={cilSettings} size="xl" className="text-primary" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-medium-emphasis small">Custom Rules</div>

                  <h3 className="fw-bold mt-2 mb-0">{customServices}</h3>
                </div>

                <CIcon icon={cilPencil} size="xl" className="text-info" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-medium-emphasis small">Active Rules</div>

                  <h3 className="fw-bold mt-2 mb-0 text-success">{activeCustomServices}</h3>
                </div>

                <CIcon icon={cilCheckCircle} size="xl" className="text-success" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-medium-emphasis small">Default Staff Share</div>

                  <h3 className="fw-bold mt-2 mb-0">{defaultStaffPercentage}%</h3>
                </div>

                <CIcon icon={cilCloudDownload} size="xl" className="text-warning" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ======================================
          DEFAULT COMMISSION
      ====================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="bg-white py-3">
          <div className="d-flex align-items-center">
            <CIcon icon={cilSettings} className="text-primary me-2" />

            <div>
              <h5 className="mb-0 fw-bold">Default Commission</h5>

              <small className="text-medium-emphasis">
                Applied automatically to services without a custom commission rule.
              </small>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <CRow>
            <CCol lg={4} md={6}>
              <CFormLabel className="fw-semibold">Default Staff Commission</CFormLabel>

              <div className="input-group">
                <CFormInput
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={defaultStaffPercentage}
                  onChange={(e) => handleDefaultStaffChange(e.target.value)}
                />

                <span className="input-group-text">%</span>
              </div>

              <small className="text-medium-emphasis">
                Percentage paid to the service provider.
              </small>
            </CCol>

            <CCol lg={4} md={6}>
              <CFormLabel className="fw-semibold">Business Share</CFormLabel>

              <div className="input-group">
                <CFormInput value={defaultOwnerPercentage} readOnly />

                <span className="input-group-text">%</span>
              </div>

              <small className="text-medium-emphasis">Automatically calculated.</small>
            </CCol>

            <CCol lg={4} md={12} className="mt-4 mt-lg-0">
              <div className="p-3 rounded bg-light">
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-semibold">Revenue Distribution</span>

                  <span className="small text-medium-emphasis">100%</span>
                </div>

                <CProgress height={12} className="mb-2">
                  <CProgress value={defaultStaffPercentage} color="primary" />

                  <CProgress value={defaultOwnerPercentage} color="success" />
                </CProgress>

                <div className="d-flex justify-content-between small">
                  <span>
                    <span className="text-primary fw-bold">●</span> Staff {defaultStaffPercentage}%
                  </span>

                  <span>
                    <span className="text-success fw-bold">●</span> Business{' '}
                    {defaultOwnerPercentage}%
                  </span>
                </div>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* ======================================
          CUSTOM COMMISSION RULES
      ====================================== */}

      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-white py-3">
          <CRow className="align-items-center">
            <CCol md={6}>
              <h5 className="mb-1 fw-bold">Service-Specific Commission</h5>

              <small className="text-medium-emphasis">
                Override the default percentage for selected services.
              </small>
            </CCol>

            <CCol md={6} className="mt-3 mt-md-0">
              <div className="position-relative">
                <CIcon
                  icon={cilSearch}
                  className="position-absolute"
                  style={{
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 5,
                  }}
                />

                <CFormInput
                  placeholder="Search services..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    paddingLeft: '38px',
                  }}
                />
              </div>
            </CCol>
          </CRow>
        </CCardHeader>

        <CCardBody className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />

              <div className="mt-3 text-medium-emphasis">Loading commission settings...</div>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-5">
              <CIcon icon={cilSearch} size="xxl" className="text-medium-emphasis mb-3" />

              <h5>No services found</h5>

              <p className="text-medium-emphasis">Try changing your search.</p>
            </div>
          ) : (
            <CTable hover responsive align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell className="ps-4">SERVICE</CTableHeaderCell>

                  <CTableHeaderCell>COMMISSION TYPE</CTableHeaderCell>

                  <CTableHeaderCell>STAFF</CTableHeaderCell>

                  <CTableHeaderCell>BUSINESS</CTableHeaderCell>

                  <CTableHeaderCell>DISTRIBUTION</CTableHeaderCell>

                  <CTableHeaderCell>STATUS</CTableHeaderCell>

                  <CTableHeaderCell className="text-end pe-4">ACTIONS</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredServices.map((service) => {
                  const commission = commissionMap[service.id]

                  const isCustom = !!commission

                  const active = commission ? commission.is_active : true

                  const staff =
                    commission && active
                      ? Number(commission.staff_percentage)
                      : defaultStaffPercentage

                  const owner = 100 - staff

                  return (
                    <CTableRow key={service.id}>
                      {/* SERVICE */}
                      <CTableDataCell className="ps-4">
                        <div className="fw-semibold">{service.name}</div>

                        {service.description && (
                          <small className="text-medium-emphasis">{service.description}</small>
                        )}
                      </CTableDataCell>

                      {/* TYPE */}
                      <CTableDataCell>
                        {isCustom ? (
                          <CBadge color="info" className="px-3 py-2">
                            Custom
                          </CBadge>
                        ) : (
                          <CBadge color="secondary" className="px-3 py-2">
                            Default
                          </CBadge>
                        )}
                      </CTableDataCell>

                      {/* STAFF */}
                      <CTableDataCell>
                        <span className="fw-bold text-primary">{staff}%</span>
                      </CTableDataCell>

                      {/* BUSINESS */}
                      <CTableDataCell>
                        <span className="fw-bold text-success">{owner}%</span>
                      </CTableDataCell>

                      {/* DISTRIBUTION */}
                      <CTableDataCell
                        style={{
                          minWidth: '180px',
                        }}
                      >
                        <div className="mb-1 small d-flex justify-content-between">
                          <span>Staff</span>

                          <span>{staff}%</span>
                        </div>

                        <CProgress height={7} value={staff} />

                        <div className="mt-1 small d-flex justify-content-between text-medium-emphasis">
                          <span>Business</span>

                          <span>{owner}%</span>
                        </div>
                      </CTableDataCell>

                      {/* STATUS */}
                      <CTableDataCell>
                        {isCustom ? (
                          active ? (
                            <CBadge color="success" className="px-3 py-2">
                              <CIcon icon={cilCheckCircle} className="me-1" />
                              Active
                            </CBadge>
                          ) : (
                            <CBadge color="secondary" className="px-3 py-2">
                              <CIcon icon={cilXCircle} className="me-1" />
                              Disabled
                            </CBadge>
                          )
                        ) : (
                          <CBadge color="success" variant="outline" className="px-3 py-2">
                            Using Default
                          </CBadge>
                        )}
                      </CTableDataCell>

                      {/* ACTIONS */}
                      <CTableDataCell className="text-end pe-4">
                        {isCustom ? (
                          <>
                            <CButton
                              color="light"
                              size="sm"
                              className="me-1"
                              title="Edit"
                              onClick={() => openEditModal(commission)}
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>

                            <CButton
                              color={active ? 'warning' : 'success'}
                              size="sm"
                              className="me-1"
                              title={active ? 'Disable' : 'Enable'}
                              onClick={() => toggleCommission(commission)}
                            >
                              <CIcon icon={active ? cilXCircle : cilCheckCircle} />
                            </CButton>

                            <CButton
                              color="danger"
                              size="sm"
                              title="Reset to default"
                              onClick={() => deleteCommission(commission)}
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </>
                        ) : (
                          <CButton
                            color="primary"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedService(service.id)

                              setStaffPercentage(defaultStaffPercentage)

                              setIsActive(true)

                              setEditingCommission(null)

                              setShowModal(true)
                            }}
                          >
                            <CIcon icon={cilPlus} className="me-1" />
                            Customize
                          </CButton>
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* ======================================
          COMMISSION MODAL
      ====================================== */}

      <CModal
        visible={showModal}
        onClose={() => !saving && setShowModal(false)}
        size="lg"
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle className="fw-bold">
            {editingCommission ? 'Edit Commission Rule' : 'Create Commission Rule'}
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          <div className="mb-4">
            <CFormLabel className="fw-semibold">Service</CFormLabel>

            <CFormSelect
              value={selectedService}
              disabled={!!editingCommission}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              <option value="">Select a service...</option>

              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </CFormSelect>
          </div>

          <CRow>
            <CCol md={6}>
              <CFormLabel className="fw-semibold">Staff Commission</CFormLabel>

              <div className="input-group input-group-lg">
                <CFormInput
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={staffPercentage}
                  onChange={(e) => setStaffPercentage(e.target.value)}
                />

                <span className="input-group-text">%</span>
              </div>

              <small className="text-medium-emphasis">
                Percentage paid to the service provider.
              </small>
            </CCol>

            <CCol md={6}>
              <CFormLabel className="fw-semibold">Business Share</CFormLabel>

              <div className="input-group input-group-lg">
                <CFormInput value={calculateOwnerPercentage(staffPercentage)} readOnly />

                <span className="input-group-text">%</span>
              </div>

              <small className="text-medium-emphasis">Automatically calculated.</small>
            </CCol>
          </CRow>

          {/* DISTRIBUTION PREVIEW */}

          <div className="mt-4 p-4 rounded border bg-light">
            <div className="d-flex justify-content-between mb-3">
              <div>
                <h6 className="fw-bold mb-1">Commission Preview</h6>

                <small className="text-medium-emphasis">
                  Revenue distribution for this service.
                </small>
              </div>

              <CBadge color="primary">100%</CBadge>
            </div>

            <CProgress height={16} className="mb-3">
              <CProgress value={Number(staffPercentage || 0)} color="primary" />

              <CProgress value={calculateOwnerPercentage(staffPercentage)} color="success" />
            </CProgress>

            <CRow>
              <CCol xs={6}>
                <div className="d-flex align-items-center">
                  <span
                    className="bg-primary rounded-circle me-2"
                    style={{
                      width: 10,
                      height: 10,
                    }}
                  />

                  <div>
                    <small className="text-medium-emphasis">Staff</small>

                    <div className="fw-bold">{Number(staffPercentage || 0)}%</div>
                  </div>
                </div>
              </CCol>

              <CCol xs={6} className="text-end">
                <div className="d-flex align-items-center justify-content-end">
                  <div>
                    <small className="text-medium-emphasis">Business</small>

                    <div className="fw-bold">{calculateOwnerPercentage(staffPercentage)}%</div>
                  </div>

                  <span
                    className="bg-success rounded-circle ms-2"
                    style={{
                      width: 10,
                      height: 10,
                    }}
                  />
                </div>
              </CCol>
            </CRow>
          </div>

          {/* STATUS */}

          <div className="mt-4">
            <CFormCheck
              id="commissionActive"
              label="Enable this custom commission rule"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />

            <small className="text-medium-emphasis d-block ms-4 mt-1">
              When disabled, the service will use the default commission.
            </small>
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton color="light" onClick={() => setShowModal(false)} disabled={saving}>
            Cancel
          </CButton>

          <CButton color="primary" onClick={saveCommission} disabled={saving}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <CIcon icon={cilCheckCircle} className="me-1" />
                Save Commission
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default ServiceCommission
