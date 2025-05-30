import { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Paper
} from '@mui/material';
import MaterialTable from '@material-table/core';
import SignboardIcon from '@mui/icons-material/Crop169';
import PreviewIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { SignboardType, GenerateSignboard, previewSignboard } from '../../utils/pdf-excel/GenerateSignboard';

// Local storage key
const STORAGE_KEY = 'signboard_designs';

const SignboardPage = () => {
  // State for signboards and selections
  const [signboards, setSignboards] = useState<SignboardType[]>([]);
  const [selectedSignboards, setSelectedSignboards] = useState<SignboardType[]>([]);

  // Copy dialog state
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copies, setCopies] = useState(1);
  const [isPreview, setIsPreview] = useState(false);

  // New signboard form state
  const [newSignboard, setNewSignboard] = useState<Omit<SignboardType, 'id'>>({
    title: 'SALE',
    discountPercentage: 50,
    additionalText: 'off',
    backgroundColor: '#ff0000',
    textColor: '#ffffff',
    orientation: 'portrait'
  });

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [signboardToDelete, setSignboardToDelete] = useState<any>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

  // Load signboards from local storage on component mount
  useEffect(() => {
    const savedSignboards = localStorage.getItem(STORAGE_KEY);
    if (savedSignboards) {
      try {
        setSignboards(JSON.parse(savedSignboards));
      } catch (error) {
        console.error('Failed to parse saved signboards:', error);
        // If parsing fails, reset local storage
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save signboards to local storage whenever they change
  useEffect(() => {
    if (signboards.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(signboards));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [signboards]);

  // Handle adding a new signboard
  const handleAddSignboard = () => {
    const newSignboardWithId = {
      ...newSignboard,
      id: `signboard-${Date.now()}`
    };

    setSignboards([...signboards, newSignboardWithId]);
    setFormDialogOpen(false);

    // Reset form for next use
    setNewSignboard({
      title: 'SALE',
      discountPercentage: 50,
      additionalText: 'off',
      backgroundColor: '#ff0000',
      textColor: '#ffffff',
      orientation: 'portrait'
    });
  };

  // Handle form change
  const handleFormChange = (field: string, value: any) => {
    setNewSignboard({
      ...newSignboard,
      [field]: value
    });
  };

  const handleSignboardButtonClick = (preview: boolean) => {
    if (selectedSignboards.length === 0) {
      alert('Please select at least one signboard');
      return;
    }
    setIsPreview(preview);
    setCopyDialogOpen(true);
  };

  const handlePreviewSignboard = (signboard: SignboardType) => {
    setPreviewDialogOpen(true);

    // Use the utility function after the dialog is opened
    setTimeout(() => {
      previewSignboard(signboard, 'preview-canvas');
    }, 100);
  };

  const handleGenerateSignboards = () => {
    // Format data for the utility function
    const signboardData = selectedSignboards.map(signboard => ({
      signboard,
      copies
    }));

    // Use the utility function to generate signboards
    GenerateSignboard(signboardData, isPreview);
    setCopyDialogOpen(false);
  };

  // Open "Clear All" confirmation dialog
  const handleClearAllClick = () => {
    setClearAllDialogOpen(true);
  };

  // Confirm and execute "Clear All" operation
  const confirmClearAll = () => {
    setSignboards([]);
    setSelectedSignboards([]);
    localStorage.removeItem(STORAGE_KEY);
    setClearAllDialogOpen(false);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (event: any, rowData: any) => {
    setSignboardToDelete(rowData);
    setDeleteDialogOpen(true);
  };

  // Confirm and execute delete operation
  const confirmDelete = () => {
    if (signboardToDelete) {
      const dataToDelete = Array.isArray(signboardToDelete) ? signboardToDelete : [signboardToDelete];
      const newData = signboards.filter(
        (signboard) => !dataToDelete.find((row: any) => row.id === signboard.id)
      );
      setSignboards(newData);

      // Also remove from selected items if present
      setSelectedSignboards(prev =>
        prev.filter(item => !dataToDelete.find((row: any) => row.id === item.id))
      );
    }
    setDeleteDialogOpen(false);
    setSignboardToDelete(null);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="h5">Sales Signboard Generator</Typography>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setFormDialogOpen(true)}
          >
            Add New Signboard
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<PreviewIcon />}
            onClick={() => handleSignboardButtonClick(true)}
            disabled={selectedSignboards.length === 0}
          >
            Preview Signboards
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<SignboardIcon />}
            onClick={() => handleSignboardButtonClick(false)}
            disabled={selectedSignboards.length === 0}
          >
            Generate & Save ({selectedSignboards.length})
          </Button>
        </div>
      </div>

      {/* Display existing signboards */}
      <MaterialTable
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 10 }}>
            <span>Signboard Designs</span>
            {signboards.length > 0 && (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={handleClearAllClick}
              >
                Clear All
              </Button>
            )}
          </div>
        }
        columns={[
          {
            title: 'Title',
            field: 'title',
            cellStyle: { textAlign: 'center' },
            headerStyle: { textAlign: 'center' }
          },
          {
            title: 'Discount %',
            field: 'discountPercentage',
            type: 'numeric',
            cellStyle: { textAlign: 'center' },
            headerStyle: { textAlign: 'center' }
          },
          {
            title: 'Additional Text',
            field: 'additionalText',
            cellStyle: { textAlign: 'center' },
            headerStyle: { textAlign: 'center' }
          },
          {
            title: 'Orientation',
            field: 'orientation',
            cellStyle: { textAlign: 'center' },
            headerStyle: { textAlign: 'center' }
          },
          {
            title: 'Background',
            field: 'backgroundColor',
            render: (rowData) => (
              <div
                style={{
                  width: '30px',
                  height: '20px',
                  backgroundColor: rowData.backgroundColor,
                  margin: '0 auto',
                  border: '1px solid #ddd'
                }}
              />
            ),
            cellStyle: { textAlign: 'center' },
            headerStyle: { textAlign: 'center' }
          },
          {
            title: 'Preview',
            field: 'internal_action',
            render: (rowData) => (
              <Button
                size="small"
                variant="outlined"
                onClick={() => handlePreviewSignboard(rowData)}
              >
                Preview
              </Button>
            ),
            cellStyle: { textAlign: 'center' },
            headerStyle: { textAlign: 'center' }
          }
        ]}
        data={signboards}
        options={{
          selection: true,
          headerStyle: {
            backgroundColor: '#5d87ff',
            color: '#FFF'
          },
          rowStyle: (rowData) => ({
            backgroundColor: selectedSignboards.find((p) => p.id === rowData.id) ? '#EEE' : '#FFF'
          }),
          emptyRowsWhenPaging: false,
          paging: signboards.length > 10
        }}
        onSelectionChange={(rows) => {
          setSelectedSignboards(rows as SignboardType[]);
        }}
        actions={[
          {
            icon: () => <DeleteIcon color="error" />,
            tooltip: 'Delete Signboard',
            onClick: handleDeleteClick
          }
        ]}
        localization={{
          body: {
            emptyDataSourceMessage: 'No signboard designs available. Create a new design to get started.'
          }
        }}
      />

      {/* Form Dialog for creating new signboard */}
      <Dialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Signboard</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Title Text (e.g. SALE)"
                fullWidth
                value={newSignboard.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Discount Percentage"
                type="number"
                fullWidth
                value={newSignboard.discountPercentage}
                onChange={(e) => handleFormChange('discountPercentage', parseInt(e.target.value) || 0)}
                InputProps={{ inputProps: { min: 1, max: 99 } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Additional Text (e.g. off)"
                fullWidth
                value={newSignboard.additionalText}
                onChange={(e) => handleFormChange('additionalText', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Orientation</InputLabel>
                <Select
                  value={newSignboard.orientation}
                  label="Orientation"
                  onChange={(e) => handleFormChange('orientation', e.target.value)}
                >
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Background Color</Typography>
              <input
                type="color"
                value={newSignboard.backgroundColor}
                onChange={(e) => handleFormChange('backgroundColor', e.target.value)}
                style={{ width: '100%', height: '40px' }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Text Color</Typography>
              <input
                type="color"
                value={newSignboard.textColor}
                onChange={(e) => handleFormChange('textColor', e.target.value)}
                style={{ width: '100%', height: '40px' }}
              />
            </Grid>

            <Grid item xs={12}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  backgroundColor: newSignboard.backgroundColor,
                  color: newSignboard.textColor,
                  textAlign: 'center',
                  height: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Typography variant="h5" sx={{ mb: 1 }}>
                  {newSignboard.title}
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
                  {newSignboard.discountPercentage}%
                </Typography>
                <Typography variant="h4">
                  {newSignboard.additionalText}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddSignboard} color="primary">
            Add Signboard
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for copies */}
      <Dialog open={copyDialogOpen} onClose={() => setCopyDialogOpen(false)}>
        <DialogTitle>Number of Copies</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Number of copies for each signboard"
            type="number"
            fullWidth
            value={copies}
            onChange={(e) =>
              setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleGenerateSignboards} color="primary">
            Generate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
      >
        <DialogTitle>Signboard Preview</DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <canvas id="preview-canvas" style={{ maxWidth: '100%', height: 'auto', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}></canvas>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this signboard design?
            {signboardToDelete && !Array.isArray(signboardToDelete) && (
              <span> "{signboardToDelete.title} ({signboardToDelete.discountPercentage}%)"</span>
            )}
            {signboardToDelete && Array.isArray(signboardToDelete) && (
              <span> {signboardToDelete.length} selected signboards</span>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog
        open={clearAllDialogOpen}
        onClose={() => setClearAllDialogOpen(false)}
      >
        <DialogTitle>Confirm Clear All</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove all {signboards.length} signboard designs? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearAllDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmClearAll} color="error">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SignboardPage;