import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import { Add, Remove, Delete, QrCodeScanner } from '@mui/icons-material';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { productType } from '../../types/product';
import { Bill } from '../../types/bills';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createBill } from 'store/reducers/bills-reducer';
import { AppDispatch, RootState } from '../../store/index-store';
import { Result } from '@zxing/library';
import { fetchproduct } from 'store/reducers/product-reducer';
import { useUserCategories } from 'hooks/useUserCategories';
import ProductSearchBar from 'components/search/ProductSearchBar';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import GenerateBillPrint from '../../utils/pdf-excel/GenerateBillPrint';

interface BillItemExtended extends productType {
  quantity: number;
  totalPrice: number;
}

const BillingPage = () => {
  const appSettings = useSelector((state: RootState) => state.appSettings.settings);
  const dispatch = useDispatch<AppDispatch>();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [billItems, setBillItems] = useState<BillItemExtended[]>([]);
  const [openScanner, setOpenScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [total, setTotal] = useState({ subtotal: 0, tax: 0, total: 0 });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const navigate = useNavigate();
  const productData = useSelector((state: { products: { productArray: productType[] } }) => state.products.productArray);
  const userCategories = useUserCategories();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [alert, setAlert] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    type: 'success'
  });
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [gstPercentage, setGstPercentage] = useState(appSettings?.billing.defaultGST || 18);

  const handleGSTChange = (newRate: number) => {
    setGstPercentage(newRate);
    // Recalculate totals with new GST rate
    calculateTotals(billItems);
  };

  useEffect(() => {
    if (productData.length === 0) {
      dispatch(fetchproduct());
    }
  }, [dispatch, productData.length]);

  useEffect(() => {
    // Set initial GST percentage from settings
    if (appSettings?.billing) {
      setGstPercentage(appSettings.billing.defaultGST || 18);
    }
  }, [appSettings]);

  useEffect(() => {
    // Calculate totals whenever billItems or gstPercentage changes
    calculateTotals(billItems);
  }, [gstPercentage, billItems]);

  const calculateTotals = (items: BillItemExtended[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * (gstPercentage / 100); // Use dynamic GST percentage
    console.log("tax", gstPercentage);
    setTotal({
      subtotal,
      tax,
      total: subtotal + tax
    });
  }


  const handleBarcodeSubmit = useCallback(
    async (code: string): Promise<void> => {
      if (!code) {
        setScanError('Invalid barcode');
        return;
      }
      try {
        // Check if the product is already in the bill
        const existingItem = billItems.find((item) => item.productCode === code);

        if (existingItem) {
          // Update quantity if product exists
          const updatedItems = billItems.map((item) => {
            if (item.productCode === code) {
              return {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.product_selling_price
              };
            }
            return item;
          });
          setBillItems(updatedItems);
          calculateTotals(updatedItems);
        } else {
          // Find product in productData
          const product = productData.find((p) => p.productCode === code);
          if (product) {
            // Check if we have enough stock
            if (product.quantity < 1) {
              setAlert({
                open: true,
                message: `${product.productName} is out of stock`,
                type: 'warning'
              });
              return;
            }

            const newItem: BillItemExtended = {
              ...product,
              quantity: 1,
              totalPrice: product.product_selling_price
            };
            const newItems = [...billItems, newItem];
            setBillItems(newItems);
            calculateTotals(newItems);
          } else {
            setScanError('Product not found');
          }
        }
        setBarcodeInput('');
      } catch (error) {
        console.error('Error fetching product:', error);
        setScanError(error instanceof Error ? error.message : 'Error fetching product');
      }
    },
    [billItems, productData]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleBarcodeSubmit(barcodeInput);
    }
  };

  const handleScannerUpdate = (err: unknown, result?: Result): void => {
    if (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setScanError('Camera permission was denied');
        } else if (err.name === 'NotFoundError') {
          setScanError('No camera found');
        } else {
          console.warn('Scan error:', err);
        }
      }
      return;
    }
    if (result) {
      handleBarcodeSubmit(result.getText());
      setOpenScanner(false);
    }
  };

  const updateItemQuantity = (code: string, change: number) => {
    const updatedItems = billItems.map((item) => {
      if (item.productCode === code) {
        // Get current product stock
        const product = productData.find((p) => p.productCode === code);

        if (change > 0 && product && item.quantity >= product.quantity) {
          // Can't add more than what's in stock
          setAlert({
            open: true,
            message: `Cannot add more. Only ${product.quantity} available in stock.`,
            type: 'warning'
          });
          return item;
        }

        const newQuantity = Math.max(1, item.quantity + change);
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: newQuantity * item.product_selling_price
        };
      }
      return item;
    });
    setBillItems(updatedItems);
    calculateTotals(updatedItems);
  };

  const removeItem = (code: string) => {
    const updatedItems = billItems.filter((item) => item.productCode !== code);
    setBillItems(updatedItems);
    calculateTotals(updatedItems);
  };

  // New function to update product stock in Firestore
  const updateProductStockInDb = async (stockUpdates: { productId: string; quantity: number }[]) => {
    try {
      // Create an array of promises for each stock update
      const updatePromises = stockUpdates.map(async (update) => {
        // Get the product data
        const product = productData.find((p) => p.productCode === update.productId);

        if (!product) {
          console.error(`Product with code ${update.productId} not found`);
          return Promise.reject(`Product with code ${update.productId} not found`);
        }

        // Calculate new quantity
        const newQuantity = Math.max(0, product.quantity - update.quantity);

        // Update in Firestore using doc_id
        const productRef = doc(db, 'products', product.product_id);
        return updateDoc(productRef, { quantity: newQuantity });
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Refresh product data
      dispatch(fetchproduct());

      return true;
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw error;
    }
  };

  // const generateBill = (): Bill => {
  //   return {
  //     billId: Math.random().toString(36).substr(2, 9).toUpperCase(),
  //     date: new Date().toISOString(),
  //     items: billItems.map(item => ({
  //       productCode: item.productCode,
  //       productName: item.productName,
  //       quantity: item.quantity,
  //       price: item.product_selling_price,
  //       totalPrice: item.totalPrice
  //     })),
  //     subtotal: total.subtotal,
  //     tax: total.tax,
  //     total: total.total,
  //     customerName: customerName || 'Walk-in Customer',
  //     customerPhone: customerPhone,
  //     paymentMethod: paymentMethod,
  //     gstPercentage: gstPercentage
  //   };
  // };

  const handleProcessPayment = async () => {
    try {
      const billItemsData = billItems.map((item) => ({
        productCode: item.productCode,
        productName: item.productName,
        quantity: item.quantity,
        price: item.product_selling_price,
        totalPrice: item.totalPrice
      }));

      // Check if any product doesn't have enough stock
      const insufficientStockItems = billItems.filter((item) => {
        const product = productData.find((p) => p.productCode === item.productCode);
        return product && product.quantity < item.quantity;
      });

      if (insufficientStockItems.length > 0) {
        const itemNames = insufficientStockItems.map((item) => item.productName).join(', ');
        setAlert({
          open: true,
          message: `Insufficient stock for: ${itemNames}`,
          type: 'error'
        });
        return;
      }

      const newBill: Bill = {
        billId: `BILL-${Date.now()}`,
        date: new Date().toISOString(),
        items: billItemsData,
        subtotal: total.subtotal,
        tax: total.tax,
        total: total.total,
        customerName,
        customerPhone,
        paymentMethod,
        gstPercentage
      };

      // Create bill first
      await dispatch(createBill(newBill)).unwrap();

      // Then update product stock in Firestore directly
      const stockUpdates = billItems.map((item) => ({
        productId: item.productCode,
        quantity: item.quantity
      }));
      await updateProductStockInDb(stockUpdates);

      // Set current bill and open print dialog
      setCurrentBill(newBill);
      setPrintDialogOpen(true);

      // Clear bill items and customer info
      setBillItems([]);
      setCustomerName('');
      setCustomerPhone('');

      setAlert({
        open: true,
        message: 'Bill created successfully and stock updated',
        type: 'success'
      });

      // Don't navigate away immediately, let the user print first
      setTimeout(() => {
        navigate('/my-bills');
      }, 3000);
    } catch (error) {
      console.error('Error saving bill:', error);
      setAlert({
        open: true,
        message: 'Error processing payment',
        type: 'error'
      });
    }
  };

  const handleProductSelect = (product: productType) => {
    const existingItem = billItems.find((item) => item.productCode === product.productCode);

    // Check if product is in stock
    if (product.quantity <= 0) {
      setAlert({
        open: true,
        message: `${product.productName} is out of stock`,
        type: 'warning'
      });
      return;
    }

    if (existingItem) {
      // Check if we have enough stock to add one more
      if (existingItem.quantity >= product.quantity) {
        setAlert({
          open: true,
          message: `Cannot add more ${product.productName}. Only ${product.quantity} available in stock.`,
          type: 'warning'
        });
        return;
      }

      // Update quantity if product exists
      const updatedItems = billItems.map((item) => {
        if (item.productCode === product.productCode) {
          return {
            ...item,
            quantity: item.quantity + 1,
            totalPrice: (item.quantity + 1) * item.product_selling_price
          };
        }
        return item;
      });
      setBillItems(updatedItems);
      calculateTotals(updatedItems);
    } else {
      // Add new item to bill
      const newItem: BillItemExtended = {
        ...product,
        quantity: 1,
        totalPrice: product.product_selling_price
      };
      const newItems = [...billItems, newItem];
      setBillItems(newItems);
      calculateTotals(newItems);
    }
  };

  const filteredProducts = productData.filter((product) => selectedCategory === '' || product.category.categoryName === selectedCategory);

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Barcode Scanner and Search Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{ flexGrow: 1 }}>
                <ProductSearchBar
                  products={productData}
                  onProductSelect={handleProductSelect}
                  placeholder="Search products by name..."
                  selectedCategory={selectedCategory}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Scan Barcode"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  sx={{ width: { xs: '100%', md: '200px' } }}
                />
                <Button variant="contained" startIcon={<QrCodeScanner />} onClick={() => setOpenScanner(true)}>
                  Scan
                </Button>
              </Box>
              <FormControl sx={{ width: { xs: '100%', md: '200px' } }}>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as string)}
                  displayEmpty
                  renderValue={(selected) => (selected === '' ? 'All Categories' : selected)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {userCategories.map((categoryName) => (
                    <MenuItem key={categoryName} value={categoryName}>
                      {categoryName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>
          </Grid>

          {/* Products Table */}
          <Grid item xs={12} md={8}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="center">Stock</TableCell>
                    <TableCell align="center">Quantity</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {billItems.map((item) => {
                    const product = productData.find((p) => p.productCode === item.productCode);
                    const availableStock = product ? product.quantity : 0;

                    return (
                      <TableRow key={item.productCode}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell align="right">₹{item.product_selling_price}</TableCell>
                        <TableCell align="center">{availableStock}</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => updateItemQuantity(item.productCode, -1)} disabled={item.quantity <= 1}>
                            <Remove />
                          </IconButton>
                          {item.quantity}
                          <IconButton onClick={() => updateItemQuantity(item.productCode, 1)} disabled={item.quantity >= availableStock}>
                            <Add />
                          </IconButton>
                        </TableCell>
                        <TableCell align="right">₹{item.totalPrice}</TableCell>
                        <TableCell align="center">
                          <IconButton color="error" onClick={() => removeItem(item.productCode)}>
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Product Selection */}
          <Grid item xs={12} md={4}>
            <Paper sx={{
              p: 2,
              maxHeight: '500px',
              overflowY: 'auto',
              backgroundColor: '#f8f9fa',
              borderRadius: 2,
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
            }}>
              <Typography variant="h6" gutterBottom sx={{
                borderBottom: '2px solid #1976d2',
                pb: 1,
                mb: 2,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box component="span" sx={{ color: '#1976d2' }}>⚡</Box>
                Quick Select Products
              </Typography>
              <Grid container spacing={1.5}>
                {filteredProducts.slice(0, 30).map((product) => (
                  <Grid item xs={12} sm={6} key={product.productCode}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1.5,
                        transition: 'all 0.2s',
                        cursor: product.quantity <= 0 ? 'not-allowed' : 'pointer',
                        backgroundColor: product.quantity <= 0 ? '#f5f5f5' : '#fff',
                        '&:hover': {
                          transform: product.quantity > 0 ? 'translateY(-2px)' : 'none',
                          boxShadow: product.quantity > 0 ? 3 : 1
                        }
                      }}
                      onClick={() => product.quantity > 0 && handleProductSelect(product)}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            color: product.quantity <= 0 ? '#9e9e9e' : 'inherit'
                          }}
                        >
                          {product.productName}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: product.quantity <= 0 ? '#f44336' : product.quantity < 5 ? '#ed6c02' : '#2e7d32',
                              fontWeight: 500
                            }}
                          >
                            {product.quantity <= 0
                              ? 'Out of stock'
                              : product.quantity < 5
                                ? `Low stock (${product.quantity})`
                                : `In stock: ${product.quantity}`
                            }
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#1976d2' }}>
                            ₹{product.product_selling_price}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Billing Summary */}
          <Grid item xs={12} md={4}>
            <Paper sx={{
              p: 3,
              backgroundColor: '#fff',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}>
              <Typography variant="h6" gutterBottom sx={{
                borderBottom: '2px solid #1976d2',
                pb: 1,
                mb: 3,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box component="span" sx={{ color: '#1976d2' }}>📋</Box>
                Bill Summary
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Customer Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Customer Phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <Select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'upi')}
                        displayEmpty
                        sx={{
                          borderRadius: 2
                        }}
                      >
                        <MenuItem value="cash">💵 Cash</MenuItem>
                        <MenuItem value="card">💳 Card</MenuItem>
                        <MenuItem value="upi">📱 UPI</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>GST Rate</InputLabel>
                      <Select
                        value={gstPercentage}
                        label="GST Rate"
                        onChange={(e) => handleGSTChange(Number(e.target.value))}
                        sx={{
                          borderRadius: 2
                        }}
                      >
                        <MenuItem value={0}>No GST (0%)</MenuItem>
                        <MenuItem value={5}>5% GST</MenuItem>
                        <MenuItem value={12}>12% GST</MenuItem>
                        <MenuItem value={18}>18% GST</MenuItem>
                        <MenuItem value={28}>28% GST</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper sx={{
                      p: 2,
                      mt: 2,
                      backgroundColor: '#f8f9fa',
                      borderRadius: 2
                    }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography color="text.secondary">Subtotal:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography align="right" fontWeight={500}>₹{total.subtotal.toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography color="text.secondary">GST ({gstPercentage}%):</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography align="right" fontWeight={500}>₹{total.tax.toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="h6">Total:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="h6" align="right" color="primary" fontWeight={600}>
                            ₹{total.total.toFixed(2)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={handleProcessPayment}
                      disabled={billItems.length === 0}
                      sx={{
                        mt: 2,
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)'
                        }
                      }}
                    >
                      {billItems.length === 0 ? 'Add Items to Bill' : 'Process Payment'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>



        {/* Barcode Scanner Dialog */}
        <Dialog open={openScanner} onClose={() => setOpenScanner(false)} maxWidth="sm" fullWidth>
          {scanError ? (
            <Box sx={{ p: 2 }}>
              <Typography color="error">{scanError}</Typography>
              <Button onClick={() => setOpenScanner(false)}>Close</Button>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <BarcodeScannerComponent width="100%" height={300} onUpdate={handleScannerUpdate} />
              <Button fullWidth variant="contained" onClick={() => setOpenScanner(false)} sx={{ mt: 2 }}>
                Close Scanner
              </Button>
            </Box>
          )}
        </Dialog>

        {/* Alert Snackbar */}
        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={() => setAlert({ ...alert, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setAlert({ ...alert, open: false })} severity={alert.type} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        </Snackbar>

        {/* Print Dialog */}
        {printDialogOpen && currentBill && appSettings && (
          <GenerateBillPrint
            bill={currentBill}
            businessDetails={appSettings.business}
            billSettings={appSettings.billSettings}
          />
        )}
      </Box>
    </>
  );
};

export default BillingPage;
