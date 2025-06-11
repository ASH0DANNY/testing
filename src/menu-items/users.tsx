// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { DocumentCode2, I24Support, Driving } from 'iconsax-react';

// type
import { NavItemType } from 'types/menu';

// icons
const icons = {
    samplePage: DocumentCode2,
    documentation: I24Support,
    roadmap: Driving
};

// ==============================|| MENU ITEMS - SUPPORT ||============================== //

const support: NavItemType = {
    id: 'users',
    title: <FormattedMessage id="Users" />,
    type: 'group',
    children: [
        {
            id: 'Products',
            title: <FormattedMessage id="Products" />,
            type: 'item',
            url: '/products',
            icon: icons.roadmap,
            external: false,
            target: false
        },
        {
            id: 'MyOrders',
            title: <FormattedMessage id="My Orders" />,
            type: 'item',
            url: '/my-orders',
            icon: icons.roadmap,
            external: false,
            target: false
        }
    ]
};

export default support;
