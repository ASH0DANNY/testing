// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { DocumentCode2, I24Support, Driving, Add, Home, DocumentText, Bill, Barcode, Printer, User, Profile2User, Clipboard, ReceiptDiscount, ClipboardText, Activity, Driver, Folder, WalletMoney, Setting2, Setting5, Category, ElementEqual } from 'iconsax-react';

// type
import { NavItemType } from 'types/menu';

// icons
const icons = {
  samplePage: DocumentCode2,
  documentation: DocumentText,
  roadmap: Driving,
  add: Add,
  home: Home,
  bills: Bill,
  barcode: Barcode,
  printer: Printer,
  users: Profile2User,
  user: User,
  tags: Clipboard,
  discount: ReceiptDiscount,
  reports: ClipboardText,
  activity: Activity,
  setting1: Setting2,
  setting2: Setting5,
  category: Category,
  manage1: Driver,
  products: ElementEqual,
  wallet: WalletMoney,
  folder: Folder,
  dashboard: Activity,
  support: I24Support
};

// ==============================|| MENU ITEMS - SUPPORT ||============================== //

const support: NavItemType[] = [
  {
    id: 'create-new-bill',
    title: <FormattedMessage id="Create New Bill" />,
    type: 'group',
    url: '/billing',
    icon: icons.add,
    external: false,
    target: false,
    breadcrumbs: false,
    chip: {
      label: 'New',
      color: 'primary',
      size: 'small'
    }
  },
  {
    id: 'home',
    title: <FormattedMessage id="Home" />,
    type: 'group',
    children: [
      {
        id: 'dashboard',
        title: <FormattedMessage id="Dashboard" />,
        type: 'item',
        url: '/dashboard',
        icon: icons.activity,
        external: false,
        target: false
      },
      {
        id: 'my-bills',
        title: <FormattedMessage id="My Bills" />,
        type: 'item',
        url: '/my-bills',
        icon: icons.bills,
        external: false,
        target: false
      }
    ]
  },
  {
    id: ' product',
    title: <FormattedMessage id="Product" />,
    type: 'group',
    children: [

      {
        id: 'my-product',
        title: <FormattedMessage id="My Product" />,
        type: 'item',
        url: '/my-product',
        icon: icons.documentation,
        external: false,
        target: false
      },
      {
        id: 'printables',
        title: <FormattedMessage id="Printables" />,
        type: 'collapse',
        icon: icons.printer,
        children: [
          {
            id: 'barcode',
            title: <FormattedMessage id="Generate Barcode" />,
            type: 'item',
            url: '/printables/generate-barcode',
            icon: icons.barcode,
            external: false,
            target: false
          },
          {
            id: 'signboard',
            title: <FormattedMessage id="Generate Signboard" />,
            type: 'item',
            url: '/printables/generate-signboard',
            icon: icons.tags,
            external: false,
            target: false
          }
        ]
      }
    ]
  },

  {
    id: 'management',
    title: <FormattedMessage id="Management" />,
    type: 'group',
    children: [
      {
        id: 'stock-management',
        title: <FormattedMessage id="Stock Management" />,
        type: 'item',
        url: '/stock-management',
        icon: icons.setting1,
        external: false,
        target: false
      },
      {
        id: 'credit-management',
        title: <FormattedMessage id="Credit Management" />,
        type: 'item',
        url: '/credit-management',
        icon: icons.wallet,
        external: false,
        target: false
      },
      {
        id: 'staff-management',
        title: <FormattedMessage id="Staff Management" />,
        type: 'item',
        url: '/staff-management',
        icon: icons.users,
        external: false,
        target: false
      }
    ]
  },

  {
    id: 'reports',
    title: <FormattedMessage id="Reports" />,
    type: 'group',
    children: [
      {
        id: 'reports',
        title: <FormattedMessage id="Reports" />,
        type: 'item',
        url: '/reports',
        icon: icons.reports,
        external: false,
        target: false
      },
      {
        id: 'my-example',
        title: <FormattedMessage id="My Example" />,
        type: 'item',
        url: '/my-example',
        icon: icons.documentation,
        external: false,
        target: false
      }
    ]
  },
  {
    id: 'settings',
    title: <FormattedMessage id="Settings" />,
    type: 'group',
    children: [
      {
        id: 'application-settings',
        title: <FormattedMessage id="Application Settings" />,
        type: 'item',
        url: '/settings/application-settings',
        icon: icons.setting2,
        external: false,
        target: false
      },
      {
        id: 'bill-settings',
        title: <FormattedMessage id="Bill Settings" />,
        type: 'item',
        url: '/settings/bill-settings',
        icon: icons.setting2,
        external: false,
        target: false
      },
      {
        id: 'dashboard-settings',
        title: <FormattedMessage id="Dashboard Settings" />,
        type: 'item',
        url: '/settings/dashboard-settings',
        icon: icons.category,
        external: false,
        target: false
      },
      {
        id: 'report-settings',
        title: <FormattedMessage id="Report Settings" />,
        type: 'item',
        url: '/settings/report-settings',
        icon: icons.manage1,
        external: false,
        target: false
      }
    ]
  }
];

export default support;
