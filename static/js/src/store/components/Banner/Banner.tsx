import { RefObject } from "react";
import { useSearchParams } from "react-router-dom";
import { Strip, Row, Col } from "@canonical/react-components";

type Props = {
  searchRef: RefObject<HTMLInputElement>;
  searchSummaryRef: RefObject<HTMLDivElement>;
};

function Banner({ searchRef }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <Strip type="dark">
      <Row>
        <Col size={6} className="col-start-large-4">
          <h1 className="p-heading--2">The Rocks Collection</h1>
          <form className="p-search-box" action="/all-search">
            <label className="u-off-screen" htmlFor="search">
              Search Rocks
            </label>
            <input
              type="search"
              id="search"
              className="p-search-box__input"
              name="q"
              placeholder="Search Rocks"
              defaultValue={searchParams.get("q") || ""}
              ref={searchRef}
            />
            <button
              type="reset"
              className="p-search-box__reset"
              onClick={() => {
                searchParams.delete("q");
                setSearchParams(searchParams);
              }}
            >
              <i className="p-icon--close">Close</i>
            </button>
            <button type="submit" className="p-search-box__button">
              <i className="p-icon--search">Search</i>
            </button>
          </form>
        </Col>
      </Row>
    </Strip>
  );
}

export default Banner;
