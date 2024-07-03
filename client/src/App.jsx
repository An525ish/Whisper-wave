import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";
import './App.css'
import AdminWrapper from "./layout/AdminWrapper";
import { useEffect } from "react";
import { getRequest } from "./utils/api";
import { useDispatch, useSelector } from "react-redux";
import { userExist, userNotExist } from "./redux/reducers/auth";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./hooks/socketContext";

function App() {
  const { user, isAdmin, loader } = useSelector(state => state.auth)
  const dispatch = useDispatch()

  const ProtectedRoutes = ({ user, children, redirect = '/auth' }) => {
    if (!user) return <Navigate to={redirect} />
    return children ? children : <Outlet />
  }

  let router = createBrowserRouter([
    {
      path: "/admin",
      element: <ProtectedRoutes user={!isAdmin} redirect="/admin/dashboard" />,
      children: [
        {
          path: "",
          lazy: async () => {
            const module = await import("@/pages/admin/AdminAuth");
            return { Component: module.default };
          },
        },
      ]
    },
    {
      path: "/admin/*",
      element:
        <ProtectedRoutes user={isAdmin} redirect="/admin" >
          <AdminWrapper />
        </ProtectedRoutes>,
      children: [
        {
          path: "dashboard",
          lazy: async () => {
            const module = await import("@/pages/admin/Dashboard");
            return { Component: module.default };
          },
        },
        {
          path: "users",
          lazy: async () => {
            const module = await import("@/pages/admin/Users");
            return { Component: module.default };
          },
        },
        {
          path: "messages",
          lazy: async () => {
            const module = await import("@/pages/admin/Messages");
            return { Component: module.default };
          },
        },
        {
          path: "groups",
          lazy: async () => {
            const module = await import("@/pages/admin/Groups");
            return { Component: module.default };
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
            const module = await import("@/pages/Auth");
            return { Component: module.default };
          },
        }
      ]
    },
    {
      path: "/",
      element:
        <SocketProvider>
          <ProtectedRoutes user={user} />
        </SocketProvider>,
      children: [
        {
          path: "/",
          lazy: async () => {
            const module = await import("@/pages/Home");
            return { Component: module.default };
          },
        },
        {
          path: "chat/:chatId",
          lazy: async () => {
            const module = await import("@/pages/Chat");
            return { Component: module.default };
          },
        },
      ]
    },
    {
      path: '*',
      lazy: async () => {
        const module = await import("@/pages/PageNotFound");
        return { Component: module.default };
      },
    }
  ]);

  const fetchUser = async () => {
    try {
      const res = await getRequest('/user/get-profile')
      if (res.success) dispatch(userExist(res.user))
    } catch (error) {
      dispatch(userNotExist())
    }
  }

  useEffect(() => {
    fetchUser()
  }, [dispatch])

  return (
    loader ? (
      <>Loading...</>
    ) : (
      <>
        <RouterProvider router={router} />
        <Toaster position="bottom-center" />
      </>
    )
  );
}

export default App