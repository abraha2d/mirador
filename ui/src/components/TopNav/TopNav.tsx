import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavbarBrand from "react-bootstrap/NavbarBrand";
import NavDropdown from "react-bootstrap/NavDropdown";
import NavItem from "react-bootstrap/NavItem";
import NavLink from "react-bootstrap/NavLink";

import { PersonFill } from "react-bootstrap-icons";

export const TopNav = () => {
  return (
    <Navbar bg="light" className="mb-3">
      <NavbarBrand>Mirador</NavbarBrand>
      <Nav className={"flex-grow-1"}>
        <NavItem className={"text-nowrap"}>
          <NavLink active>Live View</NavLink>
        </NavItem>
        <NavItem className={"text-nowrap"}>
          <NavLink>Playback</NavLink>
        </NavItem>
        <NavItem className={"text-nowrap"}>
          <NavLink href="/admin/">Configuration</NavLink>
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
