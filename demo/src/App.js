import React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import styled from "styled-components";

import Root from "./components/Root";

import Threaded from "./components/Threaded";

const Main = styled.main`
  margin: 0 16px;
  margin-top: 51px;
`;

const Container = styled.div`
  margin: 0 auto;
  padding-top: 16px;
  padding-bottom: 64px;
  max-width: 700px;
`;

export default () => (
  <Container>
    <Threaded />
  </Container>
);
