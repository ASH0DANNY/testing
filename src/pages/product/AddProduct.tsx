import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addProduct } from 'store/reducers/product-reducer';
import { productCategories, productType } from 'types/product';
import { useUserCategories } from 'hooks/useUserCategories';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Grid,
  Card,
  Select,
  FormControl,
  FormHelperText,
  MenuItem,
  Dialog,
  Typography,
  InputLabel,
  useTheme,
  IconButton,
  Divider,
  Tooltip
} from '@mui/material';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CachedIcon from '@mui/icons-material/Cached';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const AddProduct = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [openScanner, setOpenScanner] = useState(false);
  const userCategories = useUserCategories();

  const validationSchema = yup.object({
    productName: yup.string().required('Product Name is required'),
    productCode: yup.string().required('Product Code is required'),
    product_selling_price: yup.number().required('Selling Price is required'),
    product_cost_price: yup.number().required('Cost Price is required'),
    product_mrp_price: yup.number().required('MRP is required'),
    category: yup.object().shape({
      categoryName: yup.string().required('Category is required'),
      subCategories: yup.array().of(yup.string())
    }),
    quantity: yup.number().required('Quantity is required'),
    expiryDate: yup.date().nullable().optional(),
    dealerName: yup.string().optional(),
    size: yup.string().optional(),
    color: yup.string().optional()
  });

  const generateProductCode = () => {
    const chars = '0123456789';
    let productCode = '';
    for (let i = 0; i < 12; i++) {
      productCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    formik.setFieldValue('productCode', productCode);
  };

  const formik = useFormik<productType>({
    initialValues: {
      doc_id: '',
      product_id: '',
      productName: '',
      productCode: '',
      product_selling_price: 0,
      product_cost_price: 0,
      product_mrp_price: 0,
      category: {
        categoryName: '',
        subCategories: []
      },
      quantity: 0,
      dealerName: '',
      size: '',
      color: ''
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      // @ts-ignore
      dispatch(addProduct(values))
        .unwrap()
        .then(() => {
          alert('Product added successfully');
          resetForm();
        })
        .catch((error: any) => {
          console.error('Error adding product: ', error);
          alert('Failed to add product');
        });
    }
  });

  const handleScanResult = (err: any, result: any) => {
    if (result) {
      formik.setFieldValue('productCode', result?.getText() || '');
      setOpenScanner(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
        Add New Product
      </Typography>

      <form onSubmit={formik.handleSubmit}>
        <Card sx={{ mb: 3, p: 2, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1 }}>
            Product Details
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                name="productName"
                label="Product Name"
                fullWidth
                variant="outlined"
                value={formik.values.productName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.productName && Boolean(formik.errors.productName)}
                helperText={formik.touched.productName && formik.errors.productName}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="productCode"
                label="Product Code"
                fullWidth
                variant="outlined"
                value={formik.values.productCode}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.productCode && Boolean(formik.errors.productCode)}
                helperText={formik.touched.productCode && formik.errors.productCode}
                InputProps={{
                  endAdornment: (
                    <Box>
                      <Tooltip title="Generate Random Code">
                        <IconButton onClick={generateProductCode} size="small" sx={{ mr: 0.5 }}>
                          <CachedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Scan Barcode">
                        <IconButton onClick={() => setOpenScanner(true)} size="small">
                          <QrCodeScannerIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth error={formik.touched.category?.categoryName && Boolean(formik.errors.category)}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category.categoryName"
                  label="Category"
                  value={formik.values.category.categoryName}
                  onChange={(e) => {
                    const selectedCategory = productCategories.find((cat) => cat.category === e.target.value);
                    formik.setFieldValue('category', {
                      categoryName: e.target.value,
                      subCategories: selectedCategory?.subcategory || []
                    });
                  }}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="">--Select Category--</MenuItem>
                  {productCategories
                    .filter((cat) => userCategories.includes(cat.category))
                    .map((category) => (
                      <MenuItem key={category.category} value={category.category}>
                        {category.category}
                      </MenuItem>
                    ))}
                </Select>
                {formik.touched.category?.categoryName && formik.errors.category && (
                  <FormHelperText>{formik.errors.category.categoryName}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!formik.values.category.categoryName}>
                <InputLabel>Subcategory</InputLabel>
                <Select
                  name="category.subCategories"
                  label="Subcategory"
                  value={formik.values.category.subCategories[0] || ''}
                  onChange={(e) => {
                    formik.setFieldValue('category.subCategories', [e.target.value]);
                  }}
                >
                  <MenuItem value="">--Select Subcategory--</MenuItem>
                  {productCategories
                    .find((cat) => cat.category === formik.values.category.categoryName)
                    ?.subcategory.map((subCategory: string) => (
                      <MenuItem key={subCategory} value={subCategory}>
                        {subCategory}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                name="quantity"
                label="Quantity"
                type="number"
                fullWidth
                variant="outlined"
                value={formik.values.quantity}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.quantity && Boolean(formik.errors.quantity)}
                helperText={formik.touched.quantity && formik.errors.quantity}
              />
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ mb: 3, p: 2, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1 }}>
            Pricing Details
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                name="product_selling_price"
                label="Selling Price"
                type="number"
                fullWidth
                variant="outlined"
                value={formik.values.product_selling_price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.product_selling_price && Boolean(formik.errors.product_selling_price)}
                helperText={formik.touched.product_selling_price && formik.errors.product_selling_price}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                name="product_cost_price"
                label="Cost Price"
                type="number"
                fullWidth
                variant="outlined"
                value={formik.values.product_cost_price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.product_cost_price && Boolean(formik.errors.product_cost_price)}
                helperText={formik.touched.product_cost_price && formik.errors.product_cost_price}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                name="product_mrp_price"
                label="MRP"
                type="number"
                fullWidth
                variant="outlined"
                value={formik.values.product_mrp_price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.product_mrp_price && Boolean(formik.errors.product_mrp_price)}
                helperText={formik.touched.product_mrp_price && formik.errors.product_mrp_price}
              />
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ mb: 3, p: 2, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1 }}>
            Additional Details
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                name="dealerName"
                label="Dealer Name"
                fullWidth
                variant="outlined"
                value={formik.values.dealerName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.dealerName && Boolean(formik.errors.dealerName)}
                helperText={formik.touched.dealerName && formik.errors.dealerName}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="size"
                label="Size (Optional)"
                fullWidth
                variant="outlined"
                value={formik.values.size}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.size && Boolean(formik.errors.size)}
                helperText={formik.touched.size && formik.errors.size}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="color"
                label="Color (Optional)"
                fullWidth
                variant="outlined"
                value={formik.values.color}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.color && Boolean(formik.errors.color)}
                helperText={formik.touched.color && formik.errors.color}
              />
            </Grid>
          </Grid>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            color="inherit"
            size="large"
            onClick={() => formik.resetForm()}
            startIcon={<RestartAltIcon />}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            startIcon={<SaveIcon />}
          >
            Save Product
          </Button>
        </Box>
      </form>

      {/* Barcode Scanner Dialog */}
      <Dialog
        open={openScanner}
        onClose={() => setOpenScanner(false)}
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Scan Barcode</Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ width: 500, height: 500, mx: 'auto', my: 2 }}>
            <BarcodeScannerComponent
              width={500}
              height={500}
              onUpdate={handleScanResult}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="inherit"
              onClick={() => setOpenScanner(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default AddProduct;