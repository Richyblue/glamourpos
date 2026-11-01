import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'

import ReturnModal from './ReturnModal'

import {
  cilSearch,
  cilCloudDownload,
  cilFilter,
  cilMoney,
  cilPeople,
  cilChart,
  cilCheckCircle,
  cilHome,
} from '@coreui/icons'

import CIcon from '@coreui/icons-react'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CFormInput,
  CFormSelect,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CBadge,
  CInputGroup,
  CInputGroupText,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const Report = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  // =========================================================
  // STATE
  // =========================================================

  const [loading, setLoading] = useState(false)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [providerFilter, setProviderFilter] = useState('')
  const [search, setSearch] = useState('')

  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState(null)
  const [showSaleDetails, setShowSaleDetails] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)

  const [sales, setSales] = useState([])
  const [report, setReport] = useState({})

  // =========================================================
  // HELPERS
  // =========================================================

  const money = (value) => {
    return `₦${Number(value || 0).toLocaleString()}`
  }

  // =========================================================
  // STAFF NAME HELPER
  // =========================================================

  const getStaffName = (staff) => {
    if (!staff) return '-'

    return (
      staff.fullname ||
      staff.Fullname ||
      staff.name ||
      staff.User?.fullname ||
      staff.user?.fullname ||
      staff.User?.name ||
      staff.user?.name ||
      '-'
    )
  }

  // =========================================================
  // SALE LEVEL PROVIDER
  // =========================================================

  const getProviderName = (sale) => {
    return getStaffName(sale?.ServiceProvider) || sale?.serviceProviderName || '-'
  }

  // =========================================================
  // SERVICE ITEM PROVIDER
  // =========================================================

  const getServiceItemProvider = (sale, item) => {
    /*
     * NEW PRIMARY SOURCE
     *
     * SaleItem.ServiceProvider
     */
    const directProvider =
      item?.ServiceProvider || item?.serviceProvider || item?.Staff || item?.staff

    if (directProvider) {
      const name = getStaffName(directProvider)

      if (name !== '-') {
        return name
      }
    }

    /*
     * SECONDARY SOURCE
     *
     * Look for the commission attached to this
     * exact SaleItem.
     */
    const commissions = getCommissions(sale)

    const matchingCommission = commissions.find(
      (commission) =>
        Number(commission?.SaleItemId) === Number(item?.id) ||
        Number(commission?.saleItemId) === Number(item?.id),
    )

    if (matchingCommission) {
      const commissionStaff = matchingCommission.Staff || matchingCommission.staff

      const commissionStaffName = getStaffName(commissionStaff)

      if (commissionStaffName !== '-') {
        return commissionStaffName
      }

      if (matchingCommission.staffName) {
        return matchingCommission.staffName
      }
    }

    /*
     * THIRD SOURCE
     *
     * Legacy Sale-level provider.
     */
    return getProviderName(sale)
  }

  // =========================================================
  // CASHIER
  // =========================================================

  const getCashierName = (sale) => {
    return (
      sale?.RecordedBy?.fullname ||
      sale?.RecordedBy?.User?.fullname ||
      sale?.RecordedBy?.user?.fullname ||
      sale?.recordedByName ||
      '-'
    )
  }

  // =========================================================
  // CUSTOMER
  // =========================================================

  const getCustomerName = (sale) => {
    return sale?.Customer?.fullname || sale?.Customer?.name || sale?.customerName || '-'
  }

  // =========================================================
  // RETURNS
  // =========================================================

  const getSaleReturns = (sale) => {
    return sale?.SalesReturns || sale?.salesReturns || sale?.SalesReturn || sale?.salesReturn || []
  }

  const getReturnedItems = (sale) => {
    return getSaleReturns(sale).flatMap(
      (returnRecord) => returnRecord?.ReturnItems || returnRecord?.returnItems || [],
    )
  }

  const getReturnedServiceItems = (sale) => {
    return getReturnedItems(sale).filter((item) => item.itemType === 'service')
  }

  const getReturnedProductItems = (sale) => {
    return getReturnedItems(sale).filter((item) => item.itemType === 'product')
  }

  const getSaleReturnTotal = (sale) => {
    return getSaleReturns(sale).reduce(
      (sum, returnRecord) => sum + Number(returnRecord?.totalRefund || 0),
      0,
    )
  }

  const getReturnedServiceQuantity = (sale, serviceId) => {
    return getReturnedServiceItems(sale)
      .filter((item) => Number(item.ServiceId) === Number(serviceId))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  }

  const getReturnedProductQuantity = (sale, productId) => {
    return getReturnedProductItems(sale)
      .filter((item) => Number(item.ProductId) === Number(productId))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  }

  const getServiceReturnStatus = (sale, item) => {
    const returnedQuantity = getReturnedServiceQuantity(sale, item.ServiceId)

    const originalQuantity = Number(item.quantity || 0)

    if (returnedQuantity <= 0) {
      return {
        returned: false,
        partial: false,
        returnedQuantity: 0,
        remainingQuantity: originalQuantity,
      }
    }

    const remainingQuantity = Math.max(originalQuantity - returnedQuantity, 0)

    return {
      returned: true,
      partial: remainingQuantity > 0,
      returnedQuantity,
      remainingQuantity,
    }
  }

  const getProductReturnStatus = (sale, item) => {
    const returnedQuantity = getReturnedProductQuantity(sale, item.ProductId)

    const originalQuantity = Number(item.quantity || 0)

    if (returnedQuantity <= 0) {
      return {
        returned: false,
        partial: false,
        returnedQuantity: 0,
        remainingQuantity: originalQuantity,
      }
    }

    const remainingQuantity = Math.max(originalQuantity - returnedQuantity, 0)

    return {
      returned: true,
      partial: remainingQuantity > 0,
      returnedQuantity,
      remainingQuantity,
    }
  }

  // =========================================================
  // COLORS
  // =========================================================

  const REVENUE_COLORS = ['#321fdb', '#e55353', '#2eb85c']

  // =========================================================
  // SALE ITEMS
  // =========================================================

  const getSaleItems = (sale) => {
    return sale?.SaleItems || sale?.saleItems || sale?.items || []
  }

  const getServiceItems = (sale) => {
    return getSaleItems(sale).filter(
      (item) =>
        item?.itemType === 'service' ||
        item?.saleType === 'service' ||
        item?.Service ||
        item?.service,
    )
  }

  const getProductItems = (sale) => {
    return getSaleItems(sale).filter(
      (item) =>
        item?.itemType === 'product' ||
        item?.saleType === 'product' ||
        item?.Product ||
        item?.product,
    )
  }

  // =========================================================
  // COMMISSIONS
  // =========================================================

  const getCommissions = (sale) => {
    const commissions =
      sale?.Commissions || sale?.commissions || sale?.Commission || sale?.commission || []

    if (Array.isArray(commissions)) {
      return commissions
    }

    return commissions ? [commissions] : []
  }

  const getCommission = (sale) => {
    return getCommissions(sale)[0] || null
  }

  const getPendingCommissions = (sale) => {
    return getCommissions(sale).filter(
      (commission) => String(commission?.status || '').toLowerCase() === 'pending',
    )
  }

  const getPaidCommissions = (sale) => {
    return getCommissions(sale).filter(
      (commission) => String(commission?.status || '').toLowerCase() === 'paid',
    )
  }

  // =========================================================
  // STAFF SHARE
  // =========================================================

  const getStaffShare = (sale) => {
    return getPendingCommissions(sale).reduce(
      (total, commission) =>
        total + Number(commission?.currentCommissionAmount ?? commission?.commissionAmount ?? 0),
      0,
    )
  }

  const getCurrentCommission = (sale) => {
    return getCommissions(sale).reduce(
      (total, commission) =>
        total + Number(commission?.currentCommissionAmount ?? commission?.commissionAmount ?? 0),
      0,
    )
  }

  const getPaidCommission = (sale) => {
    return getCommissions(sale).reduce(
      (total, commission) => total + Number(commission?.paidAmount || 0),
      0,
    )
  }

  const getReturnedCommission = (sale) => {
    return getCommissions(sale).reduce(
      (total, commission) => total + Number(commission?.returnedCommissionAmount || 0),
      0,
    )
  }

  const getOutstandingCommission = (sale) => {
    return getCommissions(sale).reduce(
      (total, commission) => total + Number(commission?.outstandingCommission || 0),
      0,
    )
  }

  const getCommissionRate = (sale) => {
    const commissions = getCommissions(sale)

    if (!commissions.length) {
      return 0
    }

    const rates = [
      ...new Set(
        commissions
          .map((commission) => Number(commission?.commissionRate || 0))
          .filter((rate) => rate > 0),
      ),
    ]

    return rates.length === 1 ? rates[0] : 0
  }

  const getCommissionStatus = (sale) => {
    const commissions = getCommissions(sale)

    if (!commissions.length) {
      return null
    }

    const statuses = [
      ...new Set(commissions.map((commission) => String(commission?.status || '').toLowerCase())),
    ]

    if (statuses.length === 1) {
      return statuses[0]
    }

    if (statuses.includes('pending') && statuses.includes('paid')) {
      return 'partial'
    }

    return statuses[0] || null
  }

  // =========================================================
  // SERVICE TYPE
  // =========================================================

  const getServiceType = (sale) => {
    if (sale?.serviceType) {
      return sale.serviceType
    }

    const commissions = getCommissions(sale)

    const rates = [
      ...new Set(
        commissions.map((commission) => Number(commission?.commissionRate || 0)).filter(Boolean),
      ),
    ]

    if (rates.length === 1) {
      if (rates[0] === 50) {
        return 'home_service'
      }

      if (rates[0] === 30) {
        return 'in_salon'
      }
    }

    return null
  }

  // =========================================================
  // REMAINING SERVICE VALUE
  // =========================================================

  const getRemainingServiceTotal = (sale) => {
    return getServiceItems(sale).reduce((sum, item) => {
      const originalQuantity = Number(item.quantity || 0)

      const originalSubtotal = Number(item.subtotal || 0)

      const returnedQuantity = getReturnedServiceQuantity(sale, item.ServiceId)

      const remainingQuantity = Math.max(originalQuantity - returnedQuantity, 0)

      const unitPrice = originalQuantity > 0 ? originalSubtotal / originalQuantity : 0

      return sum + remainingQuantity * unitPrice
    }, 0)
  }

  // =========================================================
  // REMAINING PRODUCT VALUE
  // =========================================================

  const getRemainingProductTotal = (sale) => {
    return getProductItems(sale).reduce((sum, item) => {
      const originalQuantity = Number(item.quantity || 0)

      const originalSubtotal = Number(item.subtotal || 0)

      const returnedQuantity = getReturnedProductQuantity(sale, item.ProductId)

      const remainingQuantity = Math.max(originalQuantity - returnedQuantity, 0)

      const unitPrice = originalQuantity > 0 ? originalSubtotal / originalQuantity : 0

      return sum + remainingQuantity * unitPrice
    }, 0)
  }

  // =========================================================
  // OWNER SERVICE PROFIT
  // =========================================================

  const getOwnerServiceProfit = (sale) => {
    const serviceRevenue = getRemainingServiceTotal(sale)

    const pendingCommission = getStaffShare(sale)

    return Math.max(serviceRevenue - pendingCommission, 0)
  }

  // =========================================================
  // SERVICE PROVIDERS
  //
  // IMPORTANT:
  // Build this from SaleItems, not Sale.ServiceProvider.
  // =========================================================

  const serviceProviders = useMemo(() => {
    const providerMap = new Map()

    sales.forEach((sale) => {
      const serviceItems = getServiceItems(sale)

      serviceItems.forEach((item) => {
        const providerName = getServiceItemProvider(sale, item)

        if (providerName && providerName !== '-') {
          providerMap.set(providerName, providerName)
        }
      })

      /*
       * Legacy fallback for old sales
       * that do not have item-level provider.
       */
      if (!serviceItems.length) {
        const legacyProvider = getProviderName(sale)

        if (legacyProvider && legacyProvider !== '-') {
          providerMap.set(legacyProvider, legacyProvider)
        }
      }
    })

    return Array.from(providerMap.values()).sort((a, b) => a.localeCompare(b))
  }, [sales])

  // =========================================================
  // CHECK WHETHER STAFF WORKED ON SALE
  // =========================================================

  const saleHasProvider = (sale, selectedProvider) => {
    if (!selectedProvider) {
      return true
    }

    const normalized = selectedProvider.trim().toLowerCase()

    /*
     * First check individual service providers.
     */
    const serviceItems = getServiceItems(sale)

    const itemProviderMatch = serviceItems.some((item) => {
      const provider = getServiceItemProvider(sale, item)

      return provider && provider.trim().toLowerCase() === normalized
    })

    if (itemProviderMatch) {
      return true
    }

    /*
     * Then check commission staff.
     */
    const commissionMatch = getCommissions(sale).some((commission) => {
      const staffName = getStaffName(commission?.Staff || commission?.staff)

      return staffName && staffName.trim().toLowerCase() === normalized
    })

    if (commissionMatch) {
      return true
    }

    /*
     * Finally support old Sale-level provider.
     */
    const legacyProvider = getProviderName(sale)

    return legacyProvider && legacyProvider.trim().toLowerCase() === normalized
  }

  // =========================================================
  // FILTER SALES
  // =========================================================

  const filteredSales = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return sales.filter((sale) => {
      const provider = getProviderName(sale).toLowerCase()

      const customer = getCustomerName(sale).toLowerCase()

      const cashier = getCashierName(sale).toLowerCase()

      const invoice = (sale?.invoiceNumber || sale?.receiptNumber || '').toLowerCase()

      const services = getServiceItems(sale)
        .map((item) => {
          const serviceName =
            item?.Service?.name || item?.service?.name || item?.serviceName || item?.name || ''

          const staffName = getServiceItemProvider(sale, item)

          return `${serviceName} ${staffName}`
        })
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !keyword ||
        invoice.includes(keyword) ||
        customer.includes(keyword) ||
        cashier.includes(keyword) ||
        provider.includes(keyword) ||
        services.includes(keyword)

      const matchesProvider = providerFilter === '' || saleHasProvider(sale, providerFilter)

      return matchesSearch && matchesProvider
    })
  }, [sales, search, providerFilter])

  // =========================================================
  // KPI CALCULATIONS
  // =========================================================

  const kpis = useMemo(() => {
    let grossSales = 0
    let totalServiceSales = 0
    let totalProductSales = 0
    let productProfit = 0
    let staffShare = 0
    let ownerServiceProfit = 0
    let homeServiceSales = 0
    let inSalonServiceSales = 0

    filteredSales.forEach((sale) => {
      const saleAmount = Number(sale.totalAmount || 0)

      grossSales += saleAmount

      const serviceTotal = getRemainingServiceTotal(sale)

      totalServiceSales += serviceTotal

      const productTotal = getRemainingProductTotal(sale)

      totalProductSales += productTotal

      /*
       * IMPORTANT:
       * This already sums every commission
       * belonging to this sale.
       *
       * Therefore:
       *
       * Staff A = ₦3,000
       * Staff B = ₦2,000
       * Staff C = ₦4,000
       *
       * Staff Share = ₦9,000
       */
      staffShare += getStaffShare(sale)

      ownerServiceProfit += getOwnerServiceProfit(sale)

      const serviceType = getServiceType(sale)

      if (serviceType === 'home_service') {
        homeServiceSales += serviceTotal
      }

      if (serviceType === 'in_salon') {
        inSalonServiceSales += serviceTotal
      }

      getProductItems(sale).forEach((item) => {
        const originalQuantity = Number(item.quantity || 0)

        const originalSubtotal = Number(item.subtotal || 0)

        const returnedQuantity = getReturnedProductQuantity(sale, item.ProductId)

        const remainingQuantity = Math.max(originalQuantity - returnedQuantity, 0)

        const unitPrice = originalQuantity > 0 ? originalSubtotal / originalQuantity : 0

        const costPrice = Number(item.Product?.costPrice || 0)

        productProfit += (unitPrice - costPrice) * remainingQuantity
      })
    })

    // Calculate returns from the sales currently displayed.
    // This keeps totals consistent with the provider/search filters.
    const totalReturns = filteredSales.reduce((total, sale) => total + getSaleReturnTotal(sale), 0)

    const netSales = Math.max(grossSales - totalReturns, 0)
    if (productProfit === 0 && Number(report.productProfit || 0) > 0) {
      productProfit = Number(report.productProfit || 0)
    }

    const ownerProfit = productProfit + ownerServiceProfit

    const totalExpenses = Number(report.totalExpenses || 0)

    const netProfit = ownerProfit - totalExpenses

    const totalProfit = ownerProfit

    const totalTransactions = filteredSales.length

    const averageSale = totalTransactions > 0 ? netSales / totalTransactions : 0

    return {
      grossSales,
      totalReturns,
      netSales,
      totalTransactions,
      totalServiceSales,
      totalProductSales,
      productProfit,
      staffShare,
      ownerServiceProfit,
      ownerProfit,
      totalExpenses,
      netProfit,
      totalProfit,
      averageSale,
      homeServiceSales,
      inSalonServiceSales,
    }
  }, [filteredSales, report])

  // =========================================================
  // SALES TREND
  // =========================================================

  const salesTrendData = useMemo(() => {
    const grouped = {}

    filteredSales.forEach((sale) => {
      const date = sale.createdAt
        ? new Date(sale.createdAt).toLocaleDateString('en-NG', {
            day: '2-digit',
            month: 'short',
          })
        : 'Unknown'

      if (!grouped[date]) {
        grouped[date] = {
          date,
          sales: 0,
        }
      }

      grouped[date].sales += Number(sale.totalAmount || 0)
    })

    return Object.values(grouped)
  }, [filteredSales])

  // =========================================================
  // PROFIT CHART
  // =========================================================

  const profitChartData = useMemo(() => {
    return [
      {
        name: 'Service Revenue',
        amount: Number(kpis.totalServiceSales || 0),
      },
      {
        name: 'Staff Share',
        amount: Number(kpis.staffShare || 0),
      },
      {
        name: 'Owner Service Profit',
        amount: Number(kpis.ownerServiceProfit || 0),
      },
    ]
  }, [kpis])

  // =========================================================
  // REVENUE BREAKDOWN
  // =========================================================

  const revenueBreakdownData = useMemo(() => {
    return [
      {
        name: 'In-Salon',
        value: Number(kpis.inSalonServiceSales || 0),
      },
      {
        name: 'Home Service',
        value: Number(kpis.homeServiceSales || 0),
      },
      {
        name: 'Products',
        value: Number(kpis.totalProductSales || 0),
      },
    ].filter((item) => item.value > 0)
  }, [kpis])

  // =========================================================
  // GET SALES REPORT
  // =========================================================

  const getSalesReport = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/report`, {
        params: {
          startDate,
          endDate,
          status: statusFilter,
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setReport(response.data || {})

      setSales(
        (response.data?.sales || []).map((sale) => ({
          ...sale,

          /*
           * Normalize commissions.
           */
          Commissions:
            sale?.Commissions || sale?.commissions || (sale?.Commission ? [sale.Commission] : []),

          /*
           * Normalize SaleItems.
           */
          SaleItems: sale?.SaleItems || sale?.saleItems || sale?.items || [],
        })),
      )
    } catch (error) {
      console.error('Report Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    getSalesReport()
  }, [])

  // =========================================================
  // RETURN
  // =========================================================

  const handleReturn = (sale) => {
    setSelectedSaleId(sale.id)

    setShowReturnModal(true)
  }

  // Presentation-only transaction details. Existing sale actions remain unchanged.
  const handleViewSale = (sale) => {
    setSelectedSale(sale)
    setShowSaleDetails(true)
  }

  // =========================================================
  // EXCEL EXPORT
  // =========================================================

  const exportExcel = () => {
    const exportData = []

    filteredSales.forEach((sale) => {
      const services = getServiceItems(sale)

      const returnAmount = getSaleReturnTotal(sale)

      const serviceRevenue = getRemainingServiceTotal(sale)

      const ownerServiceProfit = getOwnerServiceProfit(sale)

      const commissions = getCommissions(sale)

      /*
       * If the sale contains multiple services,
       * export the service/staff information together.
       */
      const serviceDetails = services
        .map((item) => {
          const serviceName =
            item?.Service?.name ||
            item?.service?.name ||
            item?.serviceName ||
            item?.name ||
            'Service'

          const staffName = getServiceItemProvider(sale, item)

          return `${serviceName} - ${staffName}`
        })
        .join(', ')

      exportData.push({
        Invoice: sale.invoiceNumber || sale.receiptNumber || '-',

        Customer: getCustomerName(sale),

        'Sales By': getCashierName(sale),

        'Service Provider': serviceDetails || getProviderName(sale),

        'Service Type': getServiceType(sale) === 'home_service' ? 'Home Service' : 'In-Salon',

        'Service Rendered': serviceDetails || '-',

        'Staff Count': new Set(
          commissions
            .map((commission) => getStaffName(commission?.Staff || commission?.staff))
            .filter((name) => name && name !== '-'),
        ).size,

        'Returned Amount': returnAmount,

        'Service Revenue': serviceRevenue,

        'Staff Share': getStaffShare(sale),

        'Owner Service Profit': ownerServiceProfit,

        'Commission Rate': `${getCommissionRate(sale)}%`,

        'Card Number': sale.CardNumber || '-',

        'Stand Tag': sale.StandTag || '-',

        Amount: Number(sale.totalAmount || 0),

        Status: sale.approvalStatus || '-',

        Date: sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '-',
      })
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report')

    XLSX.writeFile(workbook, 'SalesReport.xlsx')
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="fw-bold mb-1">Sales & Profit Report</h4>

              <div className="text-medium-emphasis">
                Track sales, services, staff commissions and owner profitability.
              </div>
            </div>

            <CButton color="success" onClick={exportExcel} disabled={!filteredSales.length}>
              <CIcon icon={cilCloudDownload} className="me-2" />
              Export Excel
            </CButton>
          </div>
        </CCardBody>
      </CCard>

      {/* =====================================================
          KPI SECTION
      ====================================================== */}

      <CRow className="g-3 mb-3">
        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Gross Sales</div>

              <h3 className="fw-bold text-success mb-1">{money(kpis.grossSales)}</h3>

              <small className="text-medium-emphasis">{kpis.totalTransactions} transactions</small>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Net Sales</div>

              <h3 className="fw-bold text-primary mb-1">{money(kpis.netSales)}</h3>

              <small className="text-medium-emphasis">
                Average sale: {money(kpis.averageSale)}
              </small>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Service Revenue</div>

              <h3 className="fw-bold text-info mb-1">{money(kpis.totalServiceSales)}</h3>

              <small className="text-medium-emphasis">
                In-Salon: {money(kpis.inSalonServiceSales)}
              </small>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Product Sales</div>

              <h3 className="fw-bold text-secondary mb-1">{money(kpis.totalProductSales)}</h3>

              <small className="text-medium-emphasis">Product revenue</small>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="g-3 mb-4">
        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Staff Share</div>

              <h3 className="fw-bold text-warning mb-1">{money(kpis.staffShare)}</h3>

              <small className="text-medium-emphasis">Pending service commission</small>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Owner Service Profit</div>

              <h3 className="fw-bold text-success mb-1">{money(kpis.ownerServiceProfit)}</h3>

              <small className="text-medium-emphasis">Service revenue − pending staff share</small>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Owner Profit</div>

              <h3 className="fw-bold text-success mb-1">{money(kpis.ownerProfit)}</h3>

              <small className="text-medium-emphasis">Product + service profit</small>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Net Profit</div>

              <h3 className="fw-bold text-success mb-1">{money(kpis.netProfit)}</h3>

              <small className="text-medium-emphasis">Owner profit − expenses</small>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          ANALYTICS
      ====================================================== */}

      <CRow className="g-3 mb-4">
        <CCol xs={12} lg={8}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold mb-1">Sales Performance</h5>

              <small className="text-medium-emphasis">
                Sales revenue for the current filtered report.
              </small>
            </CCardHeader>

            <CCardBody>
              {salesTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={salesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                    <XAxis dataKey="date" tickLine={false} axisLine={false} />

                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₦${Number(value).toLocaleString()}`}
                    />

                    <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="sales"
                      name="Sales"
                      stroke="#321fdb"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-medium-emphasis py-5">
                  No sales data available for the selected filters.
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} lg={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold mb-1">Revenue Breakdown</h5>

              <small className="text-medium-emphasis">Services and product revenue</small>
            </CCardHeader>

            <CCardBody>
              {revenueBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={revenueBreakdownData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={105}
                      innerRadius={55}
                      paddingAngle={3}
                    >
                      {revenueBreakdownData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={REVENUE_COLORS[index % REVENUE_COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-medium-emphasis py-5">
                  No revenue data available.
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          PROFIT ANALYSIS
      ====================================================== */}

      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard className="border-0 shadow-sm">
            <CCardHeader className="bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold mb-1">Service Revenue & Profit Analysis</h5>

              <small className="text-medium-emphasis">
                Compare service revenue, current pending staff share and owner service profit.
              </small>
            </CCardHeader>

            <CCardBody>
              <ResponsiveContainer width="100%" height={330}>
                <BarChart data={profitChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />

                  <XAxis dataKey="name" tickLine={false} axisLine={false} />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₦${Number(value).toLocaleString()}`}
                  />

                  <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />

                  <Bar dataKey="amount" name="Amount" radius={[6, 6, 0, 0]}>
                    {profitChartData.map((entry, index) => (
                      <Cell
                        key={`profit-cell-${index}`}
                        fill={index === 0 ? '#321fdb' : index === 1 ? '#f9b115' : '#2eb85c'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="bg-transparent border-0">
          <div className="d-flex align-items-center">
            <CIcon icon={cilFilter} className="me-2" />

            <strong>Report Filters</strong>
          </div>
        </CCardHeader>

        <CCardBody>
          <CRow className="g-3">
            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">Start Date</label>

              <CFormInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </CCol>

            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">End Date</label>

              <CFormInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </CCol>

            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">Status</label>

              <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>

                <option value="approved">Approved</option>

                <option value="pending">Pending</option>

                <option value="cancelled">Cancelled</option>
              </CFormSelect>
            </CCol>

            <CCol xs={12} md={3}>
              <label className="small fw-semibold mb-1">Service Provider</label>

              <CFormSelect
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
              >
                <option value="">All Service Providers</option>

                {serviceProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol xs={12} md={3}>
              <label className="small fw-semibold mb-1">Search</label>

              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>

                <CFormInput
                  placeholder="Invoice, customer, staff or service..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </CInputGroup>
            </CCol>
          </CRow>

          <div className="mt-3 d-flex gap-2">
            <CButton color="primary" onClick={getSalesReport} disabled={loading}>
              {loading ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Loading...
                </>
              ) : (
                <>
                  <CIcon icon={cilFilter} className="me-2" />
                  Apply Date/Status Filter
                </>
              )}
            </CButton>

            {(providerFilter || search) && (
              <CButton
                color="secondary"
                variant="outline"
                onClick={() => {
                  setProviderFilter('')
                  setSearch('')
                }}
              >
                Clear Search
              </CButton>
            )}
          </div>
        </CCardBody>
      </CCard>

      {/* =====================================================
          FILTER SUMMARY
      ====================================================== */}

      {(providerFilter || search) && (
        <CCard className="border-0 shadow-sm mb-4">
          <CCardBody>
            <div className="d-flex align-items-center flex-wrap gap-3">
              <strong>Current View:</strong>

              {providerFilter && (
                <CBadge color="primary" className="px-3 py-2">
                  Provider: {providerFilter}
                </CBadge>
              )}

              {search && (
                <CBadge color="info" className="px-3 py-2">
                  Search: {search}
                </CBadge>
              )}

              <span className="text-medium-emphasis">
                {filteredSales.length} matching transaction
                {filteredSales.length !== 1 ? 's' : ''}
              </span>

              <strong>{money(kpis.netSales)}</strong>
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* =====================================================
          SALES TABLE — COMPACT TRANSACTION OVERVIEW
      ====================================================== */}

      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-transparent py-3">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="mb-1 fw-bold">Sales Transactions</h5>
              <small className="text-medium-emphasis">
                {filteredSales.length} transaction{filteredSales.length !== 1 ? 's' : ''} · Select View for the full transaction breakdown
              </small>
            </div>
            <CBadge color="primary" className="px-3 py-2">
              Staff Share: {money(kpis.staffShare)}
            </CBadge>
          </div>
        </CCardHeader>

        <CCardBody className="p-0">
          <CTable hover responsive className="mb-0 align-middle report-transactions-table">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell className="ps-3">Transaction</CTableHeaderCell>
                <CTableHeaderCell>Customer</CTableHeaderCell>
                <CTableHeaderCell>Assigned Staff</CTableHeaderCell>
                <CTableHeaderCell>Sale Type</CTableHeaderCell>
                <CTableHeaderCell>Net Revenue</CTableHeaderCell>
                <CTableHeaderCell>Staff Commission</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Date</CTableHeaderCell>
                <CTableHeaderCell className="text-end pe-3">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const services = getServiceItems(sale)
                  const products = getProductItems(sale)
                  const returnAmount = getSaleReturnTotal(sale)
                  const netAmount = Math.max(Number(sale.totalAmount || 0) - returnAmount, 0)
                  const currentCommission = getCurrentCommission(sale)
                  const paidCommission = getPaidCommission(sale)
                  const pendingCommission = getStaffShare(sale)
                  const providers = [...new Set([
                    ...services.map((item) => getServiceItemProvider(sale, item)),
                    ...getCommissions(sale).map((commission) => getStaffName(commission?.Staff || commission?.staff)),
                  ].filter((name) => name && name !== '-'))]
                  const saleType = services.length && products.length
                    ? 'Mixed sale'
                    : services.length ? 'Service' : products.length ? 'Product' : 'Sale'
                  const status = String(sale.approvalStatus || 'pending').toLowerCase()

                  return (
                    <CTableRow key={sale.id}>
                      <CTableDataCell className="ps-3">
                        <div className="fw-semibold text-primary">{sale.invoiceNumber || sale.receiptNumber || `#${sale.id}`}</div>
                        <small className="text-medium-emphasis">{saleType}</small>
                        {returnAmount > 0 && <div><CBadge color="danger" className="mt-1">Returned {money(returnAmount)}</CBadge></div>}
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="fw-semibold">{getCustomerName(sale)}</div>
                        <small className="text-medium-emphasis">Cashier: {getCashierName(sale)}</small>
                      </CTableDataCell>

                      <CTableDataCell>
                        {providers.length ? (
                          <div className="d-flex align-items-center gap-2">
                            <span className="report-staff-count">{providers.length}</span>
                            <div>
                              <div className="fw-semibold">{providers.length} staff assigned</div>
                              <small className="text-medium-emphasis">View names & allocation</small>
                            </div>
                          </div>
                        ) : <span className="text-medium-emphasis">Not assigned</span>}
                      </CTableDataCell>

                      <CTableDataCell>
                        {services.length > 0 && <CBadge color="info" className="me-1">Service</CBadge>}
                        {products.length > 0 && <CBadge color="secondary">Product</CBadge>}
                        {!services.length && !products.length && '-'}
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="fw-bold">{money(netAmount)}</div>
                        {returnAmount > 0 && <small className="text-danger">Less {money(returnAmount)} return</small>}
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="fw-semibold">{money(currentCommission)}</div>
                        <small className="text-medium-emphasis">
                          {paidCommission > 0 ? `Paid ${money(paidCommission)}` : pendingCommission > 0 ? 'Awaiting payment' : 'No commission'}
                        </small>
                      </CTableDataCell>

                      <CTableDataCell>
                        <CBadge color={status === 'approved' ? 'success' : status === 'cancelled' ? 'danger' : 'warning'}>
                          {sale.approvalStatus || 'pending'}
                        </CBadge>
                        {returnAmount > 0 && <div><CBadge color="danger" className="mt-1">RETURN</CBadge></div>}
                      </CTableDataCell>

                      <CTableDataCell>
                        <div>{sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('en-NG') : '-'}</div>
                        <small className="text-medium-emphasis">{sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) : ''}</small>
                      </CTableDataCell>

                      <CTableDataCell className="text-end pe-3">
                        <div className="d-inline-flex gap-2">
                          <CButton color="primary" variant="outline" size="sm" onClick={() => handleViewSale(sale)}>
                            View
                          </CButton>
                          <CButton color="warning" size="sm" disabled={sale.status === 'refunded'} onClick={() => handleReturn(sale)}>
                            {sale.status === 'refunded' ? 'Returned' : 'Return'}
                          </CButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan="9" className="text-center py-5">
                    <CIcon icon={cilSearch} size="xl" className="text-medium-emphasis mb-3" />
                    <h5>No sales found</h5>
                    <p className="text-medium-emphasis mb-0">Try changing your search, service provider or date filters.</p>
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* =====================================================
          TRANSACTION DETAILS — READ-ONLY PRESENTATION
      ====================================================== */}
      <CModal
        alignment="center"
        size="xl"
        scrollable
        visible={showSaleDetails}
        onClose={() => setShowSaleDetails(false)}
        className="report-detail-modal"
        backdrop="static"
      >
        <CModalHeader className="report-detail-header">
          <div className="w-100 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <div className="small text-white-50 text-uppercase fw-semibold mb-1">Transaction record</div>
              <CModalTitle className="text-white fw-bold">
                {selectedSale?.invoiceNumber || selectedSale?.receiptNumber || (selectedSale ? `Transaction #${selectedSale.id}` : 'Transaction details')}
              </CModalTitle>
              <small className="text-white-50">Complete sales, service, staff and commission breakdown</small>
            </div>
            {selectedSale && (
              <CBadge color={String(selectedSale.approvalStatus || 'pending').toLowerCase() === 'approved' ? 'success' : String(selectedSale.approvalStatus || '').toLowerCase() === 'cancelled' ? 'danger' : 'warning'} className="px-3 py-2">
                {selectedSale.approvalStatus || 'pending'}
              </CBadge>
            )}
          </div>
        </CModalHeader>

        <CModalBody className="p-3 p-lg-4">
          {selectedSale && (() => {
            const sale = selectedSale
            const services = getServiceItems(sale)
            const products = getProductItems(sale)
            const commissions = getCommissions(sale)
            const returns = getSaleReturns(sale)
            const returnAmount = getSaleReturnTotal(sale)
            const serviceRevenue = getRemainingServiceTotal(sale)
            const productRevenue = getRemainingProductTotal(sale)
            const grossAmount = Number(sale.totalAmount || 0)
            const netAmount = Math.max(grossAmount - returnAmount, 0)
            const earnedCommission = getCurrentCommission(sale)
            const paidCommission = getPaidCommission(sale)
            const outstandingCommission = getOutstandingCommission(sale)
            const reversedCommission = getReturnedCommission(sale)
            const ownerServiceProfit = getOwnerServiceProfit(sale)
            const providers = [...new Set([
              ...services.map((item) => getServiceItemProvider(sale, item)),
              ...commissions.map((commission) => getStaffName(commission?.Staff || commission?.staff)),
            ].filter((name) => name && name !== '-'))]
            const paymentMethod = sale.paymentMethod || sale.PaymentMethod || sale.payment_method || sale.paymentType || '-'
            const serviceTypeLabel = (value) => value === 'home_service' ? 'Home service' : value === 'in_salon' ? 'In-salon' : value || '-'
            const itemName = (item, type) => type === 'service'
              ? item?.Service?.name || item?.service?.name || item?.serviceName || item?.name || 'Service'
              : item?.Product?.name || item?.product?.name || item?.productName || item?.name || 'Product'

            return (
              <div className="report-detail-content">
                {/* TOP SUMMARY */}
                <div className="report-detail-summary mb-4">
                  <div>
                    <span className="report-detail-eyebrow">Net transaction value</span>
                    <div className="report-detail-total">{money(netAmount)}</div>
                    <small>{sale.createdAt ? new Date(sale.createdAt).toLocaleString('en-NG') : 'Date not available'}</small>
                  </div>
                  <div className="report-detail-summary-stats">
                    <div><span>Gross amount</span><strong>{money(grossAmount)}</strong></div>
                    <div><span>Returns</span><strong className={returnAmount > 0 ? 'text-danger' : ''}>{money(returnAmount)}</strong></div>
                    <div><span>Items</span><strong>{services.length + products.length}</strong></div>
                  </div>
                </div>

                {/* TRANSACTION INFORMATION */}
                <section className="report-detail-section mb-4">
                  <div className="report-section-heading"><span className="report-section-icon">01</span><div><h6>Transaction information</h6><small>Customer, operator and payment details</small></div></div>
                  <CRow className="g-3">
                    {[
                      ['Customer', getCustomerName(sale)],
                      ['Recorded by / Cashier', getCashierName(sale)],
                      ['Payment method', paymentMethod],
                      ['Service mode', serviceTypeLabel(getServiceType(sale))],
                      ['Card number', sale.CardNumber || sale.cardNumber || '—'],
                      ['Stand tag', sale.StandTag || sale.standTag || '—'],
                    ].map(([label, value]) => (
                      <CCol xs={12} sm={6} md={4} key={label}>
                        <div className="report-detail-field"><span>{label}</span><strong>{value || '—'}</strong></div>
                      </CCol>
                    ))}
                  </CRow>
                </section>

                {/* SERVICE LINES */}
                <section className="report-detail-section mb-4">
                  <div className="report-section-heading"><span className="report-section-icon">02</span><div><h6>Services rendered</h6><small>Service-level staff assignment, quantities and returns</small></div><CBadge color="info" className="ms-auto">{services.length} service{services.length !== 1 ? 's' : ''}</CBadge></div>
                  {services.length ? (
                    <div className="table-responsive"><table className="table report-detail-lines mb-0">
                      <thead><tr><th>Service</th><th>Assigned staff</th><th>Service mode</th><th>Qty</th><th>Amount</th><th>Return status</th></tr></thead>
                      <tbody>{services.map((item, index) => {
                        const returned = getServiceReturnStatus(sale, item)
                        const type = item?.serviceType || item?.ServiceType || getServiceType(sale)
                        return <tr key={item.id || index}>
                          <td><strong>{itemName(item, 'service')}</strong></td>
                          <td>{getServiceItemProvider(sale, item)}</td>
                          <td><span className="report-mode-pill">{serviceTypeLabel(type)}</span></td>
                          <td>{item.quantity || 1}</td>
                          <td className="fw-semibold">{money(item.subtotal)}</td>
                          <td>{returned.returned ? <CBadge color={returned.partial ? 'warning' : 'danger'}>{returned.partial ? `${returned.returnedQuantity} returned · ${returned.remainingQuantity} left` : 'Returned'}</CBadge> : <CBadge color="success">Active</CBadge>}</td>
                        </tr>
                      })}</tbody>
                    </table></div>
                  ) : <div className="report-detail-empty">No service items recorded for this transaction.</div>}
                </section>

                {/* PRODUCT LINES */}
                <section className="report-detail-section mb-4">
                  <div className="report-section-heading"><span className="report-section-icon">03</span><div><h6>Products sold</h6><small>Product quantities, values and return status</small></div><CBadge color="secondary" className="ms-auto">{products.length} product{products.length !== 1 ? 's' : ''}</CBadge></div>
                  {products.length ? (
                    <div className="table-responsive"><table className="table report-detail-lines mb-0">
                      <thead><tr><th>Product</th><th>Quantity</th><th>Unit price</th><th>Line total</th><th>Return status</th></tr></thead>
                      <tbody>{products.map((item, index) => {
                        const returned = getProductReturnStatus(sale, item)
                        const qty = Number(item.quantity || 1)
                        const unitPrice = qty > 0 ? Number(item.subtotal || 0) / qty : 0
                        return <tr key={item.id || index}>
                          <td><strong>{itemName(item, 'product')}</strong></td><td>{qty}</td><td>{money(unitPrice)}</td><td className="fw-semibold">{money(item.subtotal)}</td>
                          <td>{returned.returned ? <CBadge color={returned.partial ? 'warning' : 'danger'}>{returned.partial ? `${returned.returnedQuantity} returned · ${returned.remainingQuantity} left` : 'Returned'}</CBadge> : <CBadge color="success">Active</CBadge>}</td>
                        </tr>
                      })}</tbody>
                    </table></div>
                  ) : <div className="report-detail-empty">No product items recorded for this transaction.</div>}
                </section>

                {/* COMMISSION */}
                <section className="report-detail-section mb-4">
                  <div className="report-section-heading"><span className="report-section-icon">04</span><div><h6>Staff commission breakdown</h6><small>Commission records and payment status by staff member</small></div><CBadge color="primary" className="ms-auto">{commissions.length} record{commissions.length !== 1 ? 's' : ''}</CBadge></div>
                  {commissions.length ? (
                    <div className="table-responsive"><table className="table report-detail-lines mb-0">
                      <thead><tr><th>Staff member</th><th>Commission rate</th><th>Commission</th><th>Paid</th><th>Outstanding</th><th>Reversed</th><th>Status</th></tr></thead>
                      <tbody>{commissions.map((commission, index) => {
                        const staff = getStaffName(commission?.Staff || commission?.staff)
                        const amount = Number(commission?.currentCommissionAmount ?? commission?.commissionAmount ?? 0)
                        const status = String(commission?.status || '—').toLowerCase()
                        return <tr key={commission.id || index}>
                          <td><strong>{staff !== '-' ? staff : commission.staffName || 'Staff not linked'}</strong></td>
                          <td>{Number(commission?.commissionRate || 0)}%</td>
                          <td className="fw-semibold">{money(amount)}</td>
                          <td className="text-success">{money(commission?.paidAmount)}</td>
                          <td className="text-warning">{money(commission?.outstandingCommission)}</td>
                          <td className="text-danger">{money(commission?.returnedCommissionAmount)}</td>
                          <td><CBadge color={status === 'paid' ? 'success' : status === 'pending' ? 'warning' : 'secondary'}>{commission?.status || 'Not specified'}</CBadge></td>
                        </tr>
                      })}</tbody>
                    </table></div>
                  ) : <div className="report-detail-empty">No commission records are attached to this transaction.</div>}
                  {providers.length > 0 && <div className="report-assigned-staff mt-3"><span className="small text-medium-emphasis me-2">Assigned team</span>{providers.map((name) => <CBadge color="light" textColor="dark" className="me-1 mb-1" key={name}>{name}</CBadge>)}</div>}
                </section>

                {/* RETURNS HISTORY */}
                <section className="report-detail-section mb-4">
                  <div className="report-section-heading"><span className="report-section-icon">05</span><div><h6>Returns & adjustments</h6><small>Refund records associated with this sale</small></div><CBadge color={returns.length ? 'danger' : 'success'} className="ms-auto">{returns.length} return{returns.length !== 1 ? 's' : ''}</CBadge></div>
                  {returns.length ? <div className="table-responsive"><table className="table report-detail-lines mb-0"><thead><tr><th>Return date</th><th>Reference</th><th>Reason</th><th>Refund amount</th></tr></thead><tbody>{returns.map((record, index) => <tr key={record.id || index}><td>{record.createdAt ? new Date(record.createdAt).toLocaleString('en-NG') : '—'}</td><td>{record.returnNumber || record.reference || record.id || '—'}</td><td>{record.reason || record.notes || '—'}</td><td className="fw-semibold text-danger">-{money(record.totalRefund)}</td></tr>)}</tbody></table></div> : <div className="report-detail-empty">There are no returns or refunds for this transaction.</div>}
                </section>

                {/* FINANCIAL SUMMARY */}
                <section className="report-detail-section report-financial-section">
                  <div className="report-section-heading"><span className="report-section-icon">06</span><div><h6>Financial summary</h6><small>Transaction value and current commission position</small></div></div>
                  <div className="report-financial-grid">
                    <div><span>Gross sale</span><strong>{money(grossAmount)}</strong></div>
                    <div><span>Service revenue after returns</span><strong>{money(serviceRevenue)}</strong></div>
                    <div><span>Product revenue after returns</span><strong>{money(productRevenue)}</strong></div>
                    <div><span>Refunds / returns</span><strong className="text-danger">-{money(returnAmount)}</strong></div>
                    <div><span>Net transaction</span><strong>{money(netAmount)}</strong></div>
                    <div><span>Commission total</span><strong>{money(earnedCommission)}</strong></div>
                    <div><span>Commission paid</span><strong className="text-success">{money(paidCommission)}</strong></div>
                    <div><span>Commission outstanding</span><strong className="text-warning">{money(outstandingCommission)}</strong></div>
                    <div><span>Commission reversed</span><strong className="text-danger">{money(reversedCommission)}</strong></div>
                    <div className="report-owner-profit"><span>Owner service profit*</span><strong>{money(ownerServiceProfit)}</strong></div>
                  </div>
                  <small className="text-medium-emphasis d-block mt-3">*Owner service profit follows the report's existing calculation and is displayed here without changing the underlying report logic.</small>
                </section>
              </div>
            )
          })()}
        </CModalBody>
        <CModalFooter className="report-detail-footer">
          <div className="me-auto small text-medium-emphasis">Read-only transaction details · Existing report figures and actions are unchanged</div>
          {selectedSale && <CButton color="warning" onClick={() => { setShowSaleDetails(false); handleReturn(selectedSale) }} disabled={selectedSale.status === 'refunded'}>Process Return</CButton>}
          <CButton color="secondary" variant="outline" onClick={() => setShowSaleDetails(false)}>Close</CButton>
        </CModalFooter>
      </CModal>

      <style>{`
        .report-transactions-table th { white-space: nowrap; font-size: .76rem; text-transform: uppercase; letter-spacing: .045em; color: #687386; font-weight: 700; }
        .report-transactions-table td { padding-top: .9rem; padding-bottom: .9rem; font-size: .875rem; }
        .report-staff-count { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(50,31,219,.09); color: #321fdb; font-weight: 800; }
        .report-detail-modal .modal-dialog { animation: reportModalIn .28s cubic-bezier(.2,.8,.2,1); }
        .report-detail-modal .modal-content { border: 0; border-radius: 18px; overflow: hidden; box-shadow: 0 24px 80px rgba(15,23,42,.25); }
        .report-detail-header { border: 0; padding: 1.35rem 1.6rem; color: #fff; background: linear-gradient(120deg,#172554 0%,#243b78 55%,#321fdb 100%); }
        .report-detail-header .btn-close { filter: invert(1) grayscale(100%) brightness(200%); }
        .report-detail-content { animation: reportContentIn .35s ease both; }
        .report-detail-summary { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; padding: 1.35rem 1.5rem; border-radius: 15px; color: #fff; background: linear-gradient(120deg,#101b3b,#263d75); }
        .report-detail-eyebrow { display: block; color: rgba(255,255,255,.68); font-size: .72rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
        .report-detail-total { font-size: clamp(1.7rem,4vw,2.35rem); font-weight: 800; letter-spacing: -.04em; line-height: 1.25; }
        .report-detail-summary small { color: rgba(255,255,255,.68); }
        .report-detail-summary-stats { display: flex; flex-wrap: wrap; gap: 1.4rem; }
        .report-detail-summary-stats div { display: flex; flex-direction: column; gap: .25rem; }
        .report-detail-summary-stats span { color: rgba(255,255,255,.65); font-size: .72rem; }
        .report-detail-summary-stats strong { color: #fff; font-size: .98rem; }
        .report-detail-section { padding: 1.2rem; border: 1px solid #e9edf5; border-radius: 14px; background: #fff; box-shadow: 0 4px 16px rgba(15,23,42,.035); }
        .report-section-heading { display: flex; align-items: center; gap: .75rem; margin-bottom: 1rem; }
        .report-section-heading h6 { margin: 0; font-weight: 800; color: #172033; }
        .report-section-heading small { color: #8791a3; font-size: .76rem; }
        .report-section-icon { width: 34px; height: 34px; flex: 0 0 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; background: #eef1ff; color: #321fdb; font-size: .75rem; font-weight: 800; }
        .report-detail-field { height: 100%; padding: .75rem .85rem; border-radius: 10px; background: #f7f8fc; }
        .report-detail-field span, .report-financial-grid span { display: block; margin-bottom: .25rem; color: #7c8799; font-size: .72rem; font-weight: 600; }
        .report-detail-field strong { color: #202b40; font-size: .88rem; overflow-wrap: anywhere; }
        .report-detail-lines { font-size: .82rem; vertical-align: middle; }
        .report-detail-lines thead th { padding: .7rem .65rem; border-bottom: 1px solid #e6eaf1; color: #7b8495; background: #f8f9fc; font-size: .69rem; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
        .report-detail-lines tbody td { padding: .75rem .65rem; border-color: #edf0f5; }
        .report-mode-pill { display: inline-block; padding: .28rem .55rem; border-radius: 20px; background: #eef1ff; color: #3546a5; font-size: .72rem; font-weight: 700; white-space: nowrap; }
        .report-detail-empty { padding: 1rem; border: 1px dashed #dce2ec; border-radius: 10px; color: #8791a3; text-align: center; font-size: .84rem; }
        .report-financial-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: .7rem; }
        .report-financial-grid > div { padding: .8rem .9rem; border-radius: 10px; background: #f7f8fc; }
        .report-financial-grid strong { color: #202b40; font-size: .92rem; }
        .report-financial-grid .report-owner-profit { background: #edf9f1; }
        .report-financial-grid .report-owner-profit strong { color: #168348; }
        .report-detail-footer { padding: 1rem 1.5rem; background: #fbfcfe; }
        @keyframes reportModalIn { from { opacity: 0; transform: translateY(14px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes reportContentIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 575.98px) { .report-detail-summary { align-items: flex-start; flex-direction: column; } .report-detail-summary-stats { width: 100%; justify-content: space-between; gap: .65rem; } .report-financial-grid { grid-template-columns: 1fr; } .report-detail-section { padding: .9rem; } .report-detail-footer { align-items: stretch; flex-direction: column; } .report-detail-footer .me-auto { margin: 0 !important; } }
        @media (prefers-reduced-motion: reduce) { .report-detail-modal .modal-dialog, .report-detail-content { animation: none !important; } }
      `}</style>

      {/* =====================================================
          RETURN MODAL
      ====================================================== */}

      <ReturnModal
        show={showReturnModal}
        onHide={() => setShowReturnModal(false)}
        saleId={selectedSaleId}
        reload={getSalesReport}
      />
    </>
  )
}

export default Report
