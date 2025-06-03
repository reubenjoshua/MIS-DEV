import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    ReceiptText,
    Database,
    Users
} from 'lucide-react';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Skeleton,
    Typography,
} from "@mui/material";
import { mockRoles, mockBranch, mockLoginAPI, mockFetchUserDetails } from "@/mocks/mockAPI";

import { useAuth } from "../../context/AuthContext";
import { RoleType, UserProfile, BranchType } from "@/models/User";

interface NavItems
{
    label:  string;
    path:   string;
    roleID: number[];
};

interface NavSection
{
    header: string;
    items:  NavItems [];
};

const navSections: NavSection [] = [
    {
        header: "Manage",
        items:
        [
            { label: 'Manage User',     path: '/mis/manage-user', roleID: [1, 2, 3] },
            { label: 'Manage Branch',   path: '/mis/manage-branch', roleID: [1, 2, 3] },
        ]
    },
    {
        header: "Forms",
        items:
        [
            { label: 'Monthly',         path: '/mis/monthly', roleID: [1, 2, 3, 4] },
            { label: 'Daily',           path: '/mis/daily', roleID: [1, 2, 3, 4] },
            { label: 'Approve Data',    path: '/mis/approve-data', roleID: [1, 2, 3] },
            { label: 'Status',          path: '/mis/status', roleID: [4] },
        ]
    },    
    {
        header: "User",
        items:
        [
            { label: 'Profile',         path: '/mis/profile', roleID: [1, 2, 3, 4] },
        ]
    },
];

export default function Sidebar ()
{
    const { user, logout } = useAuth ();
    // const roleItems = navItems.filter (item => item.ID.includes (user.Role));
    // const { loginUser } = useAuth ();

    if (!user)
    { return <div className = "">No user loaded</div>; }

    // const roleItems = navSections.filter (item => item.roleID.includes (user?.Role));
    const roleName = user.roleName || 'User';
    const branchName = user.branchName || 'No Branch';

    return (
        <div className = "sidebar-items-Container flex flex-col justify-between h-full">
            <div className = "main-div-1 user-Information flex flex-col">
                <h1 className = "self-center">
                    Hello {user.username && user.username.trim() !== "" ? user.username : "User"}!
                </h1>
                <h3 className = "self-center">{roleName}</h3>
                <h3 className = "self-center">{branchName}</h3>
            </div>

            <div className = "main-div-2 menu-Container">
                <ul>
                    {
                        navSections.map ((section) => {
                            const visibleItems = section.items.filter (item => item.roleID.includes (user.roleId));

                            if (visibleItems.length === 0)
                            { return null; }

                            return (
                                <li key = {section.header} className = "menu-Section w-full">
                                    <span className = "menu-Header text-sm py-1">{section.header}</span>
                                    <ul className = "menu-Items flex flex-col w-full">
                                        {
                                            visibleItems.map ((item) => (
                                                <li className = "menu-label">
                                                    <NavLink
                                                        to = { item.path }
                                                        className = {({ isActive }) => 
                                                            `flex w-full justify-center rounded-2xl my-0.5 ${ isActive
                                                                ? "bg-[#A3A3A3] py-2"
                                                                : "hover:bg-[#A3A3A3] transition duration-100 py-2" }`
                                                    }>
                                                        <span>{ item.label }</span>
                                                    </NavLink>
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </li>
                            );
                        })
                    }
                </ul>
            </div>

            <div className = "main-div-3 logout-Button">
                <button
                    onClick = { logout }
                    className = "bg-[#2E2E2E] text-white rounded w-full h-10 hover:bg-[#7f7f7f] hover:text-[#2E2E2E] transition">
                        Sign Out
                </button>
            </div>
        </div>
    );
};