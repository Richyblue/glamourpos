import { useState } from 'react'

import { CCard, CCardBody, CButton, CFormSelect, CSpinner, CAlert } from '@coreui/react'

import { clockIn, goOut, returnBack, clockOut } from '../services/kioskApi'
import Swal from 'sweetalert2'

const ActionScreen = ({ staff, nextAction, setScreen, setSuccessData }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [reason, setReason] = useState('restroom')
  const [expectedReturn, setExpectedReturn] = useState(15)

  // Robust staff name extraction
  const staffName =
    staff?.fullname ||
    staff?.name ||
    staff?.User?.fullname ||
    staff?.user?.fullname ||
    'Staff Member'

  const staffPosition =
    staff?.position || staff?.User?.position || staff?.user?.position || 'Team Member'

  const staffInitial = staffName.charAt(0).toUpperCase()

  // Emergency clock-out is available only after clock-in,
  // when the staff member is inside the salon.
  const canEmergencyClockOut = ['goout', 'clockout'].includes(nextAction)

  const performAction = async () => {
    if (loading) return

    try {
      setLoading(true)
      setError('')

      const payload = {
        qrCode: staff.qrCode,
      }

      let response

      switch (nextAction) {
        case 'clockin':
          response = await clockIn(payload)
          break

        case 'goout':
          response = await goOut({
            qrCode: staff.qrCode,
            reason,
            expectedReturn,
          })
          break

        case 'return':
          response = await returnBack(payload)
          break

        case 'clockout':
          response = await clockOut(payload)
          break

        default:
          throw new Error('Invalid attendance action')
      }

      console.log('Kiosk action successful:', response)

      setSuccessData({
        action: nextAction,
        response: response.data,
      })

      setScreen('success')
    } catch (err) {
      console.error('Kiosk action failed:', err)

      setError(err.response?.data?.message || err.message || 'Operation Failed')
    } finally {
      setLoading(false)
    }
  }

  // Emergency Clock Out
  const performEmergencyClockOut = async () => {
    if (loading) return

    if (!canEmergencyClockOut) {
      setError(
        'Emergency clock-out is only available after clock-in when you are inside the salon.',
      )
      return
    }

    const result = await Swal.fire({
      title: 'Emergency Clock Out?',
      html: `
        <div style="text-align: left;">
          <p>You are about to end your attendance for today.</p>
          <p><strong>Staff:</strong> ${staffName}</p>
          <p style="color: #dc3545;">
            This action will record your clock-out immediately.
          </p>
          <p>Are you sure you want to continue?</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Clock Out',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      reverseButtons: true,
      focusCancel: true,
    })

    if (!result.isConfirmed) return

    try {
      setLoading(true)
      setError('')

      const payload = {
        qrCode: staff.qrCode,
      }

      const response = await clockOut(payload)

      console.log('Emergency clock-out successful:', response)

      setSuccessData({
        action: 'clockout',
        response: response.data,
      })

      setScreen('success')
    } catch (err) {
      console.error('Emergency clock-out failed:', err)

      setError(
        err.response?.data?.message ||
          err.message ||
          'Emergency clock-out failed. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const getButtonColor = () => {
    switch (nextAction) {
      case 'clockin':
        return 'success'

      case 'goout':
        return 'warning'

      case 'return':
        return 'info'

      case 'clockout':
        return 'danger'

      default:
        return 'primary'
    }
  }

  const getTitle = () => {
    switch (nextAction) {
      case 'clockin':
        return 'CLOCK IN'

      case 'goout':
        return 'GO OUT'

      case 'return':
        return 'RETURN'

      case 'clockout':
        return 'CLOCK OUT'

      default:
        return 'CONTINUE'
    }
  }

  const getDescription = () => {
    switch (nextAction) {
      case 'clockin':
        return 'Confirm your attendance for today'

      case 'goout':
        return 'Record that you are leaving the salon'

      case 'return':
        return 'Confirm that you have returned to the salon'

      case 'clockout':
        return 'Complete your attendance for today'

      default:
        return ''
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background:
          'radial-gradient(circle at top left, #292015 0%, transparent 35%), linear-gradient(135deg, #080808 0%, #151515 50%, #080808 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 18px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Luxury background glow */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'rgba(212,175,55,0.09)',
          filter: 'blur(100px)',
          top: -220,
          left: -150,
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'rgba(212,175,55,0.06)',
          filter: 'blur(100px)',
          bottom: -200,
          right: -150,
        }}
      />

      {/* Main terminal */}
      <CCard
        className="border-0"
        style={{
          width: '100%',
          maxWidth: 950,
          borderRadius: 26,
          overflow: 'hidden',
          position: 'relative',
          zIndex: 2,
          background: '#111111',
          boxShadow: '0 30px 90px rgba(0,0,0,0.55)',
          border: '1px solid rgba(212,175,55,0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 35px',
            borderBottom: '1px solid rgba(212,175,55,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#0c0c0c',
            flexWrap: 'wrap',
            gap: 15,
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 15,
                background: 'linear-gradient(145deg, #e5c76b, #a77b20)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#111',
                fontSize: 24,
                fontWeight: 900,
                boxShadow: '0 5px 20px rgba(212,175,55,0.2)',
              }}
            >
              G
            </div>

            <div>
              <div
                style={{
                  fontSize: 21,
                  fontWeight: 800,
                  color: '#f5e5b0',
                  letterSpacing: 0.4,
                }}
              >
                Glamour Unisex Salon
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: '#a1a1aa',
                  marginTop: 3,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                Premium Staff Attendance Terminal
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              fontSize: 12,
              color: '#d4af37',
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              padding: '9px 15px',
              borderRadius: 30,
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                background: '#22c55e',
                borderRadius: '50%',
                display: 'inline-block',
                boxShadow: '0 0 10px rgba(34,197,94,0.7)',
              }}
            />
            Kiosk Online
          </div>
        </div>

        <CCardBody
          style={{
            padding: '45px 30px',
            textAlign: 'center',
            background: 'linear-gradient(180deg, #171717 0%, #101010 100%)',
          }}
        >
          {/* Staff identity section */}
          <div
            style={{
              maxWidth: 750,
              margin: '0 auto 35px',
              padding: '30px 20px',
              borderRadius: 22,
              background: 'linear-gradient(145deg, rgba(212,175,55,0.12), rgba(255,255,255,0.025))',
              border: '1px solid rgba(212,175,55,0.25)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {/* Staff avatar */}
            <div
              style={{
                width: 112,
                height: 112,
                margin: '0 auto 18px',
                borderRadius: '50%',
                padding: 4,
                background: 'linear-gradient(135deg, #f8e7a1, #b8860b, #f8e7a1)',
                boxShadow: '0 0 35px rgba(212,175,55,0.2)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'linear-gradient(145deg, #292929, #080808)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f5df9b',
                  fontSize: 43,
                  fontWeight: 900,
                }}
              >
                {staffInitial}
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#d4af37',
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Welcome Back
            </div>

            {/* Highly visible staff name */}
            <h1
              style={{
                fontSize: 'clamp(30px, 5vw, 48px)',
                fontWeight: 900,
                color: '#ffffff',
                margin: '0 auto 10px',
                lineHeight: 1.2,
                letterSpacing: 0.5,
                textShadow: '0 3px 18px rgba(0,0,0,0.7)',
                overflowWrap: 'anywhere',
                maxWidth: '100%',
              }}
            >
              {staffName}
            </h1>

            <div
              style={{
                width: 75,
                height: 3,
                background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
                margin: '15px auto',
              }}
            />

            <div
              style={{
                fontSize: 15,
                color: '#e5c76b',
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              {staffPosition}
            </div>

            <div
              style={{
                marginTop: 18,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 15px',
                borderRadius: 30,
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)',
                color: '#86efac',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  background: '#22c55e',
                  borderRadius: '50%',
                }}
              />
              Staff Identity Recognised
            </div>
          </div>

          {/* Action */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              borderRadius: 20,
              padding: 30,
              maxWidth: 650,
              margin: '0 auto',
              boxShadow: '0 15px 40px rgba(0,0,0,0.18)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#9a7625',
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 10,
              }}
            >
              Attendance Action
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: '#111827',
                marginBottom: 8,
              }}
            >
              {getTitle()}
            </div>

            <div
              style={{
                fontSize: 14,
                color: '#6b7280',
                marginBottom: 25,
              }}
            >
              {getDescription()}
            </div>

            {/* GO OUT options */}
            {nextAction === 'goout' && (
              <div
                style={{
                  textAlign: 'left',
                  marginBottom: 25,
                }}
              >
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: 8,
                    display: 'block',
                  }}
                >
                  Reason for Leaving
                </label>

                <CFormSelect
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mb-4"
                  size="lg"
                >
                  <option value="restroom">Restroom</option>
                  <option value="buy_material">Buy Materials</option>
                  <option value="bank">Bank</option>
                  <option value="lunch">Lunch</option>
                  <option value="official">Official Assignment</option>
                  <option value="personal">Personal</option>
                </CFormSelect>

                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: 8,
                    display: 'block',
                  }}
                >
                  Expected Return
                </label>

                <CFormSelect
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  size="lg"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </CFormSelect>
              </div>
            )}

            {/* Error */}
            {error && (
              <CAlert color="danger" className="mb-4">
                {error}
              </CAlert>
            )}

            {/* Confirm */}
            <CButton
              color={getButtonColor()}
              size="lg"
              disabled={loading}
              onClick={performAction}
              style={{
                width: '100%',
                minHeight: 60,
                borderRadius: 14,
                fontSize: 17,
                fontWeight: 800,
              }}
            >
              {loading ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                getTitle()
              )}
            </CButton>

            {/* Cancel */}
            <CButton
              color="light"
              size="lg"
              disabled={loading}
              onClick={() => setScreen('scan')}
              style={{
                width: '100%',
                minHeight: 55,
                marginTop: 12,
                borderRadius: 14,
                fontWeight: 700,
              }}
            >
              Cancel
            </CButton>

            {/* Emergency Clock Out */}
            {canEmergencyClockOut && (
              <>
                <CButton
                  color="danger"
                  variant="outline"
                  size="lg"
                  disabled={loading}
                  onClick={performEmergencyClockOut}
                  style={{
                    width: '100%',
                    minHeight: 52,
                    marginTop: 18,
                    borderRadius: 14,
                    fontWeight: 800,
                    borderWidth: 1.5,
                  }}
                >
                  {loading ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    'EMERGENCY CLOCK OUT'
                  )}
                </CButton>

                <div className="small text-body-secondary mt-2" style={{ textAlign: 'center' }}>
                  Use only when you need to end your attendance unexpectedly.
                </div>
              </>
            )}
          </div>
        </CCardBody>

        {/* Footer */}
        <div
          style={{
            padding: '18px 30px',
            borderTop: '1px solid rgba(212,175,55,0.2)',
            background: '#090909',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            fontSize: 11,
            color: '#a1a1aa',
            letterSpacing: 0.5,
          }}
        >
          <span>© {new Date().getFullYear()} Glamour Unisex Salon</span>

          <span style={{ color: '#d4af37' }}>EXCELLENCE IN EVERY DETAIL</span>
        </div>
      </CCard>
    </div>
  )
}

export default ActionScreen
