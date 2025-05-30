import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import MainCard from 'components/MainCard';
import useAlert from 'hooks/useAlert';
import SaveIcon from '@mui/icons-material/Save';
import { AppDispatch, RootState } from 'store/index-store';
import { fetchAppSettings, updateAppSettings } from 'store/reducers/settings-reducer';
import useAuth from 'hooks/useAuth';

const ReportSettingsPage = () => {
  const { showMessage } = useAlert();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const { settings, loading, error } = useSelector((state: RootState) => state.appSettings);
  const [localSettings, setLocalSettings] = useState(settings);

  // Effect to load settings when component mounts
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchAppSettings(user.id));
    }
  }, [dispatch, user]);

  // Update local settings when Redux settings change (initial load)
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingChange = (setting: keyof typeof settings.reportSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      reportSettings: {
        ...prev.reportSettings,
        [setting]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      showMessage('User not authenticated', 'error');
      return;
    }

    try {
      await dispatch(updateAppSettings({
        userId: user.id,
        settings: localSettings
      })).unwrap();
      showMessage('Report settings saved successfully!', 'success');
    } catch (err) {
      showMessage('Failed to save settings', 'error');
    }
  };

  if (loading && !localSettings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!localSettings) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load settings</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <MainCard title="Report Settings">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Display Settings
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Default Date Range</InputLabel>
                    <Select
                      value={localSettings.reportSettings.defaultDateRange}
                      label="Default Date Range"
                      onChange={(e) => handleSettingChange('defaultDateRange', e.target.value)}
                    >
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="week">This Week</MenuItem>
                      <MenuItem value="month">This Month</MenuItem>
                      <MenuItem value="year">This Year</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Default View</InputLabel>
                    <Select
                      value={localSettings.reportSettings.defaultView}
                      label="Default View"
                      onChange={(e) => handleSettingChange('defaultView', e.target.value)}
                    >
                      <MenuItem value="summary">Summary View</MenuItem>
                      <MenuItem value="detailed">Detailed View</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.reportSettings.showGraphs}
                        onChange={(e) => handleSettingChange('showGraphs', e.target.checked)}
                      />
                    }
                    label="Show Graphs"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Advanced Settings
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.reportSettings.enableExport}
                          onChange={(e) => handleSettingChange('enableExport', e.target.checked)}
                        />
                      }
                      label="Enable Export (PDF/Excel)"
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.reportSettings.showTotals}
                          onChange={(e) => handleSettingChange('showTotals', e.target.checked)}
                        />
                      }
                      label="Show Running Totals"
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.reportSettings.autoRefresh}
                          onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                        />
                      }
                      label="Enable Auto Refresh"
                    />

                    {localSettings.reportSettings.autoRefresh && (
                      <FormControl fullWidth>
                        <InputLabel>Refresh Interval</InputLabel>
                        <Select
                          value={localSettings.reportSettings.refreshInterval}
                          label="Refresh Interval"
                          onChange={(e) => handleSettingChange('refreshInterval', Number(e.target.value))}
                        >
                          <MenuItem value={30}>30 seconds</MenuItem>
                          <MenuItem value={60}>1 minute</MenuItem>
                          <MenuItem value={300}>5 minutes</MenuItem>
                          <MenuItem value={600}>10 minutes</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Save Button */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error && <Alert severity="error" sx={{ flex: 1, mr: 2 }}>{error}</Alert>}
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </MainCard>
    </Box>
  );
};

export default ReportSettingsPage;
