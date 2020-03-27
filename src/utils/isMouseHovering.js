import React, { PureComponent as Component } from "react";

const isMouseOverElement = ({ elem, e }) => {
  const { pageY, pageX } = e;
  const { left, right, bottom, top } = elem.getBoundingClientRect();
  // console.log("e", e.pageX, e.pageY);
  // console.log("elem X", elem.left, elem.right);
  // console.log("elem Y", elem.top, elem.bottom);
  return (
    pageX > left - 20 &&
    pageX < right + 20 &&
    pageY > top - 20 &&
    pageY < bottom + 20
  );
};

const isMouseHovering = (key = "isMouseHovering") => DecoratedComponent => {
  class IsMouseHovering extends Component {
    constructor() {
      super();

      this.state = {
        isHoveringOver: false
      };
    }

    componentDidMount() {
      document.addEventListener("mousemove", this.onMouseMove);
      document.addEventListener("mousedown", this.onMouseDown);
    }

    componentWillUnmount() {
      document.removeEventListener("mousemove", this.onMouseMove);
      document.removeEventListener("mousedown", this.onMouseDown);
    }

    onMouseMove = e => {
      const elem = this.el;
      this.setState({
        isHoveringOver: isMouseOverElement({ elem, e })
      });
    };

    // onMouseDown = e => {
    //   const elem = this.el;
    //   console.log("mouse clicked", isMouseOverElement({ elem, e }));
    //   this.setState({
    //     isHoveringOver: isMouseOverElement({ elem, e })
    //   });
    // };

    render() {
      const hocProps = {
        [key]: {
          innerRef: el => {
            console.log("hoc", el);
            return (this.el = el);
          },
          isHoveringOver: this.state.isHoveringOver
        }
      };

      return <DecoratedComponent {...this.props} {...hocProps} />;
    }
  }

  IsMouseHovering.displayName = `IsMouseHovering(${DecoratedComponent.displayName})`;

  return IsMouseHovering;
};

export default isMouseHovering;
