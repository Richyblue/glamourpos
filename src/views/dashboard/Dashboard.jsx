import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import CIcon from '@coreui/icons-react'
import KpiCard from './KpiCard'

import {
  CAvatar,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CAlert,
  CSpinner,
  CBadge,
} from '@coreui/react'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

import { Line } from 'react-chartjs-2'

import {
  cilMoney,
  cilDollar,
  cilPeople,
  cilCart,
  cilBasket,
  cilUser,
  cilWarning,
  cilChartLine,
  cilUserFemale,
  cilReload,
  cilCloudDownload,
  cilArrowTop,
  cilArrowBottom,
  cilCalendar,
  cilCheckCircle,
  cilLoopCircular,
} from '@coreui/icons'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const Dashboard = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  // =========================================================
  // DASHBOARD STATE
  // =========================================================

  const [dashboard, setDashboard] = useState({
    // TODAY
    todaySales: 0,
    todayProfit: 0,
    todayTransactions: 0,
    todayCustomers: 0,
    todayExpenses: 0,
    todayCommission: 0,

    // MONTH
    monthSales: 0,
    monthProfit: 0,
    monthExpenses: 0,
    monthCommission: 0,

    // SALES ANALYTICS
    grossSales: 0,
    totalReturns: 0,
    netSales: 0,
    averageSale: 0,

    // REVENUE
    serviceRevenue: 0,
    productRevenue: 0,
    ownerProfit: 0,
    staffShare: 0,

    // PAYMENT
    cashSales: 0,
    transferSales: 0,
    posSales: 0,
    mixedSales: 0,

    // BUSINESS
    totalProducts: 0,
    totalCustomers: 0,
    totalStaff: 0,
    inventoryValue: 0,

    // ALERTS
    lowStockProducts: 0,
    outOfStockProducts: 0,
    pendingCommission: 0,
    totalAlerts: 0,

    // TABLES
    topProducts: [],
    topStaff: [],

    // CHART
    sevenDaysSales: [],
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // =========================================================
  // FORMAT CURRENCY
  // =========================================================

  const money = (value) => {
    return `₦${Number(value || 0).toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`
  }

  // =========================================================
  // GET DASHBOARD
  // =========================================================

  const getDashboard = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true)
      }

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = response.data?.dashboard || {}

      setDashboard((previous) => ({
        ...previous,
        ...data,

        topProducts: data.topProducts || [],
        topStaff: data.topStaff || [],
        sevenDaysSales: data.sevenDaysSales || [],
      }))

      return true
    } catch (error) {
      console.error('Dashboard Error:', error)

      Swal.fire({
        icon: 'error',
        title: 'Unable to Load Dashboard',
        text: error?.response?.data?.message || 'There was a problem loading the dashboard.',
        confirmButtonColor: '#321fdb',
      })

      return false
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    getDashboard(true)
  }, [])

  // =========================================================
  // REFRESH
  // =========================================================

  const refreshDashboard = async () => {
    try {
      setRefreshing(true)

      const success = await getDashboard(false)

      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'Dashboard Updated',
          text: 'The latest business figures have been loaded.',
          timer: 1300,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
      }
    } finally {
      setRefreshing(false)
    }
  }

  // =========================================================
  // ALERT COUNT
  // =========================================================

  const totalAlerts = Number(
    dashboard.totalAlerts ??
      Number(dashboard.lowStockProducts || 0) +
        Number(dashboard.outOfStockProducts || 0) +
        (Number(dashboard.pendingCommission || 0) > 0 ? 1 : 0),
  )

  // =========================================================
  // SALES CHART
  // =========================================================

  const salesChartData = useMemo(() => {
    const records = dashboard.sevenDaysSales || []

    return {
      labels: records.map((item) => item.date),

      datasets: [
        {
          label: 'Sales',
          data: records.map((item) => Number(item.sales || 0)),
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }
  }, [dashboard.sevenDaysSales])

  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      intersect: false,
      mode: 'index',
    },

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            return `Sales: ${money(context.raw)}`
          },
        },
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },

        ticks: {
          maxRotation: 0,
        },
      },

      y: {
        beginAtZero: true,

        grid: {
          color: 'rgba(0,0,0,0.06)',
        },

        ticks: {
          callback: (value) => money(value),
        },
      },
    },
  }

  // =========================================================
  // PAYMENT BREAKDOWN
  // =========================================================

  const paymentTotal =
    Number(dashboard.cashSales || 0) +
    Number(dashboard.transferSales || 0) +
    Number(dashboard.posSales || 0) +
    Number(dashboard.mixedSales || 0)

  const paymentPercentage = (value) => {
    if (!paymentTotal) return 0

    return Math.round((Number(value || 0) / paymentTotal) * 100)
  }

  // =========================================================
  // TOP PRODUCT QUANTITY
  // =========================================================

  const getProductQuantity = (item) => {
    return Number(item?.dataValues?.totalSold ?? item?.totalSold ?? 0)
  }

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{
          minHeight: '70vh',
        }}
      >
        <CSpinner color="primary" size="sm" />

        <div className="mt-3 text-body-secondary">Loading business dashboard...</div>
      </div>
    )
  }

  return (
    <div
      className="dashboard-page"
      style={{
        background: '#f5f7fb',
        minHeight: '100%',
        paddingBottom: '30px',
      }}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-4">
        <CRow className="align-items-center">
          <CCol md={8}>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h3 className="fw-bold mb-0">Business Dashboard</h3>

                <CBadge color="success" className="px-2 py-1">
                  LIVE
                </CBadge>
              </div>

              <div className="text-body-secondary">
                Monitor sales, profitability, staff performance, inventory and business activity.
              </div>
            </div>
          </CCol>

          <CCol md={4} className="text-md-end mt-3 mt-md-0">
            <CButton
              color="light"
              className="border shadow-sm"
              onClick={refreshDashboard}
              disabled={refreshing}
            >
              {refreshing ? (
                <CSpinner size="sm" className="me-2" />
              ) : (
                <CIcon icon={cilReload} className="me-2" />
              )}

              {refreshing ? 'Updating...' : 'Refresh Dashboard'}
            </CButton>
          </CCol>
        </CRow>
      </div>

      {/* =====================================================
          ALERT CENTER
      ====================================================== */}

      {totalAlerts > 0 && (
        <CCard className="border-0 shadow-sm mb-4">
          <CCardHeader className="bg-white border-0 py-3 px-4">
            <div className="d-flex align-items-center">
              <div
                className="rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                style={{
                  width: 42,
                  height: 42,
                }}
              >
                <CIcon icon={cilWarning} className="text-warning" />
              </div>

              <div>
                <div className="fw-bold">Business Alerts</div>

                <small className="text-body-secondary">
                  {totalAlerts} item
                  {totalAlerts !== 1 ? 's' : ''} require attention
                </small>
              </div>
            </div>
          </CCardHeader>

          <CCardBody className="pt-0 px-4 pb-4">
            <CRow className="g-3">
              {dashboard.outOfStockProducts > 0 && (
                <CCol md={4}>
                  <div className="p-3 rounded-3 border bg-danger bg-opacity-10">
                    <div className="d-flex align-items-center">
                      <CIcon icon={cilWarning} className="text-danger me-3" size="lg" />

                      <div>
                        <div className="fw-bold text-danger">
                          {dashboard.outOfStockProducts} Out of Stock
                        </div>

                        <small className="text-body-secondary">
                          Products need immediate restocking.
                        </small>
                      </div>
                    </div>
                  </div>
                </CCol>
              )}

              {dashboard.lowStockProducts > 0 && (
                <CCol md={4}>
                  <div className="p-3 rounded-3 border bg-warning bg-opacity-10">
                    <div className="d-flex align-items-center">
                      <CIcon icon={cilWarning} className="text-warning me-3" size="lg" />

                      <div>
                        <div className="fw-bold text-warning">
                          {dashboard.lowStockProducts} Low Stock
                        </div>

                        <small className="text-body-secondary">
                          Products are below reorder level.
                        </small>
                      </div>
                    </div>
                  </div>
                </CCol>
              )}

              {Number(dashboard.pendingCommission || 0) > 0 && (
                <CCol md={4}>
                  <div className="p-3 rounded-3 border bg-info bg-opacity-10">
                    <div className="d-flex align-items-center">
                      <CIcon icon={cilPeople} className="text-info me-3" size="lg" />

                      <div>
                        <div className="fw-bold text-info">Pending Commission</div>

                        <small className="text-body-secondary">
                          {money(dashboard.pendingCommission)} awaiting payment.
                        </small>
                      </div>
                    </div>
                  </div>
                </CCol>
              )}
            </CRow>
          </CCardBody>
        </CCard>
      )}

      {/* =====================================================
          TODAY OVERVIEW
      ====================================================== */}

      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h5 className="fw-bold mb-1">Today's Overview</h5>

          <small className="text-body-secondary">Current business activity</small>
        </div>

        <CBadge color="light" className="text-body-secondary border px-3 py-2">
          <CIcon icon={cilCalendar} className="me-1" />
          Today
        </CBadge>
      </div>

      <CRow className="mb-4">
        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          <KpiCard
            title="Today's Sales"
            value={money(dashboard.todaySales)}
            icon={cilMoney}
            color="success"
          />
        </CCol>

        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          <KpiCard
            title="Today's Profit"
            value={money(dashboard.todayProfit)}
            icon={cilChartLine}
            color="primary"
          />
        </CCol>

        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          <KpiCard
            title="Transactions"
            value={Number(dashboard.todayTransactions || 0).toLocaleString()}
            icon={cilCart}
            color="info"
          />
        </CCol>

        <CCol sm={6} xl={3}>
          <KpiCard
            title="Today's Customers"
            value={Number(dashboard.todayCustomers || 0).toLocaleString()}
            icon={cilPeople}
            color="warning"
          />
        </CCol>
      </CRow>

      {/* =====================================================
          SALES PERFORMANCE
      ====================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="bg-white border-0 px-4 pt-4">
          <CRow className="align-items-center">
            <CCol>
              <h5 className="fw-bold mb-1">Sales Performance</h5>

              <small className="text-body-secondary">Sales activity over the last 7 days</small>
            </CCol>

            <CCol xs="auto">
              <div className="text-end">
                <small className="text-body-secondary d-block">7-Day Sales</small>

                <strong className="fs-5">
                  {money(
                    (dashboard.sevenDaysSales || []).reduce(
                      (sum, item) => sum + Number(item.sales || 0),
                      0,
                    ),
                  )}
                </strong>
              </div>
            </CCol>
          </CRow>
        </CCardHeader>

        <CCardBody className="px-4 pb-4">
          <div
            style={{
              height: '330px',
              position: 'relative',
            }}
          >
            {dashboard.sevenDaysSales?.length ? (
              <Line data={salesChartData} options={salesChartOptions} />
            ) : (
              <div className="h-100 d-flex flex-column justify-content-center align-items-center text-body-secondary">
                <CIcon icon={cilChartLine} size="xl" className="mb-2" />

                <div>No sales trend data available.</div>
              </div>
            )}
          </div>
        </CCardBody>
      </CCard>

      {/* =====================================================
          MONTHLY PERFORMANCE
      ====================================================== */}

      <div className="mb-3">
        <h5 className="fw-bold mb-1">Monthly Performance</h5>

        <small className="text-body-secondary">Current month's financial position</small>
      </div>

      <CRow className="mb-4">
        <CCol md={3} sm={6} className="mb-3 mb-md-0">
          <KpiCard
            title="Monthly Sales"
            value={money(dashboard.monthSales)}
            icon={cilMoney}
            color="success"
          />
        </CCol>

        <CCol md={3} sm={6} className="mb-3 mb-md-0">
          <KpiCard
            title="Monthly Profit"
            value={money(dashboard.monthProfit)}
            icon={cilChartLine}
            color="primary"
          />
        </CCol>

        <CCol md={3} sm={6}>
          <KpiCard
            title="Monthly Expenses"
            value={money(dashboard.monthExpenses)}
            icon={cilWarning}
            color="danger"
          />
        </CCol>

        <CCol md={3} sm={6}>
          <KpiCard
            title="Monthly Commission"
            value={money(dashboard.monthCommission)}
            icon={cilUser}
            color="warning"
          />
        </CCol>
      </CRow>

      {/* =====================================================
          SALES & PROFIT ANALYTICS
      ====================================================== */}

      <CRow className="mb-4">
        <CCol lg={7} className="mb-4 mb-lg-0">
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-white border-0 px-4 pt-4">
              <h5 className="fw-bold mb-1">Revenue & Profitability</h5>

              <small className="text-body-secondary">Sales composition and profitability</small>
            </CCardHeader>

            <CCardBody className="px-4">
              <CRow className="g-4">
                <CCol sm={6}>
                  <div className="text-body-secondary small mb-1">Gross Sales</div>

                  <div className="fs-4 fw-bold">{money(dashboard.grossSales)}</div>
                </CCol>

                <CCol sm={6}>
                  <div className="text-body-secondary small mb-1">Net Sales</div>

                  <div className="fs-4 fw-bold text-success">{money(dashboard.netSales)}</div>
                </CCol>

                <CCol sm={6}>
                  <div className="text-body-secondary small mb-1">Returns</div>

                  <div className="fs-4 fw-bold text-danger">{money(dashboard.totalReturns)}</div>
                </CCol>

                <CCol sm={6}>
                  <div className="text-body-secondary small mb-1">Average Sale</div>

                  <div className="fs-4 fw-bold">{money(dashboard.averageSale)}</div>
                </CCol>
              </CRow>

              <hr />

              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-body-secondary">Service Revenue</span>

                <strong>{money(dashboard.serviceRevenue)}</strong>
              </div>

              <CProgress
                value={
                  dashboard.netSales
                    ? (Number(dashboard.serviceRevenue) / Number(dashboard.netSales)) * 100
                    : 0
                }
                color="success"
                className="mb-3"
              />

              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-body-secondary">Product Revenue</span>

                <strong>{money(dashboard.productRevenue)}</strong>
              </div>

              <CProgress
                value={
                  dashboard.netSales
                    ? (Number(dashboard.productRevenue) / Number(dashboard.netSales)) * 100
                    : 0
                }
                color="info"
              />
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={5}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-white border-0 px-4 pt-4">
              <h5 className="fw-bold mb-1">Profit Distribution</h5>

              <small className="text-body-secondary">Current revenue allocation</small>
            </CCardHeader>

            <CCardBody className="px-4">
              <div className="p-3 rounded-3 bg-primary bg-opacity-10 mb-3">
                <div className="small text-body-secondary">Owner Profit</div>

                <div className="fs-4 fw-bold text-primary">{money(dashboard.ownerProfit)}</div>
              </div>

              <div className="p-3 rounded-3 bg-warning bg-opacity-10">
                <div className="small text-body-secondary">Staff Share</div>

                <div className="fs-4 fw-bold text-warning">{money(dashboard.staffShare)}</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          PAYMENT METHODS
      ====================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="bg-white border-0 px-4 pt-4">
          <h5 className="fw-bold mb-1">Payment Methods</h5>

          <small className="text-body-secondary">Sales distribution by payment method</small>
        </CCardHeader>

        <CCardBody className="px-4">
          <CRow className="g-4">
            {[
              {
                label: 'Cash',
                value: dashboard.cashSales,
                color: 'success',
              },
              {
                label: 'Transfer',
                value: dashboard.transferSales,
                color: 'primary',
              },
              {
                label: 'POS',
                value: dashboard.posSales,
                color: 'info',
              },
              {
                label: 'Mixed',
                value: dashboard.mixedSales,
                color: 'warning',
              },
            ].map((item) => (
              <CCol md={6} xl={3} key={item.label}>
                <div className="p-3 border rounded-3 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-body-secondary">{item.label}</span>

                    <strong>{paymentPercentage(item.value)}%</strong>
                  </div>

                  <div className="fs-5 fw-bold mb-2">{money(item.value)}</div>

                  <CProgress value={paymentPercentage(item.value)} color={item.color} />
                </div>
              </CCol>
            ))}
          </CRow>
        </CCardBody>
      </CCard>

      {/* =====================================================
          BUSINESS OVERVIEW
      ====================================================== */}

      <div className="mb-3">
        <h5 className="fw-bold mb-1">Business Overview</h5>

        <small className="text-body-secondary">Current business resources</small>
      </div>

      <CRow className="mb-4">
        <CCol md={3} sm={6} className="mb-3 mb-md-0">
          <KpiCard
            title="Products"
            value={Number(dashboard.totalProducts || 0).toLocaleString()}
            icon={cilBasket}
            color="primary"
          />
        </CCol>

        <CCol md={3} sm={6} className="mb-3 mb-md-0">
          <KpiCard
            title="Customers"
            value={Number(dashboard.totalCustomers || 0).toLocaleString()}
            icon={cilPeople}
            color="success"
          />
        </CCol>

        <CCol md={3} sm={6}>
          <KpiCard
            title="Staff"
            value={Number(dashboard.totalStaff || 0).toLocaleString()}
            icon={cilUser}
            color="warning"
          />
        </CCol>

        <CCol md={3} sm={6}>
          <KpiCard
            title="Inventory Value"
            value={money(dashboard.inventoryValue)}
            icon={cilMoney}
            color="info"
          />
        </CCol>
      </CRow>

      {/* =====================================================
          TOP PRODUCTS + TOP STAFF
      ====================================================== */}

      <CRow>
        {/* TOP PRODUCTS */}

        <CCol lg={6} className="mb-4">
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-white border-0 px-4 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-bold mb-1">Top Products</h5>

                  <small className="text-body-secondary">Best-selling products</small>
                </div>

                <CIcon icon={cilBasket} className="text-primary" size="lg" />
              </div>
            </CCardHeader>

            <CCardBody className="p-0">
              {dashboard.topProducts?.length ? (
                <div className="table-responsive">
                  <CTable hover responsive align="middle" className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell className="px-4">#</CTableHeaderCell>

                        <CTableHeaderCell>Product</CTableHeaderCell>

                        <CTableHeaderCell className="text-end px-4">Qty Sold</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {dashboard.topProducts.slice(0, 5).map((item, index) => (
                        <CTableRow key={item.ProductId || item.id || index}>
                          <CTableDataCell className="px-4">
                            <CAvatar
                              size="sm"
                              color={index === 0 ? 'primary' : 'light'}
                              textColor={index === 0 ? 'white' : 'dark'}
                            >
                              {index + 1}
                            </CAvatar>
                          </CTableDataCell>

                          <CTableDataCell>
                            <div className="fw-semibold">
                              {item.Product?.name || 'Unknown Product'}
                            </div>
                          </CTableDataCell>

                          <CTableDataCell className="text-end px-4">
                            <strong>{getProductQuantity(item).toLocaleString()}</strong>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              ) : (
                <div className="text-center py-5 text-body-secondary">
                  <CIcon icon={cilBasket} size="xl" className="mb-2" />

                  <div>No product sales data available.</div>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* TOP STAFF */}

        <CCol lg={6} className="mb-4">
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-white border-0 px-4 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-bold mb-1">Staff Performance</h5>

                  <small className="text-body-secondary">Commission generated by staff</small>
                </div>

                <CIcon icon={cilPeople} className="text-warning" size="lg" />
              </div>
            </CCardHeader>

            <CCardBody className="p-0">
              {dashboard.topStaff?.length ? (
                <div className="table-responsive">
                  <CTable hover responsive align="middle" className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell className="px-4">#</CTableHeaderCell>

                        <CTableHeaderCell>Staff</CTableHeaderCell>

                        <CTableHeaderCell className="text-end px-4">Commission</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {dashboard.topStaff.slice(0, 5).map((staff, index) => {
                        const name = staff?.Staff?.User?.fullname || 'Unknown'

                        return (
                          <CTableRow key={staff.StaffId || staff.id || index}>
                            <CTableDataCell className="px-4">
                              <CAvatar
                                size="sm"
                                color={index === 0 ? 'warning' : 'light'}
                                textColor={index === 0 ? 'dark' : 'dark'}
                              >
                                {name.charAt(0).toUpperCase()}
                              </CAvatar>
                            </CTableDataCell>

                            <CTableDataCell>
                              <div className="fw-semibold">{name}</div>
                            </CTableDataCell>

                            <CTableDataCell className="text-end px-4">
                              <strong className="text-success">
                                {money(staff?.totalCommission || 0)}
                              </strong>
                            </CTableDataCell>
                          </CTableRow>
                        )
                      })}
                    </CTableBody>
                  </CTable>
                </div>
              ) : (
                <div className="text-center py-5 text-body-secondary">
                  <CIcon icon={cilPeople} size="xl" className="mb-2" />

                  <div>No staff commission data available.</div>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          FINAL BUSINESS STATUS
      ====================================================== */}

      <CCard className="border-0 shadow-sm">
        <CCardBody className="p-4">
          <CRow className="align-items-center">
            <CCol md={8}>
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: 48,
                    height: 48,
                  }}
                >
                  <CIcon icon={cilCheckCircle} className="text-success" />
                </div>

                <div>
                  <div className="fw-bold">Dashboard Status</div>

                  <small className="text-body-secondary">
                    Your dashboard is connected and displaying the latest available business data.
                  </small>
                </div>
              </div>
            </CCol>

            <CCol md={4} className="text-md-end mt-3 mt-md-0">
              <small className="text-body-secondary">Total Alerts</small>

              <div className="fw-bold fs-5">{totalAlerts}</div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default Dashboard
