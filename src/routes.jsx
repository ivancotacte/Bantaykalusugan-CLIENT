
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import TestDashboard from "@/pages/Test";

const Routes = () => {
    const routesForPublic = [
        { path: "/test", element: <TestDashboard /> },
    ];

    const router = createBrowserRouter([
        ...routesForPublic,
    ]);

    return <RouterProvider router={router} />;
};

export default Routes;