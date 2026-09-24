import React, { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilUserPlus,
  cilPeople,
  cilSave,
  cilCreditCard,
  cilBarcode,
  cilPrint,
  cilTrash,
  cilChart,
  cilNotes,
  cilUser,
  cilCart,
  cilSpeedometer,
  cilPencil,
} from '@coreui/icons'
import axios from 'axios'
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CButton,
  CNav,
  CForm,
  CTable,
  CCardBody,
  CFormInput,
  CFormSelect,
  CNavItem,
  CNavLink,
  CFormCheck,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CustomerSearchModal from '../pos/CustomerSearchModal'

import PaymentModal from '../pos/PaymentModal'

import ReceiptModal from '../pos/ReceiptModal'

import HoldSaleModal from '../pos/HoldSaleModal'
import NewCustomerModal from '../pos/NewCustomerModal'
import LoyaltyLookupModal from '../pos/LoyaltyLookUpModal'
import BarcodeModal from '../pos/BarcodeModal'
import ReceiptSearchModal from '../pos/RecieptSearchModal'
import ClearCartModal from '../pos/ClearCartModal'
import DailyReportModal from '../pos/DailyReport'
import { DocsComponents, DocsExample } from 'src/components'
import ShowHeldSalesModal from './ShowHeldSalesModal'
import { Link, NavLink } from 'react-router-dom'
import LogoutButton from '../auth/logout'
const POSPage = () => {
  const [activeTab, setActiveTab] = useState('services')

  // const [cart, setCart] = useState([])
  const dispatch = useDispatch()
  const [customerss, setCustomerss] = useState([])
  const [services, setService] = useState([])
  const API_URL = import.meta.env.VITE_BACKEND_URL
  const [discount, setDiscount] = useState(0)

  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [showCustomerModal, setShowCustomerModal] = useState(false)

  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showReceiptSearchModal, setShowReceiptSearchModal] = useState(false)
  const [receiptSearch, setReceiptSearch] = useState('')
  const [receiptResults, setReceiptResults] = useState([])
  const [receiptSearchLoading, setReceiptSearchLoading] = useState(false)
  const [settings, setFormData] = useState(null)
  const [showHoldModal, setShowHoldModal] = useState(false)
  const [sale, setSale] = useState(null)
  const [saleData, setSaleData] = useState(null)
  const [products, setProducts] = useState([])
  const [staff, setStaffs] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)

  const [editingItem, setEditingItem] = useState(null)

  const [editedPrice, setEditedPrice] = useState('')
  const [customers, setCustomers] = useState([])
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false)
  const [showBarcodeModal, setShowBarcodeModal] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState(0)
  const [showClearCartModal, setShowClearCartModal] = useState(false)
  const [processingSale, setProcessingSale] = useState(false)
  const clearPOS = () => {
    setCart([])

    setDiscount(0)

    setSelectedCustomer(null)

    setUsePoints(false)

    setUseWallet(false)

    localStorage.removeItem(CART_KEY)
  }
  const currentUser = JSON.parse(localStorage.getItem('user'))

  const CART_KEY = `pos_cart_${currentUser.id}`

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem(CART_KEY)

    return savedCart ? JSON.parse(savedCart) : []
  })
  // const currentUser = JSON.parse(localStorage.getItem('user'))
  const [showDailyReportModal, setShowDailyReportModal] = useState(false)
  const [report, setReport] = useState({})
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [cardNumber, setCardNumber] = useState('')

  const [cardResult, setCardResult] = useState(null)
  const [usePoints, setUsePoints] = useState(false)
  const [lastSale, setLastSale] = useState(null)

  const [useWallet, setUseWallet] = useState(false)
  const addSoundRef = useRef(new Audio('/sounds/beep.wav'))

  // const pointsDiscount = usePoints ? Math.min(selectedCustomer?.loyaltyPoints || 0, subtotal) : 0
  const [showHeldSalesModal, setShowHeldSalesModal] = useState(false)
  const [heldSales, setHeldSales] = useState([])

  const openPriceModal = (item) => {
    setEditingItem(item)

    setEditedPrice(item.price)

    setShowPriceModal(true)
  }

  const saveEditedPrice = () => {
    if (!editingItem) return

    setCart(
      cart.map((cartItem) =>
        cartItem.id === editingItem.id && cartItem.type === 'service'
          ? {
              ...cartItem,
              price: Number(editedPrice),
            }
          : cartItem,
      ),
    )

    setShowPriceModal(false)

    setEditingItem(null)

    setEditedPrice('')
  }
  // Calculate total pages

  const walletUsed = useWallet
    ? Math.min(selectedCustomer?.walletBalance || 0, subtotal - pointsDiscount)
    : 0
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart))
  }, [cart])
  useEffect(() => {
    localStorage.setItem('pos_customer', JSON.stringify(customerss))
  }, [customerss])
  useEffect(() => {
    dispatch({
      type: 'set',
      sidebarShow: false,
    })
  }, [])

  useEffect(() => {
    document.body.classList.add('sidebar-hidden')

    return () => {
      document.body.classList.remove('sidebar-hidden')
    }
  }, [])

  // useEffect(() => {
  //   dispatch({
  //     type: 'set',
  //     sidebarUnfoldable: false,
  //   })

  //   return () => {
  //     dispatch({
  //       type: 'set',
  //       sidebarUnfoldable: true,
  //     })
  //   }
  // }, [])
  const soundPlayingRef = useRef(false)

  const playAddSound = () => {
    if (soundPlayingRef.current) return

    soundPlayingRef.current = true

    addSoundRef.current.currentTime = 0

    addSoundRef.current.play().catch(() => {})

    setTimeout(() => {
      soundPlayingRef.current = false
    }, 100)
  }

  const getStaff = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(
        `${API_URL}api/v1/staffs`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setStaffs(response.data.staffs)
    } catch (error) {
      console.error(error)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getStaff()
    }

    fetchData()
  }, [])
  // product section

  const getProducts = async () => {
    const token = localStorage.getItem('token') // Retrieve token

    if (!token) {
      console.error('No token found in localStorage')
      return // Exit if token is missing
    }

    try {
      console.log('Fetching products with token:', token)

      const response = await axios.get(`${API_URL}api/v1/products`, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to headers
        },
      })

      if (response.data && response.data.products) {
        setProducts(response.data.products) // Update state with products
        console.log('Products fetched successfully:', response.data.products)
      } else {
        console.warn('No products found in response:', response.data)
      }
    } catch (error) {
      // Log detailed error information
      if (error.response) {
        console.error('API Error:', error.response.status, error.response.data)
      } else if (error.request) {
        console.error('No response received:', error.request)
      } else {
        console.error('Error setting up request:', error.message)
      }
    }
  }

  // Fetch products on component mount
  useEffect(() => {
    const fetchData = async () => {
      await getProducts()
    }
    fetchData()
  }, [])

  // product ends

  // Daily Sales
  const getDailyReport = async () => {
    try {
      setReportLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/my-daily-report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setReport(response.data)

      setShowDailyReportModal(true)
    } catch (error) {
      console.error(error)
    } finally {
      setReportLoading(false)
    }
  }

  const getSettings = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/settings/1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setFormData(response.data.settings)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getSettings()
    }
    fetchData()
  }, [])
  // Daily Sales end

  // Loyaltycard lookup

  const searchLoyaltyCard = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(
        `${API_URL}api/v1/loyalty-cards/${cardNumber}`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setCardResult(response.data.loyaltyCard)
    } catch (error) {
      console.error(error)

      alert(error.response?.data?.message || 'Card not found')
    }
  }

  const getService = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No token found in localStorage')
      return // Exit if token is missing
    }
    try {
      const response = await axios.get(
        `${API_URL}api/v1/servicess`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setService(response.data.services)
    } catch (error) {
      console.error(error)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getService()
    }
    fetchData()
  }, [])

  // customers

  const getCustomer = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(
        `${API_URL}api/v1/customers`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setCustomerss(response.data.customers)
    } catch (error) {
      console.error(error)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getCustomer()
    }
    fetchData()
  }, [])

  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)

  const handleHoldSale = async ({ customerId, note }) => {
    try {
      const token = localStorage.getItem('token')

      await axios.post(
        `${API_URL}api/v1/held-sales`,
        {
          customerId,
          items: cart,
          subtotal,
          discount,
          totalAmount: total,
          note,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      alert('Sale Held Successfully')

      clearPOS()

      setShowHoldModal(false)
    } catch (error) {
      console.error(error)

      alert('Failed to hold sale')
    }
  }

  const fetchHeldSales = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/held-sales`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setHeldSales(response.data.heldSales || [])
    } catch (error) {
      console.error(error)
    }
  }
  const openHeldSalesModal = async () => {
    await fetchHeldSales()

    setShowHeldSalesModal(true)
  }
  const restoreHeldSale = async (sale) => {
    try {
      const token = localStorage.getItem('token')

      await axios.put(
        `${API_URL}api/v1/held-sales/restore/${sale.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      console.log('RESTORING SALE:', sale)

      // Force array
      const restoredItems = Array.isArray(sale.items) ? sale.items : JSON.parse(sale.items || '[]')

      console.log('RESTORED ITEMS:', restoredItems)

      setCart([...restoredItems])

      setSelectedCustomer(sale.Customer || null)

      setDiscount(Number(sale.discount || 0))

      setShowHeldSalesModal(false)

      localStorage.setItem(CART_KEY, JSON.stringify(restoredItems))

      alert('Sale Restored Successfully')
    } catch (error) {
      console.error(error)

      alert(error.response?.data?.message || 'Failed to restore sale')
    }
  }
  // Payment handling
  const handleCompleteSale = async (paymentData) => {
    try {
      if (cart.length === 0) {
        return alert('Cart is empty')
      }

      setProcessingSale(true)

      const token = localStorage.getItem('token')

      const payload = {
        customerId: selectedCustomer?.id || null,

        staffId: paymentData.serviceProviderId,

        items: cart,

        discount,

        standTag: paymentData.standTag,

        cardNumber: paymentData.cardNumber,

        serviceProviderId: paymentData.serviceProviderId,

        paymentMethod: paymentData.paymentMethod,

        // ==========================================
        // SERVICE TYPE
        // ==========================================
        serviceType: paymentData.serviceType,

        note: paymentData.note,

        usePoints: redeemPoints > 0,

        redeemPoints,

        subtotal,

        totalAmount: total,
      }
      const response = await axios.post(
        `${API_URL}api/v1/sales`,

        payload,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const completedSale = response.data.sale

      /*
     Receipt
    */
      setLastSale(response.data.sale)

      setSale(completedSale)

      /*
     Close Payment Modal
    */

      setShowPaymentModal(false)

      /*
     Open Receipt
    */

      setShowReceiptModal(true)

      /*
     Reset POS
    */

      clearPOS()
    } catch (error) {
      console.error(error)

      alert(error.response?.data?.message || 'Failed to complete sale')
    } finally {
      setProcessingSale(false)
    }
  }
  // Payment Handling end
  // Product search
  const [search, setSearch] = useState('')

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(search.toLowerCase()),
  )

  const filteredProducts = Array.isArray(products)
    ? products.filter((product) => product?.name?.toLowerCase().includes(search.toLowerCase()))
    : []

  // ==========================================================
  // RECEIPT SEARCH / REPRINT
  // ==========================================================

  const searchReceipts = async () => {
    const query = receiptSearch.trim()

    if (!query) {
      setReceiptResults([])
      return
    }

    try {
      setReceiptSearchLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/sales/search`, {
        params: { search: query },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setReceiptResults(response.data.sales || [])
    } catch (error) {
      console.error('RECEIPT SEARCH ERROR:', error)

      alert(error.response?.data?.message || 'Unable to search for receipts')

      setReceiptResults([])
    } finally {
      setReceiptSearchLoading(false)
    }
  }

  const openReceiptForReprint = async (saleId) => {
    try {
      setReceiptSearchLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/sales/reprint/${saleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const selectedSale = response.data.sale || response.data

      setSale(selectedSale)
      setShowReceiptSearchModal(false)
      setReceiptSearch('')
      setReceiptResults([])
      setShowReceiptModal(true)
    } catch (error) {
      console.error('LOAD RECEIPT ERROR:', error)

      alert(error.response?.data?.message || 'Unable to load receipt')
    } finally {
      setReceiptSearchLoading(false)
    }
  }

  // hold sales

  const holdSale = async (note) => {
    try {
      await axios.post('/api/sales/hold', {
        customerId: customer?.id,

        note,

        items: cart,
      })

      setCart([])

      setShowHoldModal(false)
    } catch (error) {
      console.log(error)
    }
  }

  const addToCart = (item) => {
    playAddSound()

    const existing = cart.find((cartItem) => cartItem.id === item.id && cartItem.type === item.type)

    if (existing) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id && cartItem.type === item.type
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem,
        ),
      )

      return
    }

    setCart([
      ...cart,
      {
        ...item,
        quantity: 1,
      },
    ])
  }
  const increaseQty = (id) => {
    setCart(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    )
  }

  const decreaseQty = (id) => {
    setCart(
      cart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const removeItem = (id) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const subtotal = Array.isArray(cart)
    ? cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
    : 0

  const total = subtotal - discount
  const pointsDiscount = usePoints ? Math.min(selectedCustomer?.loyaltyPoints || 0, subtotal) : 0
  const loyaltyPoints = Math.floor(total / 1000)

  const completeSale = () => {
    const payload = {
      customerId: customer?.id,

      paymentMethod,

      discount,

      items: cart.map((item) => ({
        type: item.type,

        quantity: item.quantity,

        serviceId: item.type === 'service' ? item.id : null,

        productId: item.type === 'product' ? item.id : null,
      })),
    }

    console.log(payload)

    // axios.post('/api/pos', payload)

    alert('Sale completed successfully')

    setCart([])
  }
  const [currentPageServices, setCurrentPageServices] = useState(1)
  const [currentPageProducts, setCurrentPageProducts] = useState(1)
  const itemsPerPage = 8 // Number of items per page

  // Paginate Services
  const indexOfLastService = currentPageServices * itemsPerPage
  const indexOfFirstService = indexOfLastService - itemsPerPage
  const currentServices = filteredServices.slice(indexOfFirstService, indexOfLastService)
  const totalServicePages = Math.ceil(filteredServices.length / itemsPerPage)

  // Paginate Products
  const indexOfLastProduct = currentPageProducts * itemsPerPage
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const posButtonStyle = {
    height: '70px',
    borderRadius: '12px',
    fontWeight: '600',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
  }

  useEffect(() => {
    if (window.electronAPI?.updateCustomerDisplay) {
      window.electronAPI.updateCustomerDisplay({
        cart,
        subtotal,
        total,
        customer: selectedCustomer,
      })
    }
  }, [cart, subtotal, total, selectedCustomer])

  const serviceColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
    'linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%)',
    'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)',
    'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
    'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
  ]

  const getServiceColor = (id) => {
    return serviceColors[id % serviceColors.length]
  }

  const productColors = [
    'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  ]

  const getProductColor = (id) => {
    return productColors[id % productColors.length]
  }

  const actionCardStyle = {
    height: '68px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,.12)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    transition: 'all .2s ease',
    fontWeight: '600',
    boxShadow: '0 5px 18px rgba(0,0,0,.08)',
  }
  return (
    <div
      className="glamour-pos-shell"
      style={{
        minHeight: '100vh',
        height: '100vh',
        overflow: 'hidden',
        background: '#0d0f12',
        color: '#f4f5f6',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '12px',
      }}
    >
      {/* =========================================================
          TOP POS HEADER
      ========================================================== */}
      <div
        style={{
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 10px',
          background: '#101317',
          borderBottom: '1px solid #282d33',
        }}
      >
        <div
          style={{
            width: '188px',
            minWidth: '188px',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#e8bd35',
              color: '#111',
              fontWeight: 900,
              fontSize: '12px',
            }}
          >
            GP
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: '.6px',
                color: '#f4f5f6',
              }}
            >
              GLAMOUR POS
            </div>
            <div
              style={{
                marginTop: '4px',
                fontSize: '8px',
                color: '#8c939b',
                letterSpacing: '.8px',
                textTransform: 'uppercase',
              }}
            >
              GLAMOUR UNISEX SALON • REGISTER
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 10px',
            background: '#181c21',
            border: '1px solid #2b3037',
            borderRadius: '6px',
          }}
        >
          <CIcon icon={cilBarcode} style={{ color: '#e8bd35', flexShrink: 0 }} />
          <CFormInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog or scan barcode..."
            style={{
              border: 0,
              outline: 0,
              boxShadow: 'none',
              background: 'transparent',
              color: '#f5f6f7',
              padding: 0,
              fontSize: '11px',
              height: '24px',
            }}
          />
          <span
            style={{
              color: '#626a74',
              fontSize: '8px',
              border: '1px solid #343a42',
              padding: '3px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            CTRL + K
          </span>
        </div>

        <div
          style={{
            width: '112px',
            minWidth: '112px',
            padding: '4px 7px',
            background: '#15191e',
            border: '1px solid #292f35',
            borderRadius: '5px',
          }}
        >
          <div style={{ color: '#63d391', fontSize: '8px', fontWeight: 800 }}>● ONLINE SYNC</div>
          <div style={{ color: '#747c85', fontSize: '7px', marginTop: '2px' }}>LIVE</div>
        </div>

        <div
          style={{
            width: '74px',
            minWidth: '74px',
            textAlign: 'center',
            color: '#dfe2e5',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800 }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: '7px', color: '#777f88', marginTop: '2px' }}>WAT</div>
        </div>

        <div
          style={{
            width: '126px',
            minWidth: '126px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '7px',
          }}
        >
          <div style={{ textAlign: 'right', minWidth: 0 }}>
            <div
              style={{
                fontSize: '9px',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentUser?.fullname || currentUser?.name || 'Cashier'}
            </div>
            <div style={{ fontSize: '7px', color: '#737a83' }}>MASTER STYLIST / CASHIER</div>
          </div>

          <div
            style={{
              width: '27px',
              height: '27px',
              borderRadius: '50%',
              background: '#e8bd35',
              color: '#111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '10px',
            }}
          >
            {(currentUser?.fullname || currentUser?.name || 'C').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN POS AREA
      ========================================================== */}
      <div
        style={{
          height: 'calc(100vh - 52px)',
          display: 'grid',
          gridTemplateColumns: '54px 1fr 365px',
          minHeight: 0,
        }}
      >
        {/* =======================================================
            LEFT NAVIGATION RAIL
        ======================================================== */}
        <aside
          style={{
            background: '#0a0c0f',
            borderRight: '1px solid #24282e',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 5px',
            minHeight: 0,
          }}
        >
          {[
            { label: 'REG', icon: cilCart, active: true },
            { label: 'BOOK', icon: cilNotes },
            { label: 'CLIENT', icon: cilPeople, onClick: () => setShowCustomerModal(true) },
            { label: 'LEDGER', icon: cilChart, onClick: () => setShowDailyReportModal(true) },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              style={{
                width: '44px',
                height: '52px',
                marginBottom: '4px',
                border: 0,
                borderRadius: '5px',
                background: item.active ? '#e8bd35' : 'transparent',
                color: item.active ? '#111' : '#737b84',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: item.onClick ? 'pointer' : 'default',
              }}
            >
              <CIcon icon={item.icon} size="sm" />
              <span style={{ fontSize: '6px', fontWeight: 900, letterSpacing: '.5px' }}>
                {item.label}
              </span>
            </button>
          ))}

          <div style={{ flex: 1 }} />

          <button
            type="button"
            onClick={() => setShowBarcodeModal(true)}
            style={{
              width: '44px',
              height: '46px',
              border: 0,
              background: 'transparent',
              color: '#777f88',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <CIcon icon={cilBarcode} size="sm" />
            <span style={{ fontSize: '6px', fontWeight: 900 }}>SCAN</span>
          </button>

          <div style={{ width: '38px', margin: '3px 0 6px', borderTop: '1px solid #252a30' }} />

          <div style={{ transform: 'scale(.72)', transformOrigin: 'bottom center' }}>
            <LogoutButton />
          </div>
        </aside>

        {/* =======================================================
            CATALOG
        ======================================================== */}
        <main
          style={{
            minWidth: 0,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: '178px minmax(0, 1fr)',
            background: '#111418',
          }}
        >
          {/* CATALOG FILTER / CATEGORY PANEL */}
          <section
            style={{
              minWidth: 0,
              minHeight: 0,
              borderRight: '1px solid #282d33',
              background: '#15191e',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '9px 9px 7px',
                borderBottom: '1px solid #282d33',
              }}
            >
              <div
                style={{
                  color: '#e8bd35',
                  fontSize: '8px',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  marginBottom: '7px',
                }}
              >
                CATALOG FILTER
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                {[
                  { text: 'Scan Code', icon: cilBarcode, onClick: () => setShowBarcodeModal(true) },
                  { text: 'New Client', icon: cilUserPlus, onClick: () => setShowNewCustomerModal(true) },
                  { text: 'Loyalty', icon: cilCreditCard, onClick: () => setShowLoyaltyModal(true) },
                  { text: 'Reprint', icon: cilPrint, onClick: () => setShowReceiptSearchModal(true) },
                ].map((action) => (
                  <button
                    key={action.text}
                    type="button"
                    onClick={action.onClick}
                    style={{
                      height: '37px',
                      border: '1px solid #2c3239',
                      borderRadius: '4px',
                      background: '#1b2026',
                      color: '#aeb4bb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '7px',
                      cursor: 'pointer',
                    }}
                  >
                    <CIcon icon={action.icon} size="sm" style={{ color: '#d5ad32' }} />
                    {action.text}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '9px 9px 4px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px',
                  background: '#0e1114',
                  border: '1px solid #2b3037',
                  borderRadius: '5px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('services')}
                  style={{
                    flex: 1,
                    height: '23px',
                    border: 0,
                    borderRadius: '3px',
                    background: activeTab === 'services' ? '#e8bd35' : 'transparent',
                    color: activeTab === 'services' ? '#111' : '#7e858e',
                    fontSize: '7px',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  SERVICES
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  style={{
                    flex: 1,
                    height: '23px',
                    border: 0,
                    borderRadius: '3px',
                    background: activeTab === 'products' ? '#e8bd35' : 'transparent',
                    color: activeTab === 'products' ? '#111' : '#7e858e',
                    fontSize: '7px',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  PRODUCTS
                </button>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '6px 9px',
              }}
            >
              <div
                style={{
                  color: '#e8bd35',
                  fontSize: '7px',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  padding: '5px 3px 8px',
                }}
              >
                CATEGORIES
              </div>

              {[
                ['All Inventory', activeTab === 'services' ? filteredServices.length : filteredProducts.length],
                ['Hair Styling & Cuts', ''],
                ['Treatments & Spa', ''],
                ['Beard & Grooming', ''],
                ['Coloring & Balayage', ''],
                ['Retail Haircare & Shampoos', ''],
                ['Luxury Bundles & Packages', ''],
              ].map(([label, count], index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (index === 0) setSearch('')
                  }}
                  style={{
                    width: '100%',
                    minHeight: '29px',
                    padding: '5px 6px',
                    marginBottom: '2px',
                    border: 0,
                    borderRadius: '3px',
                    background: index === 0 ? '#20252b' : 'transparent',
                    color: index === 0 ? '#f0f1f2' : '#7d858e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    fontSize: '8px',
                    cursor: index === 0 ? 'pointer' : 'default',
                  }}
                >
                  <span>{label}</span>
                  {count !== '' && (
                    <span
                      style={{
                        minWidth: '19px',
                        padding: '2px 4px',
                        textAlign: 'center',
                        borderRadius: '8px',
                        background: '#2b3036',
                        color: '#c3c7cb',
                        fontSize: '6px',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* HARDWARE STATUS */}
            <div
              style={{
                margin: '7px 8px 8px',
                padding: '8px',
                background: '#0e1114',
                border: '1px solid #292f35',
                borderRadius: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '7px',
                  fontWeight: 900,
                  color: '#747c84',
                  letterSpacing: '.8px',
                  marginBottom: '6px',
                }}
              >
                HARDWARE
              </div>

              {[
                ['Thermal Printer', true],
                ['Verifone P400 POS', true],
                ['RJ12 Cash Drawer', true],
              ].map(([name, connected]) => (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '3px 0',
                    fontSize: '7px',
                    color: '#8d949c',
                  }}
                >
                  <span>{name}</span>
                  <span style={{ color: connected ? '#63d391' : '#dc6b6b', fontWeight: 800 }}>
                    {connected ? '● Ready' : '● Offline'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* PRODUCT GRID */}
          <section
            style={{
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '43px',
                minHeight: '43px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 9px',
                borderBottom: '1px solid #282d33',
                background: '#12161a',
              }}
            >
              {['Favorites', 'Hair', 'Beard', 'Spa', 'Retail', 'Packages'].map((item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => index === 0 && setSearch('')}
                  style={{
                    height: '27px',
                    padding: '0 10px',
                    borderRadius: '4px',
                    border: '1px solid #2d333a',
                    background: index === 0 ? '#252b31' : '#181d22',
                    color: index === 0 ? '#e8bd35' : '#7d858d',
                    fontSize: '7px',
                    fontWeight: 800,
                    cursor: index === 0 ? 'pointer' : 'default',
                  }}
                >
                  {item}
                </button>
              ))}

              <div style={{ flex: 1 }} />

              <button
                type="button"
                onClick={() => setShowClearCartModal(true)}
                style={{
                  height: '27px',
                  padding: '0 9px',
                  border: '1px solid #3a2b2b',
                  borderRadius: '4px',
                  background: '#21191a',
                  color: '#d97878',
                  fontSize: '7px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                CLEAR
              </button>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '8px',
              }}
            >
              {activeTab === 'services' ? (
                loading ? (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#727a83',
                    }}
                  >
                    Loading services...
                  </div>
                ) : filteredServices.length > 0 ? (
                  <>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: '6px',
                      }}
                    >
                      {currentServices.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() =>
                            addToCart({
                              ...service,
                              price: service.price,
                              type: 'service',
                            })
                          }
                          style={{
                            minHeight: '104px',
                            padding: '8px',
                            textAlign: 'left',
                            border: '1px solid #2b3137',
                            borderRadius: '5px',
                            background: '#171b20',
                            color: '#e7e9eb',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '7px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '6px',
                                fontWeight: 900,
                                color: '#e8bd35',
                                letterSpacing: '.7px',
                              }}
                            >
                              SERVICE
                            </span>

                            <span
                              style={{
                                fontSize: '6px',
                                color: '#6e767f',
                                padding: '2px 4px',
                                border: '1px solid #30363d',
                                borderRadius: '3px',
                              }}
                            >
                              {service.serviceType === 'home_service' ? 'HOME' : 'IN-SALON'}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              lineHeight: 1.25,
                              minHeight: '28px',
                              color: '#e9ebed',
                            }}
                          >
                            {service.name}
                          </div>

                          <div
                            style={{
                              fontSize: '7px',
                              color: '#717982',
                              marginTop: '3px',
                              minHeight: '12px',
                            }}
                          >
                            {service.duration ? `${service.duration} min` : 'Salon service'}
                          </div>

                          <div
                            style={{
                              marginTop: '8px',
                              paddingTop: '6px',
                              borderTop: '1px solid #292f35',
                              color: '#e8bd35',
                              fontWeight: 900,
                              fontSize: '10px',
                            }}
                          >
                            ₦{Number(service.price).toLocaleString()}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: '9px',
                        color: '#6f7780',
                        fontSize: '7px',
                      }}
                    >
                      <button
                        type="button"
                        disabled={currentPageServices === 1}
                        onClick={() => setCurrentPageServices((prev) => prev - 1)}
                        style={{
                          border: '1px solid #2b3138',
                          background: '#181d22',
                          color: '#9aa1a9',
                          borderRadius: '4px',
                          padding: '5px 9px',
                        }}
                      >
                        Previous
                      </button>
                      <span>
                        Page {currentPageServices} / {Math.max(totalServicePages, 1)}
                      </span>
                      <button
                        type="button"
                        disabled={currentPageServices === totalServicePages || totalServicePages === 0}
                        onClick={() => setCurrentPageServices((prev) => prev + 1)}
                        style={{
                          border: '1px solid #2b3138',
                          background: '#181d22',
                          color: '#9aa1a9',
                          borderRadius: '4px',
                          padding: '5px 9px',
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6f7780',
                    }}
                  >
                    <CIcon icon={cilCart} size="xl" style={{ color: '#424850', marginBottom: '8px' }} />
                    <div style={{ fontWeight: 800 }}>No services found</div>
                    <div style={{ fontSize: '8px', marginTop: '4px' }}>Try another search.</div>
                  </div>
                )
              ) : loadingProducts ? (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#727a83',
                  }}
                >
                  Loading products...
                </div>
              ) : filteredProducts.length > 0 ? (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: '6px',
                    }}
                  >
                    {currentProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        disabled={Number(product.quantity || 0) <= 0}
                        onClick={() =>
                          addToCart({
                            ...product,
                            price: product.sellingPrice,
                            type: 'product',
                          })
                        }
                        style={{
                          minHeight: '104px',
                          padding: '8px',
                          textAlign: 'left',
                          border: '1px solid #2b3137',
                          borderRadius: '5px',
                          background: Number(product.quantity || 0) <= 0 ? '#14171a' : '#171b20',
                          color: '#e7e9eb',
                          cursor: Number(product.quantity || 0) <= 0 ? 'not-allowed' : 'pointer',
                          opacity: Number(product.quantity || 0) <= 0 ? 0.55 : 1,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '7px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '6px',
                              fontWeight: 900,
                              color: '#8e969f',
                              letterSpacing: '.7px',
                            }}
                          >
                            RETAIL PRODUCT
                          </span>

                          <span
                            style={{
                              color:
                                Number(product.quantity || 0) > 10
                                  ? '#63d391'
                                  : Number(product.quantity || 0) > 0
                                    ? '#e8bd35'
                                    : '#df6e6e',
                              fontSize: '6px',
                              fontWeight: 900,
                            }}
                          >
                            {Number(product.quantity || 0) > 0
                              ? `${product.quantity} IN STOCK`
                              : 'OUT OF STOCK'}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            lineHeight: 1.25,
                            minHeight: '28px',
                          }}
                        >
                          {product.name}
                        </div>

                        <div
                          style={{
                            fontSize: '7px',
                            color: '#717982',
                            marginTop: '3px',
                            minHeight: '12px',
                          }}
                        >
                          {product.sku || product.barcode || 'Retail item'}
                        </div>

                        <div
                          style={{
                            marginTop: '8px',
                            paddingTop: '6px',
                            borderTop: '1px solid #292f35',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ color: '#e8bd35', fontWeight: 900, fontSize: '10px' }}>
                            ₦{Number(product.sellingPrice).toLocaleString()}
                          </span>
                          <CIcon icon={cilPlus} size="sm" style={{ color: '#7c848d' }} />
                        </div>
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '10px',
                      marginTop: '9px',
                      color: '#6f7780',
                      fontSize: '7px',
                    }}
                  >
                    <button
                      type="button"
                      disabled={currentPageProducts === 1}
                      onClick={() => setCurrentPageProducts((prev) => prev - 1)}
                      style={{
                        border: '1px solid #2b3138',
                        background: '#181d22',
                        color: '#9aa1a9',
                        borderRadius: '4px',
                        padding: '5px 9px',
                      }}
                    >
                      Previous
                    </button>
                    <span>
                      Page {currentPageProducts} / {Math.max(totalProductPages, 1)}
                    </span>
                    <button
                      type="button"
                      disabled={currentPageProducts === totalProductPages || totalProductPages === 0}
                      onClick={() => setCurrentPageProducts((prev) => prev + 1)}
                      style={{
                        border: '1px solid #2b3138',
                        background: '#181d22',
                        color: '#9aa1a9',
                        borderRadius: '4px',
                        padding: '5px 9px',
                      }}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6f7780',
                  }}
                >
                  <CIcon icon={cilCart} size="xl" style={{ color: '#424850', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 800 }}>No products found</div>
                  <div style={{ fontSize: '8px', marginTop: '4px' }}>Try another search.</div>
                </div>
              )}
            </div>

            {/* OPERATOR STATUS BAR */}
            <div
              style={{
                height: '34px',
                minHeight: '34px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '0 9px',
                background: '#0d1013',
                borderTop: '1px solid #282d33',
                color: '#666e77',
                fontSize: '7px',
              }}
            >
              <span>
                OPERATOR STATE: <b style={{ color: '#63d391' }}>ACTIVE</b>
              </span>
              <span>
                CRM: <b style={{ color: '#63d391' }}>ONLINE</b>
              </span>
              <button
                type="button"
                onClick={() => setShowHoldModal(true)}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#aeb4bb',
                  fontSize: '7px',
                  cursor: 'pointer',
                }}
              >
                Hold Sale [F4]
              </button>
              <button
                type="button"
                onClick={getDailyReport}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#aeb4bb',
                  fontSize: '7px',
                  cursor: 'pointer',
                }}
              >
                Daily Report
              </button>
              <button
                type="button"
                onClick={openHeldSalesModal}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#aeb4bb',
                  fontSize: '7px',
                  cursor: 'pointer',
                }}
              >
                Held Sales
              </button>
            </div>
          </section>
        </main>

        {/* =======================================================
            CURRENT SALE / CART
        ======================================================== */}
        <aside
          style={{
            minWidth: 0,
            minHeight: 0,
            background: '#15191e',
            borderLeft: '1px solid #2a2f35',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* SALE HEADER */}
          <div
            style={{
              padding: '9px 10px',
              borderBottom: '1px solid #2b3036',
              background: '#171b20',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 900 }}>
                  SALE #GLM-{String(Date.now()).slice(-4)}
                </div>
                <div style={{ fontSize: '7px', color: '#737b84', marginTop: '3px' }}>
                  TERMINAL • CASHIER
                </div>
              </div>

              <div
                style={{
                  padding: '4px 7px',
                  border: '1px solid #363c43',
                  borderRadius: '4px',
                  color: '#d9dde0',
                  fontSize: '8px',
                  fontWeight: 800,
                }}
              >
                {cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} Items
              </div>
            </div>

            {/* CUSTOMER */}
            <div
              style={{
                marginTop: '8px',
                padding: '7px',
                background: '#101418',
                border: '1px solid #292f35',
                borderRadius: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div
                  style={{
                    width: '25px',
                    height: '25px',
                    borderRadius: '4px',
                    background: '#242a30',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#e8bd35',
                  }}
                >
                  <CIcon icon={cilUser} size="sm" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '8px',
                      color: '#747c84',
                      marginBottom: '2px',
                    }}
                  >
                    CUSTOMER
                  </div>
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {selectedCustomer?.fullname || 'Walk-in Customer'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  style={{
                    border: '1px solid #3a3424',
                    background: '#241f12',
                    color: '#e8bd35',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    fontSize: '7px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  CHANGE
                </button>
              </div>

              {selectedCustomer && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '6px',
                    paddingTop: '5px',
                    borderTop: '1px solid #252a30',
                    color: '#7d858e',
                    fontSize: '7px',
                  }}
                >
                  <span>{selectedCustomer.phone || 'No phone'}</span>
                  <span style={{ color: '#e8bd35' }}>
                    {selectedCustomer.loyaltyPoints || 0} pts
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CART ITEMS */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '7px',
            }}
          >
            {cart.length === 0 ? (
              <div
                style={{
                  height: '100%',
                  minHeight: '190px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#616a73',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#1c2127',
                    border: '1px solid #2c3239',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '9px',
                  }}
                >
                  <CIcon icon={cilCart} size="lg" style={{ color: '#505860' }} />
                </div>
                <div style={{ fontSize: '9px', fontWeight: 800 }}>No items in sale</div>
                <div style={{ fontSize: '7px', marginTop: '4px' }}>
                  Select a service or product to begin.
                </div>
              </div>
            ) : (
              cart.map((item, index) => (
                <div
                  key={`${item.type}-${item.id}`}
                  style={{
                    padding: '8px',
                    marginBottom: '5px',
                    background: '#101418',
                    border: '1px solid #292f35',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '7px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        minWidth: '24px',
                        borderRadius: '4px',
                        background: item.type === 'service' ? '#302a14' : '#1e2924',
                        color: item.type === 'service' ? '#e8bd35' : '#63d391',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: 900,
                      }}
                    >
                      {index + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          lineHeight: 1.3,
                          color: '#e6e8ea',
                        }}
                      >
                        {item.name}
                      </div>

                      <div
                        style={{
                          fontSize: '6px',
                          color: item.type === 'service' ? '#e8bd35' : '#63d391',
                          textTransform: 'uppercase',
                          fontWeight: 900,
                          marginTop: '2px',
                        }}
                      >
                        {item.type}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#e8bd35', fontSize: '9px', fontWeight: 900 }}>
                        ₦{Number(item.price * item.quantity).toLocaleString()}
                      </div>
                      <div style={{ color: '#666e77', fontSize: '6px', marginTop: '2px' }}>
                        ₦{Number(item.price).toLocaleString()} each
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '7px',
                      paddingTop: '6px',
                      borderTop: '1px solid #242a30',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: '1px solid #30363d',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => decreaseQty(item.id)}
                        style={{
                          width: '24px',
                          height: '22px',
                          border: 0,
                          background: '#1b2025',
                          color: '#c0c5ca',
                          cursor: 'pointer',
                        }}
                      >
                        −
                      </button>

                      <span
                        style={{
                          minWidth: '27px',
                          textAlign: 'center',
                          color: '#e8eaec',
                          fontWeight: 800,
                          fontSize: '8px',
                        }}
                      >
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => increaseQty(item.id)}
                        style={{
                          width: '24px',
                          height: '22px',
                          border: 0,
                          background: '#1b2025',
                          color: '#e8bd35',
                          cursor: 'pointer',
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '3px' }}>
                      {item.type === 'service' && (
                        <button
                          type="button"
                          onClick={() => openPriceModal(item)}
                          style={{
                            width: '24px',
                            height: '22px',
                            border: '1px solid #30363d',
                            borderRadius: '4px',
                            background: '#181d22',
                            color: '#8d959d',
                            cursor: 'pointer',
                          }}
                        >
                          <CIcon icon={cilPencil} size="sm" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        style={{
                          width: '24px',
                          height: '22px',
                          border: '1px solid #40282a',
                          borderRadius: '4px',
                          background: '#211719',
                          color: '#d87070',
                          cursor: 'pointer',
                        }}
                      >
                        <CIcon icon={cilTrash} size="sm" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* SALE FOOTER */}
          <div
            style={{
              padding: '8px',
              borderTop: '1px solid #2b3036',
              background: '#101418',
            }}
          >
            {/* Loyalty / Wallet compact controls */}
            {selectedCustomer && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '5px',
                  marginBottom: '6px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowLoyaltyModal(true)}
                  style={{
                    border: '1px solid #2c3239',
                    background: '#171c21',
                    color: '#969ea6',
                    borderRadius: '4px',
                    padding: '6px',
                    fontSize: '7px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ display: 'block', color: '#e8bd35', fontWeight: 900 }}>
                    {selectedCustomer.loyaltyPoints || 0}
                  </span>
                  POINTS / LOYALTY
                </button>

                <button
                  type="button"
                  onClick={() => setUseWallet((prev) => !prev)}
                  style={{
                    border: useWallet ? '1px solid #e8bd35' : '1px solid #2c3239',
                    background: useWallet ? '#292411' : '#171c21',
                    color: useWallet ? '#e8bd35' : '#969ea6',
                    borderRadius: '4px',
                    padding: '6px',
                    fontSize: '7px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ display: 'block', color: useWallet ? '#e8bd35' : '#c5c9cd', fontWeight: 900 }}>
                    ₦{Number(selectedCustomer.walletBalance || 0).toLocaleString()}
                  </span>
                  {useWallet ? 'WALLET ENABLED' : 'WALLET BALANCE'}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#777f88', fontSize: '8px', marginBottom: '4px' }}>
              <span>Subtotal</span>
              <span>₦{Number(subtotal).toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#777f88', fontSize: '8px' }}>Discount</span>
              <CFormInput
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                style={{
                  width: '78px',
                  height: '24px',
                  padding: '2px 5px',
                  background: '#171c21',
                  border: '1px solid #2d333a',
                  color: '#dce0e3',
                  fontSize: '8px',
                  textAlign: 'right',
                }}
              />
            </div>

            {usePoints && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e8bd35', fontSize: '8px', marginBottom: '3px' }}>
                <span>Points Discount</span>
                <span>- ₦{Number(pointsDiscount || 0).toLocaleString()}</span>
              </div>
            )}

            {useWallet && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e8bd35', fontSize: '8px', marginBottom: '3px' }}>
                <span>Wallet Used</span>
                <span>- ₦{Number(walletUsed || 0).toLocaleString()}</span>
              </div>
            )}

            <div
              style={{
                borderTop: '1px solid #2c3239',
                marginTop: '6px',
                paddingTop: '7px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              }}
            >
              <div>
                <div style={{ color: '#777f88', fontSize: '7px', textTransform: 'uppercase', letterSpacing: '.8px' }}>
                  Total Due
                </div>
                <div style={{ color: '#e8bd35', fontSize: '21px', lineHeight: 1.1, fontWeight: 900 }}>
                  ₦{Number(total).toLocaleString()}
                </div>
              </div>

              <div style={{ textAlign: 'right', color: '#6e767e', fontSize: '7px' }}>
                <div>LOYALTY EARNED</div>
                <div style={{ color: '#c2c7cc', fontWeight: 900 }}>{Math.floor(total / 1000)} pts</div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '96px 1fr',
                gap: '5px',
                marginTop: '7px',
              }}
            >
              <CFormSelect
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  height: '40px',
                  background: '#171c21',
                  color: '#dce0e3',
                  border: '1px solid #30363d',
                  fontSize: '8px',
                }}
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="pos">POS</option>
                <option value="mixed">Mixed</option>
              </CFormSelect>

              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                disabled={processingSale || cart.length === 0}
                style={{
                  height: '40px',
                  border: 0,
                  borderRadius: '4px',
                  background: cart.length === 0 ? '#4a4637' : '#e8bd35',
                  color: '#111',
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '.2px',
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: cart.length === 0 ? 'none' : '0 4px 12px rgba(232,189,53,.15)',
                }}
              >
                {processingSale ? 'PROCESSING...' : 'PROCEED TO PAYMENT  →'}
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '6px',
              }}
            >
              <button
                type="button"
                onClick={() => setShowHoldModal(true)}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#737b84',
                  fontSize: '7px',
                  cursor: 'pointer',
                }}
              >
                Hold [F6]
              </button>

              <button
                type="button"
                onClick={() => setShowNewCustomerModal(true)}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#737b84',
                  fontSize: '7px',
                  cursor: 'pointer',
                }}
              >
                + Add Note / Customer
              </button>

              <button
                type="button"
                onClick={() => setShowClearCartModal(true)}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#d16d6d',
                  fontSize: '7px',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </aside>
      </div>

      <CustomerSearchModal
        show={showCustomerModal}
        onHide={() => setShowCustomerModal(false)}
        customers={customerss}
        onSelect={(customer) => {
          console.log('Selected Customer:', customer)

          setSelectedCustomer(customer)
        }}
      />

      <PaymentModal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        total={total}
        onSubmit={handleCompleteSale}
        processing={processingSale}
        staff={staff}
        currentUser={currentUser}
      />

      <CModal
        visible={showReceiptSearchModal}
        onClose={() => {
          setShowReceiptSearchModal(false)
          setReceiptSearch('')
          setReceiptResults([])
        }}
        size="lg"
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle className="fw-bold">
            <CIcon icon={cilPrint} className="me-2" />
            Reprint Receipt
          </CModalTitle>
        </CModalHeader>

        <CModalBody className="p-4">
          <div
            className="p-4 mb-4"
            style={{
              background: '#f8fafc',
              borderRadius: '16px',
              border: '1px solid #e9ecef',
            }}
          >
            <h6 className="fw-bold mb-1">Find a previous sale</h6>

            <small className="text-medium-emphasis d-block mb-3">
              Search by receipt number, customer name or sale ID.
            </small>

            <div className="d-flex gap-2">
              <CFormInput
                size="lg"
                value={receiptSearch}
                placeholder="e.g. REC-000125 or John Doe"
                onChange={(e) => setReceiptSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') searchReceipts()
                }}
              />

              <CButton
                color="primary"
                size="lg"
                onClick={searchReceipts}
                disabled={receiptSearchLoading || !receiptSearch.trim()}
              >
                <CIcon icon={cilChart} className="me-2" />
                Search
              </CButton>
            </div>
          </div>

          {receiptSearchLoading && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status" />
              <div className="mt-2 text-medium-emphasis">Searching sales...</div>
            </div>
          )}

          {!receiptSearchLoading && receiptSearch && receiptResults.length === 0 && (
            <div className="text-center py-5">
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 15px',
                  fontSize: '28px',
                }}
              >
                🔍
              </div>

              <h6 className="fw-bold">No sales found</h6>

              <small className="text-medium-emphasis">
                Try another receipt number or customer name.
              </small>
            </div>
          )}

          {receiptResults.length > 0 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Search Results</h6>

                <span className="badge bg-primary">
                  {receiptResults.length} sale
                  {receiptResults.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {receiptResults.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 mb-2"
                    style={{
                      border: '1px solid #e9ecef',
                      borderRadius: '14px',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{item.receiptNumber || `SALE-${item.id}`}</div>

                        <div className="small text-medium-emphasis">
                          {item.customer?.fullname || item.Customer?.fullname || 'Walk-in Customer'}
                        </div>

                        <div className="small text-medium-emphasis">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                        </div>
                      </div>

                      <div className="text-end">
                        <div className="fw-bold text-success mb-2">
                          ₦{Number(item.totalAmount || 0).toLocaleString()}
                        </div>

                        <CButton
                          color="dark"
                          size="sm"
                          onClick={() => openReceiptForReprint(item.id)}
                          disabled={receiptSearchLoading}
                        >
                          <CIcon icon={cilPrint} className="me-1" />
                          Reprint
                        </CButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CModalBody>
      </CModal>

      <ReceiptModal
        show={showReceiptModal}
        settings={settings}
        onHide={() => setShowReceiptModal(false)}
        sale={sale}
      />

      <HoldSaleModal
        show={showHoldModal}
        onHide={() => setShowHoldModal(false)}
        customers={customerss}
        total={total}
        cartCount={cart.length}
        onSave={handleHoldSale}
      />
      <NewCustomerModal
        show={showNewCustomerModal}
        onHide={() => setShowNewCustomerModal(false)}
        onSuccess={(customer) => {
          setCustomers(customer)

          setCustomers((prev) => [customer, ...prev])
        }}
      />
      <ShowHeldSalesModal
        show={showHeldSalesModal}
        onHide={() => setShowHeldSalesModal(false)}
        heldSales={heldSales}
        onRestore={restoreHeldSale}
      />
      <LoyaltyLookupModal
        visible={showLoyaltyModal}
        onClose={() => setShowLoyaltyModal(false)}
        cardNumber={cardNumber}
        setCardNumber={setCardNumber}
        onSearch={searchLoyaltyCard}
        cardResult={cardResult}
      />
      <BarcodeModal visible={showBarcodeModal} onClose={() => setShowBarcodeModal(false)} />
      <ClearCartModal visible={showClearCartModal} onClose={() => setShowClearCartModal(false)} />
      <DailyReportModal
        visible={showDailyReportModal}
        onClose={() => setShowDailyReportModal(false)}
        report={report}
        loading={reportLoading}
      />

      <CModal visible={showPriceModal} onClose={() => setShowPriceModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>Change Service Price</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {editingItem && (
            <>
              <h5 className="fw-bold mb-3">{editingItem.name}</h5>

              <div className="mb-3">
                <small className="text-muted">Original Price</small>

                <h4 className="text-primary">
                  ₦{Number(editingItem.originalPrice || editingItem.price).toLocaleString()}
                </h4>
              </div>

              <CFormInput
                label="New Price"
                type="number"
                value={editedPrice}
                onChange={(e) => setEditedPrice(e.target.value)}
              />
            </>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowPriceModal(false)}>
            Cancel
          </CButton>

          <CButton color="primary" onClick={saveEditedPrice}>
            Update Price
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default POSPage
