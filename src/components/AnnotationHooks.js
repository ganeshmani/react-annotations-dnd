import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import T from "prop-types";
import compose from "../utils/compose";
import isMouseHovering from "../utils/isMouseHovering";
import defaultProps from "./defaultProps";
import Overlay from "./Overlay";
import withRelativeMousePos from "../utils/withRelativeMousePos";

import Point from "../components/Point/index";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const Container = styled.div`
  clear: both;
  position: relative;
  width: 100%;
  &:hover ${Overlay} {
    opacity: 1;
  }
  touch-action: ${props => (props.allowTouch ? "pinch-zoom" : "auto")};
`;

const Img = styled.img`
  display: block;
  width: 100%;
`;

const DroppableContainer = styled.div`
  display: block;
  width: 100%;
`;

const Items = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`;

const DraggableContainer = styled.div`
  z-index: 999999;
`;

const Target = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`;
export default compose(
  isMouseHovering(),
  withRelativeMousePos()
)(props => {
  console.log("props", props);
  let container;
  const [state, setState] = useState({
    activeAnnotation: {},
    Annotations: [],
    draggingAnnotationsCoordinates: {
      x: "",
      y: ""
    },
    isDragging: false
  });

  const targetRef = useRef(null);

  useEffect(() => {
    if (props.allowTouch) {
      addTargetTouchEventListeners();
    } else {
      removeTargetTouchEventListeners();
    }
  }, []);

  const setInnerRef = el => {
    container = el;
    props.relativeMousePos.innerRef(el);
    props.innerRef(el);
  };

  const getSelectorByType = type => {
    return props.selectors.find(s => s.TYPE === type);
  };

  const getTopAnnotationAt = (x, y) => {
    const { annotations } = props;
    //   const { container, getSelectorByType } = this;

    if (!container) return;

    const intersections = annotations
      .map(annotation => {
        const { geometry } = annotation;
        const selector = getSelectorByType(geometry.type);

        return selector.intersects({ x, y }, geometry, container)
          ? annotation
          : false;
      })
      .filter(a => !!a)
      .sort((a, b) => {
        const aSelector = getSelectorByType(a.geometry.type);
        const bSelector = getSelectorByType(b.geometry.type);

        return (
          aSelector.area(a.geometry, container) -
          bSelector.area(b.geometry, container)
        );
      });

    return intersections[0];
  };

  const onTargetMouseMove = e => {
    props.relativeMousePos.onMouseMove(e);
    onMouseMove(e);
  };

  const onTargetMouseDown = e => {
    e.stopPropagation();

    // this.props.relativeMousePos.onMouseMove(e);
    // this.onMouseDown(e);
    return false;
  };
  const onTargetTouchMove = e => {
    props.relativeMousePos.onTouchMove(e);
    onTouchMove(e);
  };

  const onTargetMouseLeave = e => {
    props.relativeMousePos.onMouseLeave(e);
  };
  const onTargetTouchLeave = e => {
    props.relativeMousePos.onTouchLeave(e);
  };

  const onMouseMove = e => callSelectorMethod("onMouseMove", e);
  const onTouchStart = e => callSelectorMethod("onTouchStart", e);
  const onTouchEnd = e => callSelectorMethod("onTouchEnd", e);
  const onTouchMove = e => callSelectorMethod("onTouchMove", e);

  const onMouseUp = e => {
    e.preventDefault();
    e.stopPropagation();

    let elemX, elemY;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.x;
    const offsetY = e.clientY - rect.y;

    elemX = (offsetX / rect.width) * 100;
    elemY = (offsetY / rect.height) * 100;

    setState({
      ...state,
      draggingAnnotationsCoordinates: { x: elemX, y: elemY }
    });

    return false;
  };

  const onClick = e => {
    if (state.isDragging) {
      setState({ ...state, isDragging: false });
    } else {
      const activeAnnotation = getTopAnnotationAt(
        props.relativeMousePos.x,
        props.relativeMousePos.y
      );

      if (activeAnnotation) {
        if (Object.keys(state.activeAnnotation).length === 0) {
          setState({ activeAnnotation: activeAnnotation });
        } else {
          setState({ activeAnnotation: {} });
        }
      } else {
        if (props.disableAnnotation) {
          return;
        }
        const selector = getSelectorByType(props.type);
        if (selector && selector.methods["onClick"]) {
          const value = selector.methods["onClick"](props.value, e);

          if (typeof value === "undefined") {
            if (process.env.NODE_ENV !== "production") {
              console.error(`
                    ${methodName} of selector type ${props.type} returned undefined.
                    Make sure to explicitly return the previous state
                  `);
            }
          } else {
            props.onChange(value);
          }
        }
      }
    }
  };

  const addTargetTouchEventListeners = () => {
    // Safari does not recognize touch-action CSS property,
    // so we need to call preventDefault ourselves to stop touch from scrolling
    // Event handlers must be set via ref to enable e.preventDefault()
    // https://github.com/facebook/react/issues/9809

    targetRef.current.ontouchstart = onTouchStart;
    targetRef.current.ontouchend = onTouchEnd;
    targetRef.current.ontouchmove = onTargetTouchMove;
    targetRef.current.ontouchcancel = onTargetTouchLeave;
  };

  const removeTargetTouchEventListeners = () => {
    targetRef.current.ontouchstart = undefined;
    targetRef.current.ontouchend = undefined;
    targetRef.current.ontouchmove = undefined;
    targetRef.current.ontouchcancel = undefined;
  };

  const onSubmit = () => {
    props.onSubmit(props.value);
  };

  const onDragStart = () => {
    setState({ activeAnnotation: {}, isDragging: true });
  };

  const callSelectorMethod = (methodName, e) => {
    if (props.disableAnnotation) {
      return;
    }

    if (!!props[methodName]) {
      props[methodName](e);
    } else {
      const selector = getSelectorByType(props.type);
      if (selector && selector.methods[methodName]) {
        const value = selector.methods[methodName](props.value, e);

        if (typeof value === "undefined") {
          if (process.env.NODE_ENV !== "production") {
            console.error(`
                ${methodName} of selector type ${props.type} returned undefined.
                Make sure to explicitly return the previous state
              `);
          }
        } else {
          props.onChange(value);
        }
      }
    }
  };

  const onDragEnd = result => {
    targetRef.current.onClick = undefined;
    const updatedAnnotations = props.annotations.map(annotation => {
      if (annotation.data.id == parseFloat(result.draggableId)) {
        annotation.geometry = {
          ...annotation.geometry,
          x: state.draggingAnnotationsCoordinates.x,
          y: state.draggingAnnotationsCoordinates.y
        };
      }

      return annotation;
    });

    setState({
      ...state,
      draggingAnnotationsCoordinates: { x: "", y: "" }
    });
    console.log("updatedAnnotations", updatedAnnotations);
    props.onDragEnd(updatedAnnotations);
  };

  const shouldAnnotationBeActive = (annotation, top) => {
    if (props.activeAnnotations) {
      const isActive = !!props.activeAnnotations.find(active =>
        props.activeAnnotationComparator(annotation, active)
      );

      return isActive || top === annotation;
    } else {
      return top === annotation;
    }
  };

  const {
    isMouseHovering,

    renderHighlight,
    renderContent,
    renderSelector,
    renderEditor,
    renderOverlay,
    allowTouch
  } = props;

  const topAnnotationAtMouse = getTopAnnotationAt(
    props.relativeMousePos.x,
    props.relativeMousePos.y
  );

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <Container
        style={props.style}
        innerRef={isMouseHovering.innerRef}
        onMouseLeave={onTargetMouseLeave}
        onTouchCancel={onTargetTouchLeave}
        allowTouch={allowTouch}
      >
        <Droppable droppableId="IMAGE">
          {provided => (
            <DroppableContainer
              innerRef={provided.innerRef}
              {...provided.droppableProps}
            >
              <Img
                className={props.className}
                style={props.style}
                alt={props.alt}
                src={props.src}
                innerRef={setInnerRef}
                // draggable={false}
              />
              <Items
                innerRef={targetRef}
                onClick={onClick}
                // onMouseUp={this.onMouseUp}
                onMouseDown={onTargetMouseDown}
                onMouseMove={onTargetMouseMove}
                onMouseUp={onMouseUp}
              >
                {props.annotations.map((annotation, index) => (
                  <Draggable
                    index={index}
                    draggableId={`${annotation.data.id}`}
                  >
                    {provided => {
                      const style = {
                        position: "absolute",
                        top: `${annotation.geometry.y}%`,
                        left: `${annotation.geometry.x}%`,
                        ...provided.draggableProps.style
                      };
                      return (
                        <div
                          key={index}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={style}
                        >
                          <Point
                            key={index}
                            annotation={annotation}
                            active={shouldAnnotationBeActive(
                              annotation,
                              topAnnotationAtMouse
                            )}
                          />
                        </div>
                      );
                    }}
                  </Draggable>
                ))}
                {!props.disableSelector &&
                  props.value &&
                  props.value.geometry &&
                  renderSelector({
                    annotation: props.value
                  })}
              </Items>
              {provided.placeholder}
            </DroppableContainer>
          )}
        </Droppable>
        {/* {!props.disableOverlay &&
          renderOverlay({
            type: props.type,
            annotation: props.value
          })} */}
        {props.annotations.map(
          annotation =>
            shouldAnnotationBeActive(annotation, state.activeAnnotation) &&
            renderContent({
              key: annotation.data.id,
              annotation: annotation
            })
        )}
        {!props.disableEditor &&
          props.value &&
          props.value.selection &&
          props.value.selection.showEditor &&
          renderEditor({
            annotation: props.value,
            onChange: props.onChange,
            onSubmit: onSubmit
          })}
        <div>{props.children}</div>
      </Container>
    </DragDropContext>
  );
});

// export default AnnotationHooks;
