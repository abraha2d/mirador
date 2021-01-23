import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavbarBrand from "react-bootstrap/NavbarBrand";
import NavbarCollapse from "react-bootstrap/NavbarCollapse";
import NavItem from "react-bootstrap/NavItem";
import NavLink from "react-bootstrap/NavLink";

export const TopNav = () => {
  return (
    <Navbar>
      <Container fluid>
        <NavbarBrand>Mirador</NavbarBrand>
        <NavbarCollapse>
          <Nav>
            <NavItem>
              <NavLink active>Live View</NavLink>
            </NavItem>
            <NavItem>
              <NavLink>Playback</NavLink>
            </NavItem>
            <NavItem>
              <NavLink>Configuration</NavLink>
            </NavItem>
          </Nav>
        </NavbarCollapse>
      </Container>
    </Navbar>
  );
};
