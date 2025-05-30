import { useState, useEffect } from 'react';
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
    TextField,
    CircularProgress,
    Alert
} from '@mui/material';
import MainCard from 'components/MainCard';
import useAlert from 'hooks/useAlert';
import SaveIcon from '@mui/icons-material/Save';
import { AppDispatch, RootState } from 'store/index-store';
import { fetchAppSettings, updateAppSettings } from 'store/reducers/settings-reducer';
import useAuth from 'hooks/useAuth';
import { AppSettings } from 'types/settings';

const BillSettingsPage = () => {
    const { showMessage } = useAlert();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useAuth();
    const { settings, loading } = useSelector((state: RootState) => state.appSettings);
    const [localSettings, setLocalSettings] = useState<AppSettings | null>(settings);
    const [isDirty, setIsDirty] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load settings on component mount
    useEffect(() => {
        if (user?.id) {
            dispatch(fetchAppSettings(user.id));
        }
    }, [dispatch, user]);

    // Update local settings when Redux settings change
    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSettingChange = (setting: string, value: any) => {
        setLocalSettings(prev => {
            if (!prev) return prev;

            if (setting.includes('.')) {
                const [parent, child] = setting.split('.');
                const parentKey = parent as keyof AppSettings;
                return {
                    ...prev,
                    [parentKey]: {
                        ...prev[parentKey],
                        [child]: value
                    }
                };
            }
            return {
                ...prev,
                [setting]: value
            };
        });
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!user?.id) {
            showMessage('User not authenticated', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await dispatch(updateAppSettings({
                userId: user.id,
                settings: localSettings!
            })).unwrap();
            showMessage('Settings saved successfully!', 'success');
            setIsDirty(false);
        } catch (err) {
            showMessage('Failed to save settings', 'error');
        } finally {
            setIsSubmitting(false);
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
            <MainCard title="Bill Settings">
                <Grid container spacing={3}>
                    {/* Print Settings */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" gutterBottom>Print Settings</Typography>
                                <Box sx={{ mt: 2 }}>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Paper Width</InputLabel>
                                        <Select
                                            value={localSettings.billSettings.paperWidth}
                                            label="Paper Width"
                                            onChange={(e) => handleSettingChange('billSettings.paperWidth', e.target.value)}
                                        >
                                            <MenuItem value={58}>58mm</MenuItem>
                                            <MenuItem value={80}>80mm</MenuItem>
                                            <MenuItem value={210}>A4 (210mm)</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={localSettings.billSettings.showLogo}
                                                onChange={(e) => handleSettingChange('billSettings.showLogo', e.target.checked)}
                                            />
                                        }
                                        label="Show Logo"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={localSettings.billSettings.showBusinessAddress}
                                                onChange={(e) => handleSettingChange('billSettings.showBusinessAddress', e.target.checked)}
                                            />
                                        }
                                        label="Show Business Address"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={localSettings.billSettings.showGSTIN}
                                                onChange={(e) => handleSettingChange('billSettings.showGSTIN', e.target.checked)}
                                            />
                                        }
                                        label="Show GSTIN"
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Footer Settings */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" gutterBottom>Footer Settings</Typography>
                                <Box sx={{ mt: 2 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={localSettings.billSettings.showFooterText}
                                                onChange={(e) => handleSettingChange('billSettings.showFooterText', e.target.checked)}
                                            />
                                        }
                                        label="Show Footer Text"
                                    />
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        label="Footer Text"
                                        value={localSettings.billSettings.footerText}
                                        onChange={(e) => handleSettingChange('billSettings.footerText', e.target.value)}
                                        disabled={!localSettings.billSettings.showFooterText}
                                        sx={{ mt: 2 }}
                                    />
                                </Box>
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

export default BillSettingsPage;