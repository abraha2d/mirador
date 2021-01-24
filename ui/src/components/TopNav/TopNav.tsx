import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavbarBrand from "react-bootstrap/NavbarBrand";
import NavDropdown from "react-bootstrap/NavDropdown";
import NavItem from "react-bootstrap/NavItem";
import NavLink from "react-bootstrap/NavLink";

import { NavLink as Link } from "react-router-dom";

import { PersonFill } from "react-bootstrap-icons";

export const TopNav = () => {
  return (
    <Navbar bg="light" className="mb-3">
      <NavbarBrand href="/">Mirador</NavbarBrand>
      <Nav className={"flex-grow-1"}>
        <NavItem>
          <NavLink>
            <Link to="/">Live</Link>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink>
            <Link to="/playback">Playback</Link>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="//localhost:7999/admin/">Config</NavLink>
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
            <NavLink>Logout</NavLink>
          </NavItem>
        </NavDropdown>
      </Nav>
    </Navbar>
  );
};
