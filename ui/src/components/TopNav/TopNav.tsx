import React from "react";
import {
  Nav,
  Navbar,
  NavbarBrand,
  NavDropdown,
  NavItem,
  NavLink,
} from "react-bootstrap";
import { ClockHistory, PersonFill } from "react-bootstrap-icons";
import { NavLink as Link } from "react-router-dom";

export const TopNav = () => {
  return (
    <Navbar bg="light" className="mb-3 px-3">
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
