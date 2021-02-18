import { Stream } from "components/Store/types";

import logo from "logo.svg";

type StreamContainerProps = {
  width: string;
  height: string;
  stream?: Stream;
};

export const StreamContainer = ({
  width,
  height,
  stream,
}: StreamContainerProps) => (
  <div
    className="d-flex flex-column align-items-center justify-content-center border-top border-left"
    style={{ width, height }}
  >
    {stream && (
      <>
        <span className="text-light">ID: {stream.id}</span>
        <span className="text-light">URL: {stream.url}</span>
        <img src={logo} className="live w-50 h-50" alt="" />
      </>
    )}
  </div>
);
