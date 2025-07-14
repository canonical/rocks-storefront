import { useQuery } from "react-query";
import { useSearchParams } from "react-router-dom";
import { Strip, Row, Col, Pagination, Button } from "@canonical/react-components";
import { RockCard, LoadingCard } from "@canonical/store-components";

import { Rock } from "../../types";

const ITEMS_PER_PAGE = 12;

interface IPackagesProps {
  packages?: Rock[],
  numOfTotalItems: number,
  isFetching: boolean,
  status: "success" | "idle" | "error" | "loading"
  currentPage: number,
  onPageChange: (pageNumber: number) => void
}

function Packages({ packages, numOfTotalItems, isFetching, status, currentPage, onPageChange }: IPackagesProps) {

  const firstResultNumber = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const lastResultNumber =
    (currentPage - 1) * ITEMS_PER_PAGE + (packages?.length || 0);

  const isPackageExist = packages && packages.length > 0
  const [searchParams, setSearchParams] = useSearchParams();

  const onClear = (): void => {
    searchParams.delete("q");
    searchParams.delete("page");
    setSearchParams(searchParams);
  };

  return (
    <Strip>
      <Row>
        <Col size={9} className="col-start-large-4">
          {isPackageExist && (
            <div className="u-fixed-width">
              {searchParams.get("q") ? <p>
                Showing {currentPage === 1 ? "1" : firstResultNumber} to{" "}
                {lastResultNumber} of {numOfTotalItems} items for {" "}
                <strong>"{searchParams.get("q")}"</strong>.{" "}
                <Button appearance="link" onClick={onClear}>
                  Clear search
                </Button>
              </p> : <p>
                Showing {currentPage === 1 ? "1" : firstResultNumber} to{" "}
                {lastResultNumber} of {numOfTotalItems} items
              </p>}

            </div>
          )
          }

          <Row>
            {isFetching &&
              [...Array(ITEMS_PER_PAGE)].map((_item, index) => (
                <Col size={3} key={index}>
                  <LoadingCard />
                </Col>
              ))}

            {!isFetching &&
              status === "success" &&
              isPackageExist &&
              packages.map((packageData: Rock) => (
                <Col
                  size={3}
                  style={{ marginBottom: "1.5rem" }}
                  key={packageData.id}
                >
                  <RockCard data={packageData} />
                </Col>
              ))}

            {status === "success" && packages?.length === 0 && (
              <h1 className="p-heading--2">No packages match this filter</h1>
            )}
          </Row>

          {status === "success" && isPackageExist && (
            <Pagination
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={numOfTotalItems}
              paginate={onPageChange}
              currentPage={currentPage}
              centered
              scrollToTop
            />
          )}
        </Col>
      </Row>
    </Strip>
  );
}

export default Packages;
