import { Strip, Row, Col } from "@canonical/react-components";

function Banner() {
  return (
    <Strip type="dark">
      <Row>
        <Col size={6} className="col-start-large-4">
          <h1 className="p-heading--2">
            The Ubuntu-based
            <br />
            container images store
          </h1>
        </Col>
      </Row>
    </Strip>
  );
}

export default Banner;
