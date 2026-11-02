import { useEffect, useRef, useState } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CSpinner,
} from '@coreui/react'

import axios from 'axios'
import { toPng, toJpeg } from 'html-to-image'

const API_URL = import.meta.env.VITE_BACKEND_URL

const GOLD = '#D4AF37'
const LIGHT_GOLD = '#F5DE9A'
const BLACK = '#080808'

const CARD_WIDTH = 380
const CARD_HEIGHT = 660

const StaffIDCardModal = ({ visible, onClose, staff }) => {
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [qrImage, setQrImage] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [exportError, setExportError] = useState('')

  const cardRef = useRef(null)

  // LOAD STAFF QR CODE
  useEffect(() => {
    if (!visible || !staff?.id) return

    let active = true

    const loadQRCode = async () => {
      try {
        setLoading(true)
        setQrImage('')
        setQrCode('')
        setExportError('')

        const token = localStorage.getItem('token')

        const response = await axios.get(`${API_URL}api/v1/${staff.id}/qrcode`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!active) return

        setQrImage(response.data.qrImage)
        setQrCode(response.data.qrCode)
      } catch (error) {
        console.error('Failed to load QR code:', error)

        if (active) {
          setExportError(
            error.response?.data?.message || 'Unable to load staff attendance QR code.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadQRCode()

    return () => {
      active = false
    }
  }, [visible, staff?.id])

  // STAFF INFORMATION
  const staffName = staff?.User?.fullname || 'Staff Member'
  const position = staff?.position || 'Staff'

  const initials = staffName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')

  const safeName =
    staffName
      .trim()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '') || 'staff'

  // WAIT FOR IMAGES TO LOAD BEFORE EXPORT
  const waitForImages = async (element) => {
    const images = Array.from(element.querySelectorAll('img'))

    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) {
          return Promise.resolve()
        }

        return new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = () => reject(new Error('An image could not be loaded for export.'))
        })
      }),
    )
  }

  // DOWNLOAD PNG / JPG / JPEG
  const downloadCard = async (format) => {
    if (!cardRef.current || !qrImage || exporting) return

    try {
      setExporting(true)
      setExportError('')

      if (document.fonts?.ready) {
        await document.fonts.ready
      }

      await waitForImages(cardRef.current)

      const options = {
        pixelRatio: 3,
        cacheBust: true,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: format === 'png' ? 'transparent' : '#ffffff',
        style: {
          transform: 'none',
          margin: '0',
        },
      }

      let dataUrl

      if (format === 'png') {
        dataUrl = await toPng(cardRef.current, options)
      } else {
        dataUrl = await toJpeg(cardRef.current, {
          ...options,
          quality: 0.98,
        })
      }

      const link = document.createElement('a')

      link.download = `Glamour-Attendance-Card-${safeName}.${format}`
      link.href = dataUrl

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Card download failed:', error)

      setExportError(error.message || 'Unable to download the attendance card.')
    } finally {
      setExporting(false)
    }
  }

  // PRINT ATTENDANCE CARD
  const printCard = async () => {
    if (!cardRef.current || !qrImage) return

    try {
      await waitForImages(cardRef.current)

      const printWindow = window.open('', '_blank', 'width=700,height=900')

      if (!printWindow) {
        setExportError('Please allow pop-ups to print the attendance card.')
        return
      }

      const cardHTML = cardRef.current.outerHTML

      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((element) => element.outerHTML)
        .join('')

      printWindow.document.open()

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Glamour Unisex Saloon - Attendance Card</title>

            ${styles}

            <style>
              * {
                box-sizing: border-box;
              }

              html, body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                font-family: Arial, sans-serif;
              }

              body {
                display: flex;
                justify-content: center;
                align-items: flex-start;
                padding: 30px;
              }

              .print-card {
                width: ${CARD_WIDTH}px !important;
                height: ${CARD_HEIGHT}px !important;
                flex-shrink: 0;
                overflow: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              @page {
                margin: 10mm;
              }
            </style>
          </head>

          <body>
            ${cardHTML}

            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.focus()
                  window.print()
                }, 500)
              }

              window.onafterprint = () => {
                window.close()
              }
            </script>
          </body>
        </html>
      `)

      printWindow.document.close()
    } catch (error) {
      console.error('Print failed:', error)
      setExportError('Unable to open the print window.')
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg" alignment="center" backdrop="static">
      <CModalHeader className="border-bottom">
        <CModalTitle className="fw-bold">
          <span style={{ color: '#B58A22' }}>GLAMOUR</span> Staff Attendance Card
        </CModalTitle>
      </CModalHeader>

      <CModalBody
        style={{
          background: '#f4f4f4',
          padding: '25px 15px',
        }}
      >
        <div className="text-center">
          {/* LOADING */}
          {loading ? (
            <div style={{ padding: 100 }}>
              <CSpinner style={{ color: GOLD }} />

              <div className="mt-3 text-muted">Preparing luxury attendance card...</div>
            </div>
          ) : !qrImage ? (
            <div className="py-5 text-danger">
              {exportError || 'Attendance QR code is unavailable.'}
            </div>
          ) : (
            <>
              {/* ================================
                  LUXURY ATTENDANCE CARD
              ================================= */}

              <div
                ref={cardRef}
                className="print-card"
                style={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  margin: '0 auto',
                  position: 'relative',
                  overflow: 'visible',
                  borderRadius: 24,
                  background: 'transparent',
                  border: `2px solid ${GOLD}`,
                  boxShadow: '0 15px 40px rgba(0,0,0,0.12)',
                  fontFamily: 'Arial, sans-serif',
                  color: BLACK,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* GOLD TOP ACCENT */}

                <div
                  style={{
                    width: '100%',
                    height: 7,
                    flexShrink: 0,
                    borderRadius: '20px 20px 0 0',
                    background: `linear-gradient(90deg, #72500B, ${LIGHT_GOLD}, ${GOLD}, #72500B)`,
                  }}
                />

                {/* HEADER */}

                <div
                  style={{
                    width: '100%',
                    padding: '22px 18px 15px',
                    textAlign: 'center',
                    borderBottom: `1px solid rgba(212,175,55,0.65)`,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      margin: '0 auto 9px',
                      border: `2px solid ${GOLD}`,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: GOLD,
                      fontSize: 24,
                      fontWeight: 900,
                    }}
                  >
                    G
                  </div>

                  <div
                    style={{
                      color: BLACK,
                      fontSize: 23,
                      fontWeight: 900,
                      letterSpacing: 3,
                      lineHeight: 1.2,
                    }}
                  >
                    GLAMOUR
                  </div>

                  <div
                    style={{
                      color: '#A47A16',
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: 3,
                      marginTop: 4,
                    }}
                  >
                    UNISEX SALOON
                  </div>

                  <div
                    style={{
                      marginTop: 9,
                      color: '#72550F',
                      fontSize: 9,
                      letterSpacing: 2,
                      fontWeight: 800,
                    }}
                  >
                    STAFF ATTENDANCE CARD
                  </div>
                </div>

                {/* STAFF DETAILS */}

                <div
                  style={{
                    width: '100%',
                    padding: '17px 18px 12px',
                    textAlign: 'center',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 65,
                      height: 65,
                      margin: '0 auto 9px',
                      borderRadius: '50%',
                      padding: 3,
                      background: `linear-gradient(135deg, ${LIGHT_GOLD}, #806017, ${GOLD})`,
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#A47A16',
                        fontSize: 25,
                        fontWeight: 900,
                      }}
                    >
                      {initials || 'G'}
                    </div>
                  </div>

                  <div
                    style={{
                      color: BLACK,
                      fontSize: 20,
                      fontWeight: 900,
                      letterSpacing: 0.4,
                      lineHeight: 1.3,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {staffName}
                  </div>

                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: 7,
                      padding: '5px 17px',
                      border: `1px solid ${GOLD}`,
                      borderRadius: 30,
                      color: '#806017',
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {position}
                  </div>
                </div>

                {/* =================================
                    QR CODE - FULLY CENTRED
                ================================== */}

                <div
                  style={{
                    width: '100%',
                    flex: '1 1 auto',
                    minHeight: 245,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 20px',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      color: '#806017',
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: 1.8,
                      marginBottom: 10,
                    }}
                  >
                    YOUR ATTENDANCE QR CODE
                  </div>

                  {/* QR FRAME */}

                  <div
                    style={{
                      width: 205,
                      height: 205,
                      padding: 9,
                      boxSizing: 'border-box',
                      background: '#ffffff',
                      border: `3px solid ${GOLD}`,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={qrImage}
                      alt="Staff attendance QR code"
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        maxWidth: 'none',
                        maxHeight: 'none',
                        margin: 0,
                      }}
                    />
                  </div>

                  {/* QR IDENTIFIER */}

                  <div
                    style={{
                      marginTop: 8,
                      maxWidth: '100%',
                      color: '#806017',
                      fontSize: 9,
                      letterSpacing: 0.5,
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                    }}
                  >
                    {qrCode}
                  </div>
                </div>

                {/* FOOTER */}

                <div
                  style={{
                    width: '100%',
                    flexShrink: 0,
                    padding: '13px 15px 15px',
                    textAlign: 'center',
                    borderTop: `1px solid rgba(212,175,55,0.65)`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      color: '#806017',
                      letterSpacing: 1.8,
                    }}
                  >
                    SCAN TO RECORD ATTENDANCE
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 8,
                      color: '#9B824A',
                      letterSpacing: 1,
                    }}
                  >
                    PROPERTY OF GLAMOUR UNISEX SALOON
                  </div>

                  <div
                    style={{
                      margin: '10px auto 0',
                      width: 70,
                      height: 3,
                      borderRadius: 10,
                      background: `linear-gradient(90deg, #72500B, ${LIGHT_GOLD}, ${GOLD})`,
                    }}
                  />
                </div>
              </div>

              {/* EXPORT ERROR */}

              {exportError && <div className="text-danger small mt-3">{exportError}</div>}

              {/* DOWNLOAD BUTTONS */}

              <div className="mt-4 d-flex flex-wrap justify-content-center gap-2">
                <CButton
                  color="warning"
                  variant="outline"
                  disabled={exporting || loading}
                  onClick={() => downloadCard('png')}
                  style={{
                    borderColor: '#B58A22',
                    color: '#8B6816',
                    fontWeight: 700,
                  }}
                >
                  {exporting ? <CSpinner size="sm" /> : <i className="cil-cloud-download me-1" />}
                  Download PNG
                </CButton>

                <CButton
                  color="warning"
                  variant="outline"
                  disabled={exporting || loading}
                  onClick={() => downloadCard('jpg')}
                  style={{
                    borderColor: '#B58A22',
                    color: '#8B6816',
                    fontWeight: 700,
                  }}
                >
                  {exporting ? <CSpinner size="sm" /> : <i className="cil-cloud-download me-1" />}
                  Download JPG
                </CButton>

                <CButton
                  color="warning"
                  variant="outline"
                  disabled={exporting || loading}
                  onClick={() => downloadCard('jpeg')}
                  style={{
                    borderColor: '#B58A22',
                    color: '#8B6816',
                    fontWeight: 700,
                  }}
                >
                  {exporting ? <CSpinner size="sm" /> : <i className="cil-cloud-download me-1" />}
                  Download JPEG
                </CButton>
              </div>
            </>
          )}
        </div>
      </CModalBody>

      {/* MODAL FOOTER */}

      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Close
        </CButton>

        <CButton
          color="dark"
          disabled={loading || !qrImage}
          onClick={printCard}
          style={{
            background: '#111',
            border: `1px solid ${GOLD}`,
            color: LIGHT_GOLD,
            fontWeight: 700,
          }}
        >
          Print Attendance Card
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default StaffIDCardModal
