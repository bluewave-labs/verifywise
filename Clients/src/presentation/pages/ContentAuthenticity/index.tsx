/**
 * @fileoverview Content Authenticity Main Page
 *
 * Main entry point for the Content Authenticity module.
 * Renders child routes via Outlet.
 *
 * @module pages/ContentAuthenticity
 */

import { Outlet } from "react-router-dom";

export default function ContentAuthenticity() {
  return <Outlet />;
}
