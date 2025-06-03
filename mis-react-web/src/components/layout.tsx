import { Outlet } from "react-router-dom";
import TopTab from "./navigation/topTab";
import Sidebar from "./navigation/sidebar";

export default function Layout ()
{
    return (
        <div className = "flex max-h-screen w-full gap-x-2">
            <aside className = "sidebar-Container h-screen w-1/6 bg-[#D9D9D9] px-4 py-8">
                <Sidebar />
            </aside>

            <div className = "content-Container w-5/6 h-screen flex flex-col gap-y-4 p-4 ">
                <div className = "h-1/16">
                    <TopTab />
                </div>
                <div className = "activityArea-Container bg-[#D9D9D9] flex h-15/16 rounded-md p-4">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};