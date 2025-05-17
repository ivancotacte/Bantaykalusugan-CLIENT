import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Register from "@/pages/Register";
import HealthDashboard from "@/pages/HealthDashboard";

const Routes = () => {
    const routesForPublic = [
        { path: "/register", element: <Register /> },
        { path: "/health-dashboard", element: <HealthDashboard /> },
    ];

    const router = createBrowserRouter([
        ...routesForPublic,
    ]);

    return <RouterProvider router={router} />;
};

export default Routes;