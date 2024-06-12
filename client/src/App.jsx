import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";
import './App.css'

let user = true;
let admin = true;

export const ProtectedRoutes = ({ user, children, redirect = '/auth' }) => {
  if (!user) return <Navigate to={redirect} />
  return children ? children : <Outlet />
}

let router = createBrowserRouter([
  {
    path: "/admin",
    element: <ProtectedRoutes user={!admin} redirect="/admin/dashboard" />,
    children: [
      {
        path: "",
        lazy: async () => {
          let AdminAuth = await import("@/pages/admin/AdminAuth")
          return { Component: AdminAuth.default }
        },
      },
    ]
  },
  {
    path: "/admin/*",
    element: <ProtectedRoutes user={admin} redirect="/admin" />,
    children: [
      {
        path: "dashboard",
        lazy: async () => {
          let Dashboard = await import("@/pages/admin/Dashboard")
          return { Component: Dashboard.default }
        },
      },
      {
        path: "users",
        lazy: async () => {
          let Users = await import("@/pages/admin/Users")
          return { Component: Users.default }
        },
      },
      {
        path: "messages",
        lazy: async () => {
          let Messages = await import("@/pages/admin/Messages")
          return { Component: Messages.default }
        },
      },
      {
        path: "groups",
        lazy: async () => {
          let Groups = await import("@/pages/admin/Groups")
          return { Component: Groups.default }
        },
      },
    ]
  },
  {
    path: "/auth",
    element: <ProtectedRoutes user={!user} redirect="/" />,
    children: [
      {
        path: "",
        lazy: async () => {
          let Auth = await import("@/pages/Auth")
          return { Component: Auth.default }
        },
      }
    ]
  },
  {
    path: "/",
    element: <ProtectedRoutes user={user} />,
    children: [
      {
        path: "/",
        lazy: async () => {
          let Home = await import("@/pages/Home")
          return { Component: Home.default }
        }
      },
      {
        path: "chat/:chatId",
        lazy: async () => {
          let Chat = await import("@/pages/Chat")
          return { Component: Chat.default }
        }
      },
    ]
  },
  {
    path: '*',
    lazy: async () => {
      let PageNotFound = await import("@/pages/PageNotFound")
      return { Component: PageNotFound.default }
    }
  }
]);

function App() {
  // return <div onContextMenu={e => e.preventDefault()}><RouterProvider router={router} /></div>
  return <RouterProvider router={router} />
}
export default App

