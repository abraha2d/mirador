import React, { useContext, useLayoutEffect } from "react";
import {
  Button,
  Nav,
  Navbar,
  NavbarBrand,
  NavDropdown,
  NavItem,
  NavLink,
} from "react-bootstrap";
import { ClockHistory, Moon, PersonFill, Sun } from "react-bootstrap-icons";
import { NavLink as Link } from "react-router-dom";
import { Context } from "../Store";
import { SET_DARK_MODE } from "../Store/constants";

export const TopNav = () => {
  const [{ isDarkMode, colorMode }, dispatch] = useContext(Context);
  document.documentElement.setAttribute("data-bs-theme", colorMode);

  useLayoutEffect(() => {
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const darkModeListener = (evt: MediaQueryList | MediaQueryListEvent) =>
      dispatch?.({ type: SET_DARK_MODE, payload: evt.matches });
    darkModeListener(darkModeQuery);
    darkModeQuery.addEventListener("change", darkModeListener);
    return () => darkModeQuery.removeEventListener("change", darkModeListener);
  }, [dispatch]);

  const toggleDarkMode = () =>
    dispatch?.({ type: SET_DARK_MODE, payload: !isDarkMode });

  const DarkModeToggle = isDarkMode ? Moon : Sun;

  return (
    <Navbar bg={colorMode} className="mb-3 px-3">
      <NavbarBrand href="/">Mirador</NavbarBrand>
      <Nav className="flex-grow-1">
        <NavItem>
          <Link className="nav-link" to="/" exact>
            Live View
          </Link>
        </NavItem>
        <NavItem>
          <NavLink href="/admin/">Settings</NavLink>
        </NavItem>
        <div className="flex-grow-1" />
        <Button
          className="me-3 d-inline-flex align-items-center"
          variant={colorMode}
          onClick={toggleDarkMode}
        >
          <DarkModeToggle />
        </Button>
        <Navbar.Text className="me-2 d-inline-flex align-items-center">
          <ClockHistory className="me-2" />
          {process.env.REACT_APP_VERSION}
        </Navbar.Text>
        <NavDropdown
          id="user"
          title={
            <div className="d-inline-flex align-items-center">
              <PersonFill className="me-1" />
              admin
            </div>
          }
          align="end"
        >
          <NavItem>
            <NavLink href="/accounts/logout/">Logout</NavLink>
          </NavItem>
        </NavDropdown>
      </Nav>
    </Navbar>
  );
};
