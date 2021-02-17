import logo from "logo.svg";

type StreamContainerProps = {
  width: string;
  height: string;
};

export const StreamContainer = ({ width, height }: StreamContainerProps) => (
  <div
    className="d-flex justify-content-center border-top border-left"
    style={{ width, height }}
  >
    <img src={logo} className="live w-100 h-100" />
  </div>
);
