import { useState, MouseEvent } from 'react';

// material-ui
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

// assets
import { Clipboard, I24Support, Lock1, Messages1, Profile, Category } from 'iconsax-react';

import CategorySelectionDialog from 'components/cards/CategorySelectionDialog';
import useAuth from 'hooks/useAuth';

// ==============================|| HEADER PROFILE - SETTING TAB ||============================== //

const SettingTab = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const handleListItemClick = (event: MouseEvent<HTMLDivElement>, index: number) => {
    setSelectedIndex(index);
  };

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <List component="nav" sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
        <ListItemButton selected={selectedIndex === 0} onClick={(event: MouseEvent<HTMLDivElement>) => handleListItemClick(event, 0)}>
          <ListItemIcon>
            <I24Support variant="Bulk" size={18} />
          </ListItemIcon>
          <ListItemText primary="Support" />
        </ListItemButton>

        <ListItemButton selected={selectedIndex === 1} onClick={(event: MouseEvent<HTMLDivElement>) => handleListItemClick(event, 1)}>
          <ListItemIcon>
            <Profile variant="Bulk" size={18} />
          </ListItemIcon>
          <ListItemText primary="Account Settings" />
        </ListItemButton>

        <ListItemButton selected={selectedIndex === 2} onClick={(event: MouseEvent<HTMLDivElement>) => handleListItemClick(event, 2)}>
          <ListItemIcon>
            <Lock1 variant="Bulk" size={18} />
          </ListItemIcon>
          <ListItemText primary="Privacy Center" />
        </ListItemButton>

        <ListItemButton selected={selectedIndex === 3} onClick={(event: MouseEvent<HTMLDivElement>) => handleListItemClick(event, 3)}>
          <ListItemIcon>
            <Messages1 variant="Bulk" size={18} />
          </ListItemIcon>
          <ListItemText primary="Feedback" />
        </ListItemButton>

        <ListItemButton selected={selectedIndex === 4} onClick={(event: MouseEvent<HTMLDivElement>) => handleListItemClick(event, 4)}>
          <ListItemIcon>
            <Clipboard variant="Bulk" size={18} />
          </ListItemIcon>
          <ListItemText primary="History" />
        </ListItemButton>

        <ListItemButton
          selected={selectedIndex === 5}
          onClick={(event: MouseEvent<HTMLDivElement>) => {
            handleListItemClick(event, 5);
            setCategoryDialogOpen(true);
          }}
        >
          <ListItemIcon>
            <Category variant="Bulk" size={18} />
          </ListItemIcon>
          <ListItemText primary="Edit Product Categories" />
        </ListItemButton>
      </List>

      {user && (
        <CategorySelectionDialog
          open={categoryDialogOpen}
          userId={user.id || ''}
          onClose={() => {
            setCategoryDialogOpen(false);
            setSelectedIndex(0);
          }}
        />
      )}
    </>
  );
};

export default SettingTab;
