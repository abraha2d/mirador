import { useContext } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import { CameraSidebar } from "components/CameraSidebar";
import { ControlBar } from "components/ControlBar";
import { Context } from "components/Store";
import { StreamContainer } from "components/StreamContainer";

export const LiveView = () => {
  const [{ gridSize, streams }, dispatch] = useContext(Context);
  const handle = useFullScreenHandle();
  return (
    <Container fluid className="flex-grow-1 d-flex flex-column">
      <Row className="flex-grow-1">
        <Col style={{ maxWidth: "16rem" }} className="pr-0 overflow-auto">
          <CameraSidebar />
        </Col>
        <Col className="h-100">
          <FullScreen
            handle={handle}
            className={`d-flex flex-column justify-content-center${
              handle.active ? "" : " bg-dark"
            }`}
          >
            <div
              className={`aspect-ratio--16x9${
                handle.active ? "" : " border-bottom border-right"
              }`}
            >
              <div className="aspect-ratio__inner-wrapper d-flex flex-column">
                {[...Array(Math.sqrt(gridSize)).keys()].map((i) => (
                  <div
                    key={i}
                    className="d-flex"
                    style={{
                      width: "100%",
                      height: `${100 / Math.sqrt(gridSize)}%`,
                    }}
                  >
                    {[...Array(Math.sqrt(gridSize)).keys()].map((j) => (
                      <StreamContainer
                        key={Math.sqrt(gridSize) * i + j}
                        idx={Math.sqrt(gridSize) * i + j}
                        height="100%"
                        width={`${100 / Math.sqrt(gridSize)}%`}
                        stream={streams.get(Math.sqrt(gridSize) * i + j)}
                        isFullscreen={handle.active}
                        dispatch={dispatch}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <ControlBar fullscreenHandle={handle} />
          </FullScreen>
        </Col>
      </Row>
    </Container>
  );
};
