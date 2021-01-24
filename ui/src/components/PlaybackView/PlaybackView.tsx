import { Col, Container, Row } from "react-bootstrap";

import { CameraSidebar } from "../CameraSidebar";

import logo from "../../logo.svg";

export const PlaybackView = () => (
  <Container fluid className="flex-grow-1 d-flex flex-column">
    <Row className="flex-grow-1">
      <Col style={{ maxWidth: "16rem" }} className="pr-0 overflow-auto">
        <CameraSidebar />
      </Col>
      <Col className="h-100">
        <div className="live-container aspect-ratio--16x9">
          <div className="aspect-ratio__inner-wrapper d-flex align-items-center justify-content-center">
            <img src={logo} className="live" alt="spinner" />
          </div>
        </div>
        This is playback, bois!
      </Col>
    </Row>
  </Container>
);
