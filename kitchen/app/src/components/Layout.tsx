import { useEffect } from "react";
import { Nav, Navbar, Container } from "react-bootstrap";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../AuthContext";
import { useDemo } from "../DemoContext";
import { ROUTE_TITLES } from "../constants";

const DOCUMENT_TITLE_BASE = "ClawRecipes Kitchen";

export function Layout() {
  const { demoMode, setDemoMode } = useDemo();
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const title = ROUTE_TITLES[location.pathname];
    document.title = title ? `${title} – ${DOCUMENT_TITLE_BASE}` : DOCUMENT_TITLE_BASE;
  }, [location.pathname]);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <Navbar expand="md" className="border-bottom bg-body-tertiary">
        <Container fluid="lg">
          <Navbar.Brand className="fw-semibold text-body d-flex align-items-center gap-2" style={{ letterSpacing: "0.02em" }}>
            <img src="/favicon-32x32.png?v=2" alt="" width={28} height={28} className="navbar-brand-icon rounded" />
            ClawRecipes Kitchen
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="kitchen-navbar" />
          <Navbar.Collapse id="kitchen-navbar">
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/board" end>
                Board
              </Nav.Link>
              <Nav.Link as={NavLink} to="/recipes">
                Recipes
              </Nav.Link>
              <Nav.Link as={NavLink} to="/bindings">
                Bindings
              </Nav.Link>
            </Nav>
            <div className="d-flex align-items-center gap-2">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-outline-secondary btn-sm"
                >
                  Logout
                </button>
              )}
              {demoMode && (
                <>
                  <span className="badge bg-success">demo</span>
                  <button
                    type="button"
                    onClick={() => setDemoMode(false)}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    Exit demo
                  </button>
                </>
              )}
              <ThemeToggle />
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main id="main">
        <Outlet />
      </main>
    </>
  );
}
