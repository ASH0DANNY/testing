// material-ui
import { useTheme } from '@mui/material/styles';
import { Typography, useMediaQuery } from '@mui/material';

// project-imports
import DrawerHeaderStyled from './DrawerHeaderStyled';
// import Logo from 'components/logo';
import { DRAWER_WIDTH, HEADER_HEIGHT } from 'config';
import useConfig from 'hooks/useConfig';
import myApplicationLogo from "../../../../assets/images/logo/express-bills-high-resolution-logo.png"

// types
import { MenuOrientation } from 'types/config';

// ==============================|| DRAWER HEADER ||============================== //

interface Props {
  open: boolean;
}

const DrawerHeader = ({ open }: Props) => {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const { menuOrientation } = useConfig();
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;


  return (
    <DrawerHeaderStyled
      theme={theme}
      open={open}
      sx={{
        minHeight: isHorizontal ? 'unset' : HEADER_HEIGHT,
        maxHeight: isHorizontal ? 'unset' : HEADER_HEIGHT + 5,
        width: isHorizontal ? { xs: '100%', lg: DRAWER_WIDTH + 50 } : 'inherit',
        paddingTop: isHorizontal ? { xs: '10px', lg: '0' } : '8px',
        paddingBottom: isHorizontal ? { xs: '18px', lg: '0' } : '8px',
        paddingLeft: isHorizontal ? { xs: '24px', lg: '0' } : open ? '24px' : 0,
      }}
    >

      {
        myApplicationLogo ?

          <img src={myApplicationLogo} alt="Application Logo" style={{
            maxWidth: '100%',
            maxHeight: '100%'
          }} /> :
          < Typography variant="h3" sx={{ color: "#82bf82", fontSize: "large", fontWeight: "bold", fontFamily: "sans-serif" }}>Express Bills</Typography>

      }
    </DrawerHeaderStyled >
  );
};

export default DrawerHeader;
