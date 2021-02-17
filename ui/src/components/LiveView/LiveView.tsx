import { Col, Container, Row } from "react-bootstrap";

import { CameraSidebar } from "components/CameraSidebar";
import { ControlBar } from "components/ControlBar";
import { StreamContainer } from "components/StreamContainer";

export const LiveView = () => (
  <Container fluid className="flex-grow-1 d-flex flex-column">
    <Row className="flex-grow-1">
      <Col style={{ maxWidth: "16rem" }} className="pr-0 overflow-auto">
        <CameraSidebar />
      </Col>
      <Col className="h-100">
        <div className="live-container aspect-ratio--16x9">
          <div className="aspect-ratio__inner-wrapper d-flex">
            <StreamContainer />
          </div>
        </div>
        <ControlBar />
      </Col>
    </Row>
  </Container>
);
