import React, { useState } from 'react'

import axios from 'axios'

import Swal from 'sweetalert2'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CForm,
  CFormInput,
  CFormSelect,
  CButton,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'

const AddStaff = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL
  const currentUser = JSON.parse(localStorage.getItem('user'))

  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff',
    position: '',
    salary: '',
    employmentType: 'salary',
    hmoProvider: '',
    hmoNumber: '',
    commissionRate: 0,
    commissionCycle: 'monthly',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('token')

      await axios.post(`${API_URL}api/v1/staff`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Staff created successfully',
      })

      setFormData({
        fullname: '',
        email: '',
        phone: '',
        password: '',
        role: 'staff',
        position: '',
        salary: '',
        employmentType: 'salary',
        hmoProvider: '',
        hmoNumber: '',
        commissionRate: 0,
        commissionCycle: 'monthly',
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to create staff',
      })
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        padding: '24px',
      }}
    >
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div
        style={{
          background: '#111827',
          borderRadius: '18px',
          padding: '24px 28px',
          marginBottom: '24px',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(17, 24, 39, 0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'rgba(232, 189, 53, 0.08)',
            right: '-70px',
            top: '-110px',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                color: '#e8bd35',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Glamour POS
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '800',
                letterSpacing: '-0.5px',
              }}
            >
              Add Staff
            </h2>

            <p
              style={{
                margin: '6px 0 0',
                color: '#9ca3af',
                fontSize: '14px',
              }}
            >
              Create a new staff profile and configure employment details
            </p>
          </div>

          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '15px',
              background: 'rgba(232, 189, 53, 0.12)',
              border: '1px solid rgba(232, 189, 53, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e8bd35',
              fontSize: '22px',
              fontWeight: '800',
            }}
          >
            +
          </div>
        </div>
      </div>

      <CForm onSubmit={handleSubmit}>
        <CRow className="g-4">
          {/* =====================================================
              MAIN FORM
          ====================================================== */}

          <CCol lg={8}>
            {/* =====================================================
                PERSONAL INFORMATION
            ====================================================== */}

            <CCard
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '18px',
                boxShadow: '0 5px 18px rgba(17, 24, 39, 0.06)',
                overflow: 'hidden',
                background: '#fff',
                marginBottom: '20px',
              }}
            >
              <CCardHeader
                style={{
                  background: '#fff',
                  borderBottom: '1px solid #edf0f4',
                  padding: '20px 24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '13px',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: '#111827',
                      color: '#e8bd35',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: '800',
                    }}
                  >
                    01
                  </div>

                  <div>
                    <h5
                      style={{
                        margin: 0,
                        fontWeight: '800',
                        color: '#111827',
                      }}
                    >
                      Personal Information
                    </h5>

                    <small
                      style={{
                        color: '#6b7280',
                      }}
                    >
                      Basic information and account credentials
                    </small>
                  </div>
                </div>
              </CCardHeader>

              <CCardBody
                style={{
                  padding: '24px',
                }}
              >
                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormInput
                      label="Full Name"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleChange}
                      required
                      placeholder="Enter full name"
                      style={{
                        height: '46px',
                        borderRadius: '10px',
                        border: '1px solid #dfe3e8',
                        boxShadow: 'none',
                        fontSize: '14px',
                      }}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormInput
                      label="Email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="staff@example.com"
                      style={{
                        height: '46px',
                        borderRadius: '10px',
                        border: '1px solid #dfe3e8',
                        boxShadow: 'none',
                        fontSize: '14px',
                      }}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormInput
                      label="Phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="080XXXXXXXX"
                      style={{
                        height: '46px',
                        borderRadius: '10px',
                        border: '1px solid #dfe3e8',
                        boxShadow: 'none',
                        fontSize: '14px',
                      }}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormInput
                      type="password"
                      label="Password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Create login password"
                      style={{
                        height: '46px',
                        borderRadius: '10px',
                        border: '1px solid #dfe3e8',
                        boxShadow: 'none',
                        fontSize: '14px',
                      }}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormSelect
                      label="Role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      style={{
                        height: '46px',
                        borderRadius: '10px',
                        border: '1px solid #dfe3e8',
                        boxShadow: 'none',
                        fontSize: '14px',
                      }}
                    >
                      {currentUser?.role === 'admin' && <option value="admin">Admin</option>}

                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                      <option value="staff">Staff</option>
                    </CFormSelect>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* =====================================================
                EMPLOYMENT DETAILS
            ====================================================== */}

            <CCard
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '18px',
                boxShadow: '0 5px 18px rgba(17, 24, 39, 0.06)',
                overflow: 'hidden',
                background: '#fff',
                marginBottom: '20px',
              }}
            >
              <CCardHeader
                style={{
                  background: '#fff',
                  borderBottom: '1px solid #edf0f4',
                  padding: '20px 24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '13px',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: '#111827',
                      color: '#e8bd35',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '800',
                    }}
                  >
                    02
                  </div>

                  <div>
                    <h5
                      style={{
                        margin: 0,
                        fontWeight: '800',
                        color: '#111827',
                      }}
                    >
                      Employment Details
                    </h5>

                    <small
                      style={{
                        color: '#6b7280',
                      }}
                    >
                      Position, salary and commission configuration
                    </small>
                  </div>
                </div>
              </CCardHeader>

              <CCardBody
                style={{
                  padding: '24px',
                }}
              >
                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormInput
                      label="Position"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      placeholder="e.g. Hair Stylist"
                      style={{
                        height: '46px',
                        borderRadius: '10px',
                        border: '1px solid #dfe3e8',
                        boxShadow: 'none',
                        fontSize: '14px',
                      }}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormInput
                      label="Salary"
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      placeholder="Enter salary"
                      style={{
                        height: '46px',
                        borderRadius: '10px',
                        border: '1px solid #dfe3e8',
                        boxShadow: 'none',
                        fontSize: '14px',
                      }}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormSelect
                      label="Employment Type"
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleChange}
                      style={{
                        height: '46px',
                        borderRadius: '10px',
                        border: '1px solid #dfe3e8',
                        boxShadow: 'none',
                        fontSize: '14px',
                      }}
                    >
                      <option value="salary">Salary</option>
                      <option value="commission">Commission</option>
                      <option value="salary_and_commission">Salary + Commission</option>
                    </CFormSelect>
                  </CCol>
                </CRow>

                {/* Commission Settings */}

                {(formData.employmentType === 'commission' ||
                  formData.employmentType === 'salary_and_commission') && (
                  <div
                    style={{
                      marginTop: '20px',
                      padding: '18px',
                      background: '#fffaf0',
                      border: '1px solid #f0d477',
                      borderRadius: '14px',
                    }}
                  >
                    <div
                      style={{
                        color: '#8a6900',
                        fontSize: '12px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        marginBottom: '14px',
                      }}
                    >
                      Commission Settings
                    </div>

                    <CRow className="g-3">
                      <CCol md={6}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '6px',
                          }}
                        >
                          Commission Rate
                        </label>

                        <CInputGroup>
                          <CFormInput
                            type="number"
                            placeholder="Commission Rate"
                            name="commissionRate"
                            value={formData.commissionRate}
                            onChange={handleChange}
                            style={{
                              height: '46px',
                              borderRadius: '10px 0 0 10px',
                              border: '1px solid #dfe3e8',
                              boxShadow: 'none',
                            }}
                          />

                          <CInputGroupText
                            style={{
                              background: '#111827',
                              color: '#e8bd35',
                              border: '1px solid #111827',
                              fontWeight: '800',
                            }}
                          >
                            %
                          </CInputGroupText>
                        </CInputGroup>
                      </CCol>

                      <CCol md={6}>
                        <CFormSelect
                          label="Commission Cycle"
                          name="commissionCycle"
                          value={formData.commissionCycle}
                          onChange={handleChange}
                          style={{
                            height: '46px',
                            borderRadius: '10px',
                            border: '1px solid #dfe3e8',
                            boxShadow: 'none',
                          }}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </CFormSelect>
                      </CCol>
                    </CRow>
                  </div>
                )}
              </CCardBody>
            </CCard>

            {/* =====================================================
                HMO INFORMATION
            ====================================================== */}

            <CCard
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '18px',
                boxShadow: '0 5px 18px rgba(17, 24, 39, 0.06)',
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <CCardHeader
                style={{
                  background: '#fff',
                  borderBottom: '1px solid #edf0f4',
                  padding: '20px 24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '13px',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: '#111827',
                      color: '#e8bd35',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '800',
                    }}
                  >
                    03
                  </div>

                  <div>
                    <h5
                      style={{
                        margin: 0,
                        fontWeight: '800',
                        color: '#111827',
                      }}
                    >
                      HMO Information
                    </h5>

                    <small
                      style={{
                        color: '#6b7280',
                      }}
                    >
                      Health insurance information for this staff member
                    </small>
                  </div>
                </div>
              </CCardHeader>

              <CCardBody
                style={{
                  padding: '24px',
                }}
              >
                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormInput
                      label="HMO Provider"
                      name="hmoProvider"
                      value={formData.hmoProvider}
                      onChange={handleChange}
                      placeholder="Enter HMO provider"
                      style={{
                        height: '46px',
                        borderRadius: '10px',
                        border: '1px solid #dfe3e8',
                        boxShadow: 'none',
                        fontSize: '14px',
                      }}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormInput
                      label="HMO Number"
                      name="hmoNumber"
                      value={formData.hmoNumber}
                      onChange={handleChange}
                      placeholder="Enter HMO number"
                      style={{
                        height: '46px',
                        borderRadius: '10px',
                        border: '1px solid #dfe3e8',
                        boxShadow: 'none',
                        fontSize: '14px',
                      }}
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </CCol>

          {/* =====================================================
              RIGHT SIDEBAR / SUMMARY
          ====================================================== */}

          <CCol lg={4}>
            <div
              style={{
                position: 'sticky',
                top: '20px',
              }}
            >
              <CCard
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '18px',
                  boxShadow: '0 5px 18px rgba(17, 24, 39, 0.06)',
                  overflow: 'hidden',
                  background: '#fff',
                }}
              >
                <CCardHeader
                  style={{
                    background: '#111827',
                    color: '#fff',
                    border: 'none',
                    padding: '20px',
                  }}
                >
                  <div
                    style={{
                      color: '#e8bd35',
                      fontSize: '11px',
                      fontWeight: '700',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      marginBottom: '5px',
                    }}
                  >
                    Staff Preview
                  </div>

                  <div
                    style={{
                      fontSize: '19px',
                      fontWeight: '800',
                    }}
                  >
                    Account Summary
                  </div>
                </CCardHeader>

                <CCardBody
                  style={{
                    padding: '24px',
                  }}
                >
                  {/* Avatar */}

                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, #111827, #374151)',
                      color: '#e8bd35',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '27px',
                      fontWeight: '800',
                      marginBottom: '15px',
                    }}
                  >
                    {formData.fullname?.charAt(0)?.toUpperCase() || 'S'}
                  </div>

                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      color: '#111827',
                      wordBreak: 'break-word',
                    }}
                  >
                    {formData.fullname || 'New Staff Member'}
                  </div>

                  <div
                    style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginTop: '4px',
                      marginBottom: '22px',
                    }}
                  >
                    {formData.position || 'Position not specified'}
                  </div>

                  {/* Summary rows */}

                  <div
                    style={{
                      borderTop: '1px solid #edf0f4',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '14px 0',
                        borderBottom: '1px solid #edf0f4',
                      }}
                    >
                      <span
                        style={{
                          color: '#6b7280',
                          fontSize: '12px',
                        }}
                      >
                        Role
                      </span>

                      <span
                        style={{
                          background: '#f3f4f6',
                          color: '#111827',
                          borderRadius: '20px',
                          padding: '5px 10px',
                          fontSize: '11px',
                          fontWeight: '800',
                          textTransform: 'capitalize',
                        }}
                      >
                        {formData.role}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '14px 0',
                        borderBottom: '1px solid #edf0f4',
                      }}
                    >
                      <span
                        style={{
                          color: '#6b7280',
                          fontSize: '12px',
                        }}
                      >
                        Employment
                      </span>

                      <span
                        style={{
                          color: '#111827',
                          fontSize: '12px',
                          fontWeight: '700',
                          textAlign: 'right',
                        }}
                      >
                        {formData.employmentType === 'salary_and_commission'
                          ? 'Salary + Commission'
                          : formData.employmentType}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '14px 0',
                        borderBottom: '1px solid #edf0f4',
                      }}
                    >
                      <span
                        style={{
                          color: '#6b7280',
                          fontSize: '12px',
                        }}
                      >
                        Salary
                      </span>

                      <span
                        style={{
                          color: '#111827',
                          fontSize: '13px',
                          fontWeight: '800',
                        }}
                      >
                        ₦{formData.salary ? Number(formData.salary).toLocaleString() : '0'}
                      </span>
                    </div>

                    {(formData.employmentType === 'commission' ||
                      formData.employmentType === 'salary_and_commission') && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '14px 0',
                        }}
                      >
                        <span
                          style={{
                            color: '#6b7280',
                            fontSize: '12px',
                          }}
                        >
                          Commission
                        </span>

                        <span
                          style={{
                            color: '#a07800',
                            fontSize: '13px',
                            fontWeight: '800',
                          }}
                        >
                          {formData.commissionRate || 0}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Security notice */}

                  <div
                    style={{
                      marginTop: '20px',
                      padding: '14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div
                      style={{
                        color: '#111827',
                        fontSize: '12px',
                        fontWeight: '800',
                        marginBottom: '4px',
                      }}
                    >
                      Account Security
                    </div>

                    <div
                      style={{
                        color: '#6b7280',
                        fontSize: '11px',
                        lineHeight: '1.5',
                      }}
                    >
                      The staff member will use the email, phone and password provided to access the
                      system according to their assigned role.
                    </div>
                  </div>

                  {/* Save */}

                  <CButton
                    type="submit"
                    style={{
                      width: '100%',
                      marginTop: '20px',
                      background: 'linear-gradient(135deg, #e8bd35, #c9a227)',
                      color: '#111827',
                      border: 'none',
                      borderRadius: '11px',
                      padding: '13px 20px',
                      fontWeight: '800',
                      fontSize: '14px',
                      boxShadow: '0 6px 16px rgba(201, 162, 39, 0.22)',
                    }}
                  >
                    Save Staff
                  </CButton>
                </CCardBody>
              </CCard>
            </div>
          </CCol>
        </CRow>
      </CForm>
    </div>
  )
}

export default AddStaff
