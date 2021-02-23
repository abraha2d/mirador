import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavbarBrand from "react-bootstrap/NavbarBrand";
import NavDropdown from "react-bootstrap/NavDropdown";
import NavItem from "react-bootstrap/NavItem";
import NavLink from "react-bootstrap/NavLink";

import { PersonFill } from "react-bootstrap-icons";

import { NavLink as Link } from "react-router-dom";

export const TopNav = () => {
  return (
    <Navbar bg="light" className="mb-3">
      <NavbarBrand href="/">Mirador</NavbarBrand>
      <Nav className={"flex-grow-1"}>
        <NavItem>
          <Link className="nav-link" to="/" exact>
            Live
          </Link>
        </NavItem>
        <NavItem>
          <Link className="nav-link" to="/playback">
            Playback
          </Link>
        </NavItem>
        <NavItem>
          <NavLink href="/admin/">Config</NavLink>
        </NavItem>
        <div className={"flex-grow-1"} />
        <NavDropdown
          id={"user"}
          title={
            <div className={"d-inline-flex align-items-center"}>
              <PersonFill />
              admin
            </div>
          }
          alignRight
        >
          <NavItem>
            <NavLink href="/accounts/logout/">Logout</NavLink>
          </NavItem>
        </NavDropdown>
      </Nav>
    </Navbar>
  );
};
