import { Strip, Row, Col } from "@canonical/react-components";
import SearchInput from "../SearchInput";

import type { RefObject } from "react";

type Props = {
  searchRef?: RefObject<HTMLInputElement>;
};

function Banner({ searchRef }: Props) {
  return (
    <Strip type="dark">
      <Row>
        <Col size={6} className="col-start-large-4">
          <h1 className="p-heading--2">
            The Ubuntu-based
            <br />
            container images store
          </h1>
          <SearchInput 
            searchRef={searchRef}
          />
        </Col>
      </Row>
    </Strip>
  );
}

export default Banner;
