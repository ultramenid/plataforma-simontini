import { Navigate, Route, Routes } from "react-router-dom";

import { MapPage } from "@/routes/MapPage";
import { ReportPage } from "@/routes/ReportPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/alert/:id" element={<ReportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}