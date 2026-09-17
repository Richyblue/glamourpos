import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CCard,
  CCardBody,
  CButton,
  CSpinner,
} from '@coreui/react'

const ReceiptModal = ({ show, onHide, sale }) => {
  const receiptRef = useRef()

  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [settings, setSettings] = useState(null)
  const [loadingSettings, setLoadingSettings] = useState(false)

  /*
  ==========================================
  FETCH COMPANY SETTINGS
  ==========================================
  */

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true)

        const response = await axios.get(
          `${API_URL}api/v1/settings`
        )

        setSettings(response.data?.settings || {})
      } catch (error) {
        console.error(
          'Failed to load company settings:',
          error
        )

        setSettings({})
      } finally {
        setLoadingSettings(false)
      }
    }

    if (show) {
      fetchSettings()
    }
  }, [show, API_URL])

  /*
  ==========================================
  THERMAL PRINTER
  ==========================================
  */

  const handlePrint = async () => {
    try {
      if (!window.electronAPI) {
        alert('Electron printing not available')
        return
      }

      const html = `
        <html>
          <head>
            <style>
              @page {
                size: 60mm auto;
                margin: 0;
              }

              body {
                width: 60mm;
                margin: 0;
                padding: 5px;
                font-family: monospace;
                font-size: 8px;
                color: #000;
              }

              table {
                width: 100%;
                border-collapse: collapse;
              }

              th,
              td {
                padding: 2px;
              }

              .text-center {
                text-align: center;
              }

              .text-right {
                text-align: right;
              }

              .line {
                border-top: 1px dashed #000;
                margin: 8px 0;
              }

              .row {
                display: flex;
                justify-content: space-between;
                gap: 10px;
              }
            </style>
          </head>

          <body>
            ${receiptRef.current?.innerHTML || ''}
          </body>
        </html>
      `

      await window.electronAPI.printReceipt(html)

      alert('Receipt Printed Successfully')
    } catch (error) {
      console.error('Printer Error:', error)

      alert('Printer Error')
    }
  }

  if (!sale) return null

  const companyName =
    settings?.companyName || 'GLAMOUR UNISEX SALON'

  const companyPhone =
    settings?.companyPhone || ''

  const companyEmail =
    settings?.companyEmail || ''

  const companyAddress =
    settings?.companyAddress || ''

  const currencySymbol =
    settings?.currencySymbol || '₦'

  const receiptFooter =
    settings?.receiptFooter ||
    'Thank You For Your Patronage'

  const formatAmount = (amount) => {
    return `${currencySymbol}${Number(
      amount || 0
    ).toLocaleString()}`
  }

  return (
    <CModal
      visible={show}
      onClose={onHide}
      alignment="center"
      size="lg"
    >
      <CModalHeader>
        <CModalTitle>Receipt</CModalTitle>
      </CModalHeader>

      <CModalBody>
        {loadingSettings ? (
          <div className="text-center py-4">
            <CSpinner />
            <p className="mt-2">
              Loading company information...
            </p>
          </div>
        ) : (
          <>
            <CCard>
              <CCardBody>
                <div
                  ref={receiptRef}
                  style={{
                    width: '60mm',
                    margin: '0 auto',
                    padding: '5px',
                    fontSize: '9px',
                    fontFamily: 'monospace',
                    color: '#000',
                  }}
                >
                  {/* COMPANY INFORMATION */}
                  <div
                    style={{
                      textAlign: 'center',
                    }}
                  >
                    <h3
                      style={{
                        margin: '2px 0',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      {companyName}
                    </h3>

                    {companyAddress && (
                      <p style={{ margin: '2px 0' }}>
                        {companyAddress}
                      </p>
                    )}

                    {companyPhone && (
                      <p style={{ margin: '2px 0' }}>
                        Tel: {companyPhone}
                      </p>
                    )}

                    {companyEmail && (
                      <p style={{ margin: '2px 0' }}>
                        {companyEmail}
                      </p>
                    )}
                  </div>

                  <hr
                    style={{
                      borderTop: '1px dashed #000',
                    }}
                  />

                  {/* SALE INFORMATION */}
                  <p>
                    <strong>Receipt No:</strong>{' '}
                    {sale.receiptNumber || sale.id}
                  </p>

                  <p>
                    <strong>Customer:</strong>{' '}
                    {sale.customer || 'Walk-in Customer'}
                  </p>

                  <p>
                    <strong>Date:</strong>{' '}
                    {sale.createdAt
                      ? new Date(
                          sale.createdAt
                        ).toLocaleString()
                      : '-'}
                  </p>

                  <p>
                    <strong>Cashier:</strong>{' '}
                    {sale.recordedBy || 'Admin'}
                  </p>

                  <hr
                    style={{
                      borderTop: '1px dashed #000',
                    }}
                  />

                  {/* ITEMS */}
                  <table
                    style={{
                      width: '100%',
                      fontSize: '9px',
                    }}
                  >
                    <thead>
                      <tr>
                        <th align="left">Item</th>
                        <th align="center">Qty</th>
                        <th align="right">Amt</th>
                      </tr>
                    </thead>

                    <tbody>
                      {sale.items?.map((item, index) => (
                        <tr key={index}>
                          <td>
                            {item.name}
                          </td>

                          <td align="center">
                            {item.quantity ||
                              item.qty ||
                              1}
                          </td>

                          <td align="right">
                            {formatAmount(
                              item.subtotal || 0
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <hr
                    style={{
                      borderTop: '1px dashed #000',
                    }}
                  />

                  {/* TOTALS */}
                  <div>
                    <p
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        margin: '4px 0',
                      }}
                    >
                      <span>Subtotal:</span>

                      <strong>
                        {formatAmount(
                          sale.subtotal ||
                            sale.totalAmount
                        )}
                      </strong>
                    </p>

                    <p
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        margin: '4px 0',
                      }}
                    >
                      <span>Discount:</span>

                      <strong>
                        {formatAmount(
                          sale.discount || 0
                        )}
                      </strong>
                    </p>

                    <p
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        fontSize: '11px',
                        margin: '4px 0',
                      }}
                    >
                      <span>TOTAL:</span>

                      <strong>
                        {formatAmount(
                          sale.totalAmount || 0
                        )}
                      </strong>
                    </p>
                  </div>

                  <hr
                    style={{
                      borderTop: '1px dashed #000',
                    }}
                  />

                  {/* FOOTER */}
                  <div
                    style={{
                      textAlign: 'center',
                      marginTop: '10px',
                    }}
                  >
                    <p
                      style={{
                        margin: '3px 0',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {receiptFooter}
                    </p>

                    <p style={{ margin: '3px 0' }}>
                      Please Visit Again
                    </p>
                  </div>
                </div>
              </CCardBody>
            </CCard>

            <div className="text-center mt-3">
              <CButton
                color="primary"
                onClick={handlePrint}
              >
                Print Receipt
              </CButton>
            </div>
          </>
        )}
      </CModalBody>
    </CModal>
  )
}

export default ReceiptModal