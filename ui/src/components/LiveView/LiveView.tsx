import { useContext, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import { CameraSidebar } from "components/CameraSidebar";
import { ControlBar } from "components/ControlBar";
import { Context } from "components/Store";
import { StreamContainer } from "components/StreamContainer";

export const LiveView = () => {
  const [{ gridSize, streams }, dispatch] = useContext(Context);
  const [isDragging, setDragging] = useState(false);
  const handle = useFullScreenHandle();
  return (
    <Container fluid className="flex-grow-1 d-flex flex-column">
      <Row className="flex-grow-1">
        <Col style={{ maxWidth: "16rem" }} className="pr-0 overflow-auto">
          <CameraSidebar showTrash={isDragging} />
        </Col>
        <Col className="h-100">
          <FullScreen
            handle={handle}
            className={`d-flex flex-column justify-content-center`}
          >
            <div
              className={`aspect-ratio--16x9${
                handle.active ? "" : " border-top border-left bg-dark"
              }`}
            >
              <div className="aspect-ratio__inner-wrapper d-flex flex-column overflow-hidden">
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
                      dispatch={dispatch}
                      onDrag={setDragging}
                      fullscreenHandle={handle}
                    />
                  ))
                )}
              </div>
            </div>
            <ControlBar fullscreenHandle={handle} />
          </FullScreen>
        </Col>
      </Row>
    </Container>
  );
};
