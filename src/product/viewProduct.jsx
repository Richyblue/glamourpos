import React, { useEffect, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import Swal from 'sweetalert2'

import CIcon from '@coreui/icons-react'
import { successAlert } from 'src/utils/alerts'
import { errorAlert } from 'src/utils/alerts'

import { cilPencil, cilTrash, cilCloudDownload, cilSearch } from '@coreui/icons'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CFormInput,
  CBadge,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CPagination,
  CPaginationItem,
  CInputGroup,
  CInputGroupText,
  CSpinner,
} from '@coreui/react'

import { Link } from 'react-router-dom'

const ProductList = () => {
  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')

  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 10
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const getProducts = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setProducts(response.data.products || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await getProducts()
    }

    fetchData()
  }, [])

  const deleteProduct = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
      text: 'The product will be moved to Recycle Bin.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Delete',
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('token')

      await axios.delete(`${API_URL}api/v1/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Product moved to Recycle Bin',
        timer: 2000,
        showConfirmButton: false,
      })

      getProducts()
    } catch (error) {
      console.error(error)

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message || 'Failed to delete product',
      })
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(search.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredProducts.map((product) => ({
        Name: product.name,
        SKU: product.sku,
        Barcode: product.barcode,
        CostPrice: product.costPrice,
        SellingPrice: product.sellingPrice,
        Quantity: product.quantity,
        Status: product.status,
      })),
    )

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const file = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })

    saveAs(file, `Products.xlsx`)
  }

  return (
    <>
      {/* =====================================================
          PREMIUM PAGE HEADER
      ====================================================== */}

      <div
        className="mb-4"
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          borderRadius: '18px',
          padding: '28px 30px',
          color: '#fff',
          boxShadow: '0 8px 30px rgba(17, 24, 39, 0.12)',
        }}
      >
        <CRow className="align-items-center">
          <CCol md={8}>
            <div
              className="mb-2"
              style={{
                color: '#e8bd35',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '1.6px',
                textTransform: 'uppercase',
              }}
            >
              Inventory Management
            </div>

            <h2
              className="mb-2"
              style={{
                fontWeight: '700',
                letterSpacing: '-0.6px',
              }}
            >
              Product Inventory
            </h2>

            <p
              className="mb-0"
              style={{
                color: '#cbd5e1',
                fontSize: '14px',
              }}
            >
              Manage your products, stock levels, pricing and inventory information.
            </p>
          </CCol>

          <CCol md={4} className="text-md-end mt-3 mt-md-0">
            <div
              className="d-inline-flex align-items-center justify-content-center"
              style={{
                minWidth: '64px',
                height: '64px',
                padding: '0 18px',
                borderRadius: '16px',
                background: 'rgba(232, 189, 53, 0.12)',
                border: '1px solid rgba(232, 189, 53, 0.28)',
                color: '#e8bd35',
                fontWeight: '700',
                fontSize: '13px',
              }}
            >
              INVENTORY
            </div>
          </CCol>
        </CRow>
      </div>

      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <CRow className="mb-4">
        {/* TOTAL */}

        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: '15px',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
            }}
          >
            <CCardBody style={{ padding: '20px' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Total Products
                  </div>

                  <div
                    className="mt-2"
                    style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#111827',
                    }}
                  >
                    {products.length}
                  </div>
                </div>

                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#374151',
                    fontWeight: '700',
                  }}
                >
                  P
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* ACTIVE */}

        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: '15px',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
            }}
          >
            <CCardBody style={{ padding: '20px' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Active Products
                  </div>

                  <div
                    className="mt-2"
                    style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#15803d',
                    }}
                  >
                    {products.filter((p) => p.status === 'active').length}
                  </div>
                </div>

                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#15803d',
                    fontWeight: '700',
                  }}
                >
                  ✓
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* LOW STOCK */}

        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: '15px',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
            }}
          >
            <CCardBody style={{ padding: '20px' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Low Stock
                  </div>

                  <div
                    className="mt-2"
                    style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#b45309',
                    }}
                  >
                    {products.filter((p) => p.quantity <= p.reorderLevel).length}
                  </div>
                </div>

                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#fffbeb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#b45309',
                    fontWeight: '700',
                  }}
                >
                  !
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* VALUE */}

        <CCol sm={6} xl={3}>
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: '15px',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
            }}
          >
            <CCardBody style={{ padding: '20px' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Inventory Value
                  </div>

                  <div
                    className="mt-2"
                    style={{
                      fontSize: '21px',
                      fontWeight: '700',
                      color: '#111827',
                    }}
                  >
                    ₦
                    {products
                      .reduce((sum, p) => sum + Number(p.costPrice) * Number(p.quantity), 0)
                      .toLocaleString()}
                  </div>
                </div>

                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#fff8dc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c9a227',
                    fontWeight: '700',
                  }}
                >
                  ₦
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          MAIN INVENTORY CARD
      ====================================================== */}

      <CCard
        className="border-0"
        style={{
          borderRadius: '17px',
          boxShadow: '0 5px 25px rgba(15, 23, 42, 0.07)',
          overflow: 'hidden',
        }}
      >
        {/* HEADER */}

        <CCardHeader
          className="border-0"
          style={{
            background: '#fff',
            padding: '22px 24px',
          }}
        >
          <CRow className="align-items-center">
            <CCol lg={7}>
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: '700',
                  color: '#111827',
                }}
              >
                All Products
              </div>

              <small
                style={{
                  color: '#6b7280',
                }}
              >
                View and manage your inventory
              </small>
            </CCol>

            <CCol lg={5} className="text-lg-end mt-3 mt-lg-0">
              <CButton
                onClick={exportToExcel}
                className="border-0"
                style={{
                  background: '#f0fdf4',
                  color: '#15803d',
                  borderRadius: '9px',
                  fontWeight: '600',
                  padding: '9px 15px',
                }}
              >
                <CIcon icon={cilCloudDownload} className="me-2" />
                Export Excel
              </CButton>

              <CButton
                color="warning"
                className="ms-2 border-0"
                onClick={() => {
                  setProducts(products.filter((p) => p.quantity <= p.reorderLevel))
                }}
                style={{
                  borderRadius: '9px',
                  fontWeight: '600',
                  padding: '9px 15px',
                }}
              >
                Low Stock
              </CButton>
            </CCol>
          </CRow>
        </CCardHeader>

        {/* SEARCH */}

        <CCardBody
          style={{
            padding: '0 24px 20px',
          }}
        >
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '13px',
              padding: '15px',
              border: '1px solid #eef0f3',
            }}
          >
            <CRow className="align-items-center">
              <CCol lg={6}>
                <CInputGroup>
                  <CInputGroupText
                    style={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRight: '0',
                      color: '#9ca3af',
                    }}
                  >
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>

                  <CFormInput
                    placeholder="Search product, SKU or barcode..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      minHeight: '44px',
                      border: '1px solid #e5e7eb',
                      borderLeft: '0',
                      borderRadius: '0 10px 10px 0',
                      background: '#fff',
                    }}
                  />
                </CInputGroup>
              </CCol>

              <CCol lg={6} className="text-lg-end mt-3 mt-lg-0">
                <span
                  style={{
                    fontSize: '13px',
                    color: '#6b7280',
                  }}
                >
                  Showing{' '}
                  <strong
                    style={{
                      color: '#111827',
                    }}
                  >
                    {filteredProducts.length}
                  </strong>{' '}
                  products
                </span>
              </CCol>
            </CRow>
          </div>
        </CCardBody>

        {/* TABLE */}

        <CCardBody
          style={{
            padding: '0 24px 24px',
          }}
        >
          {loading ? (
            <div
              className="text-center py-5"
              style={{
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <CSpinner
                style={{
                  color: '#c9a227',
                }}
              />

              <div
                className="mt-3"
                style={{
                  color: '#6b7280',
                  fontSize: '13px',
                }}
              >
                Loading products...
              </div>
            </div>
          ) : (
            <div
              style={{
                border: '1px solid #eef0f3',
                borderRadius: '13px',
                overflow: 'hidden',
              }}
            >
              <CTable hover responsive align="middle" className="mb-0">
                <CTableHead>
                  <CTableRow
                    style={{
                      background: '#f8fafc',
                    }}
                  >
                    <CTableHeaderCell
                      style={{
                        padding: '15px 16px',
                        color: '#6b7280',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      Image
                    </CTableHeaderCell>

                    <CTableHeaderCell
                      style={{
                        padding: '15px 16px',
                        color: '#6b7280',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      Product
                    </CTableHeaderCell>

                    <CTableHeaderCell
                      style={{
                        padding: '15px 16px',
                        color: '#6b7280',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      SKU
                    </CTableHeaderCell>

                    <CTableHeaderCell
                      style={{
                        padding: '15px 16px',
                        color: '#6b7280',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      Price
                    </CTableHeaderCell>

                    <CTableHeaderCell
                      style={{
                        padding: '15px 16px',
                        color: '#6b7280',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      Stock
                    </CTableHeaderCell>

                    <CTableHeaderCell
                      style={{
                        padding: '15px 16px',
                        color: '#6b7280',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      Status
                    </CTableHeaderCell>

                    <CTableHeaderCell
                      className="text-end"
                      style={{
                        padding: '15px 16px',
                        color: '#6b7280',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      Actions
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {currentProducts.length > 0 ? (
                    currentProducts.map((product) => (
                      <CTableRow
                        key={product.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        {/* IMAGE */}

                        <CTableDataCell
                          style={{
                            padding: '14px 16px',
                          }}
                        >
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              width="48"
                              height="48"
                              style={{
                                objectFit: 'cover',
                                borderRadius: '11px',
                                border: '1px solid #e5e7eb',
                              }}
                            />
                          ) : (
                            <div
                              className="d-flex align-items-center justify-content-center"
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '11px',
                                background: '#f3f4f6',
                                color: '#9ca3af',
                                fontSize: '11px',
                                fontWeight: '600',
                              }}
                            >
                              N/A
                            </div>
                          )}
                        </CTableDataCell>

                        {/* PRODUCT */}

                        <CTableDataCell
                          style={{
                            padding: '14px 16px',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: '700',
                              color: '#111827',
                              fontSize: '13px',
                            }}
                          >
                            {product.name}
                          </div>

                          {product.barcode && (
                            <small
                              style={{
                                color: '#9ca3af',
                                fontSize: '11px',
                              }}
                            >
                              {product.barcode}
                            </small>
                          )}
                        </CTableDataCell>

                        {/* SKU */}

                        <CTableDataCell
                          style={{
                            padding: '14px 16px',
                            color: '#6b7280',
                            fontSize: '13px',
                          }}
                        >
                          {product.sku || '—'}
                        </CTableDataCell>

                        {/* PRICE */}

                        <CTableDataCell
                          style={{
                            padding: '14px 16px',
                          }}
                        >
                          <strong
                            style={{
                              color: '#111827',
                              fontSize: '13px',
                            }}
                          >
                            ₦{Number(product.sellingPrice).toLocaleString()}
                          </strong>
                        </CTableDataCell>

                        {/* STOCK */}

                        <CTableDataCell
                          style={{
                            padding: '14px 16px',
                          }}
                        >
                          <CBadge
                            color={product.quantity <= product.reorderLevel ? 'warning' : 'success'}
                            style={{
                              padding: '6px 9px',
                              borderRadius: '7px',
                              fontSize: '11px',
                            }}
                          >
                            {product.quantity}
                          </CBadge>

                          {product.quantity <= product.reorderLevel && (
                            <div
                              className="mt-1"
                              style={{
                                fontSize: '10px',
                                color: '#b45309',
                              }}
                            >
                              Low stock
                            </div>
                          )}
                        </CTableDataCell>

                        {/* STATUS */}

                        <CTableDataCell
                          style={{
                            padding: '14px 16px',
                          }}
                        >
                          <CBadge
                            color={product.status === 'active' ? 'success' : 'danger'}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '7px',
                              fontSize: '11px',
                              textTransform: 'capitalize',
                            }}
                          >
                            {product.status}
                          </CBadge>
                        </CTableDataCell>

                        {/* ACTIONS */}

                        <CTableDataCell
                          className="text-end"
                          style={{
                            padding: '14px 16px',
                          }}
                        >
                          <Link to={`/editProduct/${product.id}`}>
                            <CButton
                              size="sm"
                              className="border-0 me-2"
                              style={{
                                width: '34px',
                                height: '34px',
                                padding: '0',
                                borderRadius: '9px',
                                background: '#fff8dc',
                                color: '#a17d08',
                              }}
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                          </Link>

                          <CButton
                            size="sm"
                            className="border-0"
                            onClick={() => {
                              deleteProduct(product.id)
                            }}
                            style={{
                              width: '34px',
                              height: '34px',
                              padding: '0',
                              borderRadius: '9px',
                              background: '#fef2f2',
                              color: '#dc2626',
                            }}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell
                        colSpan={7}
                        className="text-center"
                        style={{
                          padding: '70px 20px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151',
                          }}
                        >
                          No products found
                        </div>

                        <div
                          className="mt-1"
                          style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                          }}
                        >
                          Try changing your search criteria.
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </div>
          )}

          {/* =====================================================
              PAGINATION
          ====================================================== */}

          {totalPages > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <small
                style={{
                  color: '#6b7280',
                }}
              >
                Page{' '}
                <strong
                  style={{
                    color: '#111827',
                  }}
                >
                  {currentPage}
                </strong>{' '}
                of{' '}
                <strong
                  style={{
                    color: '#111827',
                  }}
                >
                  {totalPages}
                </strong>
              </small>

              <CPagination className="mb-0">
                {[...Array(totalPages)].map((_, index) => (
                  <CPaginationItem
                    key={index}
                    active={currentPage === index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      marginLeft: '4px',
                    }}
                  >
                    {index + 1}
                  </CPaginationItem>
                ))}
              </CPagination>
            </div>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}

export default ProductList
