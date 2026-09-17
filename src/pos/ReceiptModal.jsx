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
  CAlert,
} from '@coreui/react'

const ReceiptModal = ({ show, onHide, sale }) => {
  const receiptRef = useRef(null)

  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [settings, setSettings] = useState({})
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [printing, setPrinting] = useState(false)

  /*
  ==========================================
  FETCH COMPANY SETTINGS
  ==========================================
  */

  useEffect(() => {
    let mounted = true

    const fetchSettings = async () => {
      try {
        setLoadingSettings(true)
        setSettingsError('')

        const token = localStorage.getItem('token')

        const response = await axios.get(
          `${API_URL}api/v1/settings`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          },
        )

        console.log('Settings API response:', response.data)

        if (mounted) {
          setSettings(response.data?.settings || {})
        }
      } catch (error) {
        console.error(
          'Failed to fetch settings:',
          error.response?.data || error.message,
        )

        if (mounted) {
          setSettingsError(
            error.response?.data?.message ||
              'Unable to load company settings.',
          )

          setSettings({})
        }
      } finally {
        if (mounted) {
          setLoadingSettings(false)
        }
      }
    }

    if (show) {
      fetchSettings()
    }

    return () => {
      mounted = false
    }
  }, [show, API_URL])

  /*
  ==========================================
  SETTINGS VALUES
  ==========================================
  */

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

  /*
  ==========================================
  FORMAT MONEY
  ==========================================
  */

  const formatAmount = (amount) => {
    return `${currencySymbol}${Number(
      amount || 0,
    ).toLocaleString()}`
  }

  /*
  ==========================================
  GENERATE RECEIPT CONTENT
  ==========================================
  */

  const generateReceiptContent = (copyType) => {
    const items = sale?.items || []

    return `
      <div class="receipt">
        <div class="company-header">
          <h2>${companyName}</h2>

          ${
            companyAddress
              ? `<p class="address">${companyAddress}</p>`
              : ''
          }

          ${
            companyPhone
              ? `<p>Tel: ${companyPhone}</p>`
              : ''
          }

          ${
            companyEmail
              ? `<p>${companyEmail}</p>`
              : ''
          }
        </div>

        <div class="separator"></div>

        <p>
          <strong>Receipt No:</strong>
          ${sale?.receiptNumber || sale?.id || '-'}
        </p>

        <p>
          <strong>Customer:</strong>
          ${sale?.customer || 'Walk-in Customer'}
        </p>

        <p>
          <strong>Date:</strong>
          ${
            sale?.createdAt
              ? new Date(
                  sale.createdAt,
                ).toLocaleString()
              : '-'
          }
        </p>

        <p>
          <strong>Cashier:</strong>
          ${sale?.recordedBy || 'Admin'}
        </p>

        <div class="separator"></div>

        <table>
          <thead>
            <tr>
              <th align="left">Item</th>
              <th align="center">Qty</th>
              <th align="right">Amount</th>
            </tr>
          </thead>

          <tbody>
            ${items
              .map((item) => {
                const quantity =
                  item.quantity || item.qty || 1

                const amount =
                  item.subtotal || 0

                return `
                  <tr>
                    <td>${item.name || '-'}</td>
                    <td align="center">${quantity}</td>
                    <td align="right">
                      ${formatAmount(amount)}
                    </td>
                  </tr>
                `
              })
              .join('')}
          </tbody>
        </table>

        <div class="separator"></div>

        <div class="total-row">
          <span>Subtotal:</span>
          <strong>
            ${formatAmount(
              sale?.subtotal || sale?.totalAmount,
            )}
          </strong>
        </div>

        <div class="total-row">
          <span>Discount:</span>
          <strong>
            ${formatAmount(sale?.discount)}
          </strong>
        </div>

        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <strong>
            ${formatAmount(sale?.totalAmount)}
          </strong>
        </div>

        <div class="separator"></div>

        <div class="receipt-footer">
          <p>${receiptFooter}</p>
          <p>Please Visit Again</p>
        </div>

        <div class="copy-label">
          ${copyType}
        </div>
      </div>
    `
  }

  /*
  ==========================================
  PRINT TWO RECEIPTS
  ==========================================
  */

  const handlePrint = async () => {
    if (printing) return

    try {
      if (!window.electronAPI?.printReceipt) {
        alert('Electron printing is not available.')
        return
      }

      setPrinting(true)

      const customerReceipt =
        generateReceiptContent('CUSTOMER COPY')

      const cashierReceipt =
        generateReceiptContent('CASHIER COPY')

      const html = `
        <html>
          <head>
            <style>
              @page {
                size: 60mm auto;
                margin: 0;
              }

              * {
                box-sizing: border-box;
              }

              body {
                width: 60mm;
                margin: 0;
                padding: 0;
                font-family: monospace;
                font-size: 8px;
                color: #000;
              }

              .receipt {
                width: 60mm;
                padding: 5px;
                page-break-after: always;
              }

              .receipt:last-child {
                page-break-after: auto;
              }

              .company-header {
                text-align: center;
              }

              .company-header h2 {
                font-size: 13px;
                margin: 2px 0;
                font-weight: bold;
              }

              .company-header p {
                margin: 2px 0;
              }

              .address {
                white-space: pre-line;
              }

              .separator {
                border-top: 1px dashed #000;
                margin: 8px 0;
              }

              p {
                margin: 4px 0;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
                font-size: 8px;
              }

              th,
              td {
                padding: 2px 0;
                word-break: break-word;
              }

              th:first-child,
              td:first-child {
                width: 50%;
              }

              th:nth-child(2),
              td:nth-child(2) {
                width: 15%;
              }

              th:last-child,
              td:last-child {
                width: 35%;
              }

              .total-row {
                display: flex;
                justify-content: space-between;
                gap: 8px;
                margin: 5px 0;
              }

              .grand-total {
                font-size: 11px;
                font-weight: bold;
              }

              .receipt-footer {
                text-align: center;
                margin-top: 10px;
              }

              .receipt-footer p {
                margin: 3px 0;
                white-space: pre-line;
              }

              .copy-label {
                text-align: center;
                font-weight: bold;
                margin-top: 12px;
                font-size: 9px;
              }
            </style>
          </head>

          <body>
            ${customerReceipt}
            ${cashierReceipt}
          </body>
        </html>
      `

      const result =
        await window.electronAPI.printReceipt(html)

      if (result?.success === false) {
        throw new Error(
          result.message || 'Printing failed',
        )
      }

      alert(
        'Customer and cashier receipts printed successfully.',
      )
    } catch (error) {
      console.error('Printer Error:', error)

      alert(
        error.message ||
          'Unable to print customer and cashier receipts.',
      )
    } finally {
      setPrinting(false)
    }
  }

  if (!sale) return null

  return (
    <CModal
      visible={show}
      onClose={printing ? undefined : onHide}
      alignment="center"
      size="lg"
    >
      <CModalHeader>
        <CModalTitle>Receipt Preview</CModalTitle>
      </CModalHeader>

      <CModalBody>
        {loadingSettings ? (
          <div className="text-center py-4">
            <CSpinner />
            <p className="mt-2 mb-0">
              Loading company information...
            </p>
          </div>
        ) : (
          <>
            {settingsError && (
              <CAlert color="warning">
                {settingsError}
              </CAlert>
            )}

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
                      <p
                        style={{
                          margin: '2px 0',
                          whiteSpace: 'pre-line',
                        }}
                      >
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

                  <p>
                    <strong>Receipt No:</strong>{' '}
                    {sale.receiptNumber || sale.id}
                  </p>

                  <p>
                    <strong>Customer:</strong>{' '}
                    {sale.customer ||
                      'Walk-in Customer'}
                  </p>

                  <p>
                    <strong>Date:</strong>{' '}
                    {sale.createdAt
                      ? new Date(
                          sale.createdAt,
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
                              item.subtotal,
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
                            sale.totalAmount,
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
                          sale.discount,
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
                          sale.totalAmount,
                        )}
                      </strong>
                    </p>
                  </div>

                  <hr
                    style={{
                      borderTop: '1px dashed #000',
                    }}
                  />

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
                disabled={printing || loadingSettings}
              >
                {printing ? (
                  <>
                    <CSpinner
                      size="sm"
                      className="me-2"
                    />
                    Printing Two Receipts...
                  </>
                ) : (
                  'Print Customer & Cashier Receipts'
                )}
              </CButton>
            </div>
          </>
        )}
      </CModalBody>
    </CModal>
  )
}

export default ReceiptModal