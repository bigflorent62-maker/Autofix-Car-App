/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIDiagnosis from './pages/AIDiagnosis';
import AdminDashboard from './pages/AdminDashboard';
import BookAppointment from './pages/BookAppointment';
import Chat from './pages/Chat';
import Home from './pages/Home';
import MyAppointments from './pages/MyAppointments';
import SearchWorkshops from './pages/SearchWorkshops';
import WorkshopDashboard from './pages/WorkshopDashboard';
import WorkshopDetail from './pages/WorkshopDetail';
import WorkshopRegister from './pages/WorkshopRegister';
import WorkshopSettings from './pages/WorkshopSettings';
import WriteReview from './pages/WriteReview';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIDiagnosis": AIDiagnosis,
    "AdminDashboard": AdminDashboard,
    "BookAppointment": BookAppointment,
    "Chat": Chat,
    "Home": Home,
    "MyAppointments": MyAppointments,
    "SearchWorkshops": SearchWorkshops,
    "WorkshopDashboard": WorkshopDashboard,
    "WorkshopDetail": WorkshopDetail,
    "WorkshopRegister": WorkshopRegister,
    "WorkshopSettings": WorkshopSettings,
    "WriteReview": WriteReview,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};