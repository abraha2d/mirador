import React from "react";
import { Col, Container, Row } from "react-bootstrap";

import { CameraSidebar } from "./components/CameraSidebar";
import { TopNav } from "./components/TopNav";

import logo from "./logo.svg";
import "./App.css";

function App() {
  return (
    <div className="App h-100 d-flex flex-column">
      <TopNav />
      <Container fluid className={"flex-grow-1 d-flex flex-column"}>
        <Row className={"flex-grow-1"}>
          <Col xs={2} className={"h-100 pr-0"}>
            <CameraSidebar />
          </Col>
          <Col className={"h-100"}>
            <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center live-container">
              <img src={logo} className="live" alt="spinner" />
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;
