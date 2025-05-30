import { useState, ChangeEvent, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  CircularProgress,
  Button
} from '@mui/material';
import MainCard from 'components/MainCard';
import useAlert from 'hooks/useAlert';
import SaveIcon from '@mui/icons-material/Save';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from 'store/index-store';
import { updateAppSettings, fetchAppSettings } from 'store/reducers/settings-reducer';
import useAuth from 'hooks/useAuth';
import useConfig from 'hooks/useConfig';
import { ThemeMode, PresetColor } from 'types/config';

interface BusinessSettingsType {
  businessName: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessPostalCode: string;
  businessPhone: string;
  businessEmail: string;
  businessGSTIN: string;
}

const ApplicationSettings = () => {
  const { showMessage } = useAlert();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const { mode, onChangeMode, presetColor, onChangePresetColor, themeContrast, onChangeContrast } = useConfig();
  const [isDirty, setIsDirty] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(mode === ThemeMode.DARK);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettingsType>({
    businessName: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessPostalCode: '',
    businessPhone: '',
    businessEmail: '',
    businessGSTIN: ''
  });

  const { settings, loading } = useSelector((state: RootState) => state.appSettings);

  // Load initial settings if needed
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchAppSettings(user.id));
    }
  }, [dispatch, user]);

  // Update local state when settings change
  useEffect(() => {
    if (settings) {
      setDarkMode(settings.theme.darkMode);
      setNotifications(settings.notifications.enabled);
      setBusinessSettings(settings.business);
    }
  }, [settings]);

  useEffect(() => {
    setDarkMode(mode === ThemeMode.DARK);
  }, [mode]);

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
    setIsDirty(true);
  };

  const handleToggleNotifications = () => {
    setNotifications(!notifications);
    setIsDirty(true);
  };

  const handleBusinessSettingChange = (field: keyof BusinessSettingsType) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setBusinessSettings(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!user?.id) {
      showMessage('User not authenticated', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedSettings = {
        ...settings,
        theme: {
          ...settings.theme,
          darkMode
        },
        notifications: {
          ...settings.notifications,
          enabled: notifications
        },
        business: businessSettings
      };

      await dispatch(updateAppSettings({
        userId: user.id,
        settings: updatedSettings
      })).unwrap();

      // Update theme mode in ConfigContext
      onChangeMode(darkMode ? ThemeMode.DARK : ThemeMode.LIGHT);
      showMessage('Settings saved successfully!', 'success');
      setIsDirty(false);
    } catch (error) {
      showMessage('Failed to save settings', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const handlePresetColorChange = (color: PresetColor) => {
    onChangePresetColor(color);
    setIsDirty(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <MainCard title="Application Settings">
        <Grid container spacing={3}>
          {/* Theme Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Theme Settings</Typography>
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={darkMode}
                        onChange={handleToggleDarkMode}
                        color="primary"
                      />
                    }
                    label="Dark Mode"
                  />
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Color Scheme</InputLabel>
                    <Select
                      value={presetColor}
                      label="Color Scheme"
                      onChange={(e) => handlePresetColorChange(e.target.value as PresetColor)}
                    >
                      <MenuItem value="default">Default</MenuItem>
                      <MenuItem value="theme1">Theme 1</MenuItem>
                      <MenuItem value="theme2">Theme 2</MenuItem>
                      <MenuItem value="theme3">Theme 3</MenuItem>
                      <MenuItem value="theme4">Theme 4</MenuItem>
                      <MenuItem value="theme5">Theme 5</MenuItem>
                      <MenuItem value="theme6">Theme 6</MenuItem>
                      <MenuItem value="theme7">Theme 7</MenuItem>
                      <MenuItem value="theme8">Theme 8</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    sx={{ mt: 2 }}
                    control={
                      <Switch
                        checked={themeContrast}
                        onChange={() => {
                          onChangeContrast();
                          setIsDirty(true);
                        }}
                        color="primary"
                      />
                    }
                    label="High Contrast"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Notification Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Notification Settings</Typography>
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications}
                        onChange={handleToggleNotifications}
                        color="primary"
                      />
                    }
                    label="Enable Notifications"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Business Details */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Business Details</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Business Name"
                      value={businessSettings.businessName}
                      onChange={handleBusinessSettingChange('businessName')}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Business Address"
                      value={businessSettings.businessAddress}
                      onChange={handleBusinessSettingChange('businessAddress')}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="City"
                      value={businessSettings.businessCity}
                      onChange={handleBusinessSettingChange('businessCity')}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="State"
                      value={businessSettings.businessState}
                      onChange={handleBusinessSettingChange('businessState')}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Postal Code"
                      value={businessSettings.businessPostalCode}
                      onChange={handleBusinessSettingChange('businessPostalCode')}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={businessSettings.businessPhone}
                      onChange={handleBusinessSettingChange('businessPhone')}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={businessSettings.businessEmail}
                      onChange={handleBusinessSettingChange('businessEmail')}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="GSTIN"
                      value={businessSettings.businessGSTIN}
                      onChange={handleBusinessSettingChange('businessGSTIN')}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Save Button */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!isDirty || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </MainCard>
    </Box>
  );
};

export default ApplicationSettings;