import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";
import './App.css'

let user = false;

export const ProtectedRoutes = ({ user, children, redirect = '/auth' }) => {
  if (!user) return <Navigate to={redirect} />
  return children ? children : <Outlet />
}

let router = createBrowserRouter([
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
        path: "chat",
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
  return <RouterProvider router={router} />;
}
export default App

