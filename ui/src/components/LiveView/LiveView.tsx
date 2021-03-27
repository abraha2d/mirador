import { useContext, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import { CameraSidebar, ControlBar, StreamContainer } from "components";
import { Context } from "components/Store";

import "./LiveView.css";

export const LiveView = () => {
  const [{ gridSize, streams }] = useContext(Context);
  const [isDragging, setDragging] = useState(false);
  const handle = useFullScreenHandle();
  return (
    <Container fluid className="flex-grow-1 d-flex flex-column">
      <Row className="flex-grow-1">
        <Col className="live-view-sidebar">
          <CameraSidebar showTrash={isDragging} />
        </Col>
        <Col className="h-100">
          <FullScreen
            handle={handle}
            className="d-flex flex-column justify-content-center"
          >
            <div
              className={`live-view-container ${
                handle.active ? "" : "bg-dark border-top border-left"
              }`}
            >
              {[...Array(4).keys()].map((i) =>
                [...Array(4).keys()].map((j) => (
                  <StreamContainer
                    key={`${j}${i}`}
                    gridSide={Math.sqrt(gridSize)}
                    x={j}
                    y={i}
                    stream={
                      i < gridSize && j < gridSize
                        ? streams.get(Math.sqrt(gridSize) * i + j)
                        : undefined
                    }
                    onDrag={setDragging}
                    fullscreenHandle={handle}
                  />
                ))
              )}
            </div>
            <ControlBar fullscreenHandle={handle} />
          </FullScreen>
        </Col>
      </Row>
    </Container>
  );
};
