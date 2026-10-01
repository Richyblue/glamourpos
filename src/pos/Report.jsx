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

    const totalReturns = Number(report.totalReturns || 0)

    const netSales = grossSales - totalReturns

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
          SALES TABLE
      ====================================================== */}

      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-transparent">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1 fw-bold">Sales Transactions</h5>

              <small className="text-medium-emphasis">
                Showing {filteredSales.length} transaction
                {filteredSales.length !== 1 ? 's' : ''}
              </small>
            </div>

            <CBadge color="primary" className="px-3 py-2">
              Staff Share: {money(kpis.staffShare)}
            </CBadge>
          </div>
        </CCardHeader>

        <CCardBody className="p-0">
          <CTable hover responsive className="mb-0 align-middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Invoice</CTableHeaderCell>

                <CTableHeaderCell>Customer</CTableHeaderCell>

                <CTableHeaderCell>Sales By</CTableHeaderCell>

                <CTableHeaderCell>Service Provider</CTableHeaderCell>

                <CTableHeaderCell>Service Rendered</CTableHeaderCell>

                <CTableHeaderCell>Service Type</CTableHeaderCell>

                <CTableHeaderCell>Revenue</CTableHeaderCell>

                <CTableHeaderCell>Staff Share</CTableHeaderCell>

                <CTableHeaderCell>Owner Profit</CTableHeaderCell>

                <CTableHeaderCell>Card / Stand</CTableHeaderCell>

                <CTableHeaderCell>Status</CTableHeaderCell>

                <CTableHeaderCell>Date</CTableHeaderCell>

                <CTableHeaderCell>Action</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const services = getServiceItems(sale)

                  const returnAmount = getSaleReturnTotal(sale)

                  const serviceTotal = getRemainingServiceTotal(sale)

                  const productTotal = getRemainingProductTotal(sale)

                  const staffShare = getStaffShare(sale)

                  const currentCommission = getCurrentCommission(sale)

                  const paidCommission = getPaidCommission(sale)

                  const returnedCommission = getReturnedCommission(sale)

                  const outstandingCommission = getOutstandingCommission(sale)

                  const commissionStatus = getCommissionStatus(sale)

                  const commissionRate = getCommissionRate(sale)

                  const serviceType = getServiceType(sale)

                  const isHomeService = serviceType === 'home_service'

                  const ownerServiceProfit = getOwnerServiceProfit(sale)

                  const saleNetAmount = Math.max(Number(sale.totalAmount || 0) - returnAmount, 0)

                  const hasReturnedProduct = getReturnedProductItems(sale).length > 0

                  const commissionIsPending = commissionStatus === 'pending'

                  const commissionIsPaid = commissionStatus === 'paid'

                  const commissionIsPartial = commissionStatus === 'partial'

                  /*
                   * All staff on this sale.
                   */
                  const saleProviders = [
                    ...new Set(
                      services
                        .map((item) => getServiceItemProvider(sale, item))
                        .filter((name) => name && name !== '-'),
                    ),
                  ]

                  return (
                    <CTableRow key={sale.id}>
                      {/* INVOICE */}

                      <CTableDataCell>
                        <strong>{sale.invoiceNumber || sale.receiptNumber || '-'}</strong>

                        {returnAmount > 0 && (
                          <div className="mt-1">
                            <CBadge color="danger">RETURNED: {money(returnAmount)}</CBadge>
                          </div>
                        )}
                      </CTableDataCell>

                      {/* CUSTOMER */}

                      <CTableDataCell>{getCustomerName(sale)}</CTableDataCell>

                      {/* CASHIER */}

                      <CTableDataCell>{getCashierName(sale)}</CTableDataCell>

                      {/* PROVIDERS */}

                      <CTableDataCell>
                        {saleProviders.length > 0 ? (
                          <div className="d-flex flex-column gap-1">
                            {saleProviders.map((provider) => (
                              <CBadge key={provider} color="info">
                                {provider}
                              </CBadge>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </CTableDataCell>

                      {/* SERVICES */}

                      <CTableDataCell>
                        {services.length > 0 ? (
                          services.map((item, index) => {
                            const serviceName =
                              item?.Service?.name ||
                              item?.service?.name ||
                              item?.serviceName ||
                              item?.name ||
                              'Service'

                            const provider = getServiceItemProvider(sale, item)

                            const returnStatus = getServiceReturnStatus(sale, item)

                            return (
                              <div key={item.id || index} className="mb-3">
                                <div className="fw-semibold">{serviceName}</div>

                                <div className="small text-primary fw-semibold">
                                  Staff: {provider}
                                </div>

                                <small className="text-medium-emphasis">
                                  {returnStatus.returned
                                    ? returnStatus.partial
                                      ? `${returnStatus.returnedQuantity} returned / ${returnStatus.remainingQuantity} remaining`
                                      : `${returnStatus.returnedQuantity} returned`
                                    : `Qty: ${item.quantity || 1} • ${money(item.subtotal)}`}
                                </small>

                                {returnStatus.returned && !returnStatus.partial && (
                                  <div>
                                    <CBadge color="danger" className="mt-1">
                                      RETURNED
                                    </CBadge>
                                  </div>
                                )}

                                {returnStatus.partial && (
                                  <div>
                                    <CBadge color="warning" textColor="dark" className="mt-1">
                                      PARTIALLY RETURNED
                                    </CBadge>
                                  </div>
                                )}
                              </div>
                            )
                          })
                        ) : (
                          <span className="text-medium-emphasis">No service</span>
                        )}

                        {hasReturnedProduct && (
                          <CBadge color="secondary" className="mt-1">
                            Product return
                          </CBadge>
                        )}
                      </CTableDataCell>

                      {/* SERVICE TYPE */}

                      <CTableDataCell>
                        {services.length > 0 ? (
                          <CBadge color={isHomeService ? 'dark' : 'primary'}>
                            {isHomeService ? 'Home Service' : 'In-Salon'}
                          </CBadge>
                        ) : (
                          '-'
                        )}

                        {commissionRate > 0 && (
                          <div className="small text-medium-emphasis mt-1">{commissionRate}%</div>
                        )}
                      </CTableDataCell>

                      {/* REVENUE */}

                      <CTableDataCell>
                        <div className="fw-bold">{money(saleNetAmount)}</div>

                        {serviceTotal > 0 && (
                          <small className="text-info d-block">
                            Service: {money(serviceTotal)}
                          </small>
                        )}

                        {productTotal > 0 && (
                          <small className="text-secondary d-block">
                            Product: {money(productTotal)}
                          </small>
                        )}

                        {returnAmount > 0 && (
                          <small className="text-danger d-block">
                            Return: -{money(returnAmount)}
                          </small>
                        )}
                      </CTableDataCell>

                      {/* STAFF SHARE */}

                      <CTableDataCell>
                        {commissionIsPending && staffShare > 0 ? (
                          <>
                            <div className="fw-bold text-warning">{money(staffShare)}</div>

                            <small className="text-medium-emphasis">Pending</small>

                            {outstandingCommission > 0 && (
                              <small className="text-muted d-block">
                                Outstanding: {money(outstandingCommission)}
                              </small>
                            )}
                          </>
                        ) : commissionIsPartial ? (
                          <>
                            {staffShare > 0 && (
                              <div className="fw-bold text-warning">{money(staffShare)}</div>
                            )}

                            {paidCommission > 0 && (
                              <small className="text-success d-block">
                                Paid: {money(paidCommission)}
                              </small>
                            )}

                            {outstandingCommission > 0 && (
                              <small className="text-warning d-block">
                                Outstanding: {money(outstandingCommission)}
                              </small>
                            )}

                            <CBadge color="warning" textColor="dark" className="mt-1">
                              Partially Paid
                            </CBadge>
                          </>
                        ) : commissionIsPaid && paidCommission > 0 ? (
                          <>
                            <div className="text-medium-emphasis">{money(paidCommission)}</div>

                            <CBadge color="secondary" className="mt-1">
                              Paid
                            </CBadge>
                          </>
                        ) : currentCommission > 0 ? (
                          <>
                            <div className="text-medium-emphasis">{money(currentCommission)}</div>

                            <small className="text-muted d-block">Current commission</small>
                          </>
                        ) : (
                          '-'
                        )}

                        {returnedCommission > 0 && (
                          <small className="text-danger d-block mt-1">
                            Returned: -{money(returnedCommission)}
                          </small>
                        )}
                      </CTableDataCell>

                      {/* OWNER PROFIT */}

                      <CTableDataCell>
                        {serviceTotal > 0 ? (
                          <div className="fw-bold text-success">{money(ownerServiceProfit)}</div>
                        ) : (
                          '-'
                        )}
                      </CTableDataCell>

                      {/* CARD / STAND */}

                      <CTableDataCell>
                        {isHomeService ? (
                          <CBadge color="dark">Home Service</CBadge>
                        ) : (
                          <>
                            <div>
                              <strong>Card:</strong> {sale.CardNumber || '-'}
                            </div>

                            <small className="text-medium-emphasis">
                              Stand: {sale.StandTag || '-'}
                            </small>
                          </>
                        )}
                      </CTableDataCell>

                      {/* STATUS */}

                      <CTableDataCell>
                        <CBadge
                          color={
                            sale.approvalStatus === 'approved'
                              ? 'success'
                              : sale.approvalStatus === 'cancelled'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {sale.approvalStatus || 'pending'}
                        </CBadge>

                        {returnAmount > 0 && (
                          <div className="mt-1">
                            <CBadge color="danger">RETURN</CBadge>
                          </div>
                        )}
                      </CTableDataCell>

                      {/* DATE */}

                      <CTableDataCell>
                        {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '-'}
                      </CTableDataCell>

                      {/* ACTION */}

                      <CTableDataCell>
                        <CButton
                          color="warning"
                          size="sm"
                          disabled={sale.status === 'refunded'}
                          onClick={() => handleReturn(sale)}
                        >
                          {sale.status === 'refunded' ? 'Returned' : 'Return'}
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan="13" className="text-center py-5">
                    <CIcon icon={cilSearch} size="xl" className="text-medium-emphasis mb-3" />

                    <h5>No sales found</h5>

                    <p className="text-medium-emphasis mb-0">
                      Try changing your search, service provider or date filters.
                    </p>
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

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
