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

  const lazyLoad = (path) => async () => {
    const module = await import(/* @vite-ignore */path);
    return { Component: module.default };
  };

  let router = createBrowserRouter([
    {
      path: "/admin",
      element: <ProtectedRoutes user={!isAdmin} redirect="/admin/dashboard" />,
      children: [
        {
          path: "",
          lazy: lazyLoad("./pages/admin/AdminAuth"),
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
          lazy: lazyLoad("./pages/admin/Dashboard"),
        },
        {
          path: "users",
          lazy: lazyLoad("./pages/admin/Users"),
        },
        {
          path: "messages",
          lazy: lazyLoad("./pages/admin/Messages"),
        },
        {
          path: "groups",
          lazy: lazyLoad("./pages/admin/Groups"),
        },
      ]
    },
    {
      path: "/auth",
      element: <ProtectedRoutes user={!user} redirect="/" />,
      children: [
        {
          path: "",
          lazy: lazyLoad("./pages/Auth"),
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
          lazy: lazyLoad("./pages/Home"),
        },
        {
          path: "chat/:chatId",
          lazy: lazyLoad("./pages/Chat"),
        },
      ]
    },
    {
      path: '*',
      lazy: lazyLoad("./pages/PageNotFound"),
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

  // return <div onContextMenu={e => e.preventDefault()}><RouterProvider router={router} /></div>
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

