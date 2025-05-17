
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import TestDashboard from "@/pages/Test";
import RegisterPage from "@/pages/Register";

const Routes = () => {
    const routesForPublic = [
        { path: "/test", element: <TestDashboard /> },
        { path: "/register", element: <RegisterPage /> },
    ];

    const router = createBrowserRouter([
        ...routesForPublic,
    ]);

    return <RouterProvider router={router} />;
};

export default Routes;