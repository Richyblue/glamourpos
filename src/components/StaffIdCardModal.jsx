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

const StaffIDCardModal = ({ visible, onClose, staff }) => {
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [qrImage, setQrImage] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [exportError, setExportError] = useState('')

  const cardRef = useRef(null)

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

  const downloadCard = async (format) => {
    if (!cardRef.current || !qrImage || exporting) return

    try {
      setExporting(true)
      setExportError('')

      await document.fonts?.ready
      await waitForImages(cardRef.current)

      const options = {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: BLACK,
        width: 380,
        height: 600,
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
      link.click()
    } catch (error) {
      console.error('Card download failed:', error)
      setExportError(error.message || 'Unable to download the attendance card.')
    } finally {
      setExporting(false)
    }
  }

  const printCard = async () => {
    if (!cardRef.current) return

    try {
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
              * { box-sizing: border-box; }
              body {
                margin: 0;
                padding: 30px;
                background: #fff;
                display: flex;
                justify-content: center;
                font-family: Arial, sans-serif;
              }
              .print-card {
                width: 380px !important;
                height: 600px !important;
                flex-shrink: 0;
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
                  window.focus();
                  window.print();
                }, 500);
              };
              window.onafterprint = () => window.close();
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

      <CModalBody style={{ background: '#f4f4f4' }}>
        <div className="text-center">
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
              {/* ATTENDANCE CARD */}

              <div
                ref={cardRef}
                className="print-card"
                style={{
                  width: 380,
                  height: 600,
                  margin: '0 auto',
                  overflow: 'hidden',
                  position: 'relative',
                  borderRadius: 24,
                  background: BLACK,
                  border: `2px solid ${GOLD}`,
                  boxShadow: '0 25px 65px rgba(0,0,0,0.35)',
                  fontFamily: 'Arial, sans-serif',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {/* GOLD TOP ACCENT */}

                <div
                  style={{
                    height: 7,
                    background: `linear-gradient(90deg, #72500B, ${LIGHT_GOLD}, ${GOLD}, #72500B)`,
                  }}
                />

                {/* HEADER */}

                <div
                  style={{
                    padding: '25px 20px 17px',
                    textAlign: 'center',
                    background:
                      'radial-gradient(ellipse at top, #30240C 0%, #12100A 48%, #080808 100%)',
                    borderBottom: `1px solid rgba(212,175,55,0.55)`,
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      margin: '0 auto 11px',
                      border: `1px solid ${GOLD}`,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: LIGHT_GOLD,
                      fontSize: 25,
                      fontWeight: 900,
                      letterSpacing: -2,
                      boxShadow: '0 0 18px rgba(212,175,55,0.16)',
                    }}
                  >
                    G
                  </div>

                  <div
                    style={{
                      color: LIGHT_GOLD,
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
                      color: GOLD,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 3,
                      marginTop: 4,
                    }}
                  >
                    UNISEX SALOON
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      color: '#E8D9AE',
                      fontSize: 9,
                      letterSpacing: 2.5,
                      fontWeight: 700,
                    }}
                  >
                    STAFF ATTENDANCE CARD
                  </div>
                </div>

                {/* STAFF DETAILS */}

                <div
                  style={{
                    padding: '21px 20px 12px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 82,
                      height: 82,
                      margin: '0 auto 13px',
                      borderRadius: '50%',
                      padding: 4,
                      background: `linear-gradient(135deg, ${LIGHT_GOLD}, #806017, ${GOLD})`,
                      boxShadow: '0 0 22px rgba(212,175,55,0.20)',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: 'linear-gradient(145deg, #282114, #080808)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: LIGHT_GOLD,
                        fontSize: 29,
                        fontWeight: 900,
                      }}
                    >
                      {initials || 'G'}
                    </div>
                  </div>

                  <div
                    style={{
                      color: '#fff',
                      fontSize: 21,
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
                      marginTop: 8,
                      padding: '6px 19px',
                      border: `1px solid ${GOLD}`,
                      borderRadius: 30,
                      color: LIGHT_GOLD,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {position}
                  </div>
                </div>

                {/* QR ATTENDANCE */}

                <div
                  style={{
                    margin: '12px auto 0',
                    width: 205,
                    padding: 10,
                    borderRadius: 14,
                    background: '#fff',
                    border: `3px solid ${GOLD}`,
                    boxShadow: '0 5px 22px rgba(212,175,55,0.12)',
                  }}
                >
                  <img
                    src={qrImage}
                    alt="Staff attendance QR code"
                    crossOrigin="anonymous"
                    style={{
                      display: 'block',
                      width: 179,
                      height: 179,
                      objectFit: 'contain',
                      margin: 'auto',
                    }}
                  />
                </div>

                {/* QR IDENTIFIER */}

                <div
                  style={{
                    margin: '9px 18px 0',
                    textAlign: 'center',
                    fontSize: 9,
                    color: '#C9B982',
                    letterSpacing: 0.8,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {qrCode}
                </div>

                {/* FOOTER */}

                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: '15px 18px 17px',
                    textAlign: 'center',
                    background: 'linear-gradient(180deg, #17130B, #080808)',
                    borderTop: `1px solid rgba(212,175,55,0.65)`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      color: LIGHT_GOLD,
                      letterSpacing: 2,
                    }}
                  >
                    SCAN TO RECORD ATTENDANCE
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 8,
                      color: '#B7A77B',
                      letterSpacing: 1.3,
                    }}
                  >
                    PROPERTY OF GLAMOUR UNISEX SALOON
                  </div>

                  <div
                    style={{
                      margin: '12px auto 0',
                      width: 75,
                      height: 3,
                      borderRadius: 10,
                      background: `linear-gradient(90deg, #72500B, ${LIGHT_GOLD}, ${GOLD})`,
                    }}
                  />
                </div>
              </div>

              {/* DOWNLOAD AND PRINT ERROR */}

              {exportError && <div className="text-danger small mt-3">{exportError}</div>}

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
                  {exporting ? <CSpinner size="sm" /> : '↓'} Download PNG
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
                  {exporting ? <CSpinner size="sm" /> : '↓'} Download JPG
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
                  {exporting ? <CSpinner size="sm" /> : '↓'} Download JPEG
                </CButton>
              </div>
            </>
          )}
        </div>
      </CModalBody>

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
