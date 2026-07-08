import { Navigate, Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MapPage } from "@/routes/MapPage";
import { ReportPage } from "@/routes/ReportPage";

export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ErrorBoundary label="Alert map">
            <MapPage />
          </ErrorBoundary>
        }
      />
      <Route
        path="/alert/:id"
        element={
          <ErrorBoundary label="Alert report">
            <ReportPage />
          </ErrorBoundary>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}