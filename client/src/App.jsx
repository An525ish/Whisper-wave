import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './App.css'

let router = createBrowserRouter([
  {
    path: "/",
    lazy: async () => {
      let Home = await import("@/pages/Home")
      return { Component: Home.default }
    },
  }
]);

function App() {
  return <RouterProvider router={router} />;
}
export default App
