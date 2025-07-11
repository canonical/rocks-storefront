import { useQuery } from "react-query";
import { useSearchParams } from "react-router-dom";
import { Strip, Row, Col, Pagination } from "@canonical/react-components";
import { RockCard, LoadingCard } from "@canonical/store-components";

import Banner from "../Banner";
import { Rock } from "../../types";

function Packages() {
  const ITEMS_PER_PAGE = 12;
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = searchParams.get("page") || "1";

  const getData = async () => {
    const response = await fetch(`/store.json?page=${currentPage}`);
    const data = await response.json();

    const packagesWithId = data.packages.map((item: string[]) => ({
      ...item,
      id: crypto.randomUUID(),
    }));

    return {
      total_items: data.total_items,
      total_pages: data.total_pages,
      packages: packagesWithId,
    };
  };

  const { data, status, isFetching } = useQuery(["data", currentPage], getData);

  const firstResultNumber = (parseInt(currentPage) - 1) * ITEMS_PER_PAGE + 1;
  const lastResultNumber =
    (parseInt(currentPage) - 1) * ITEMS_PER_PAGE + (data?.packages.length || 0);

  return (
    <>
      <Banner />
      <Strip>
        <Row>
          <Col size={9} className="col-start-large-4">
            {data?.packages && data?.packages.length > 0 && (
              <div className="u-fixed-width">
                <p>
                  Showing {currentPage === "1" ? "1" : firstResultNumber} to{" "}
                  {lastResultNumber} of {data?.total_items} items
                </p>
              </div>
            )}

            <Row>
              {isFetching &&
                [...Array(ITEMS_PER_PAGE)].map((_item, index) => (
                  <Col size={3} key={index}>
                    <LoadingCard />
                  </Col>
                ))}

              {!isFetching &&
                status === "success" &&
                data.packages.length > 0 &&
                data.packages.map((packageData: Rock) => (
                  <Col
                    size={3}
                    style={{ marginBottom: "1.5rem" }}
                    key={packageData.id}
                  >
                    <RockCard data={packageData} />
                  </Col>
                ))}

              {status === "success" && data.packages.length === 0 && (
                <h1 className="p-heading--2">No packages match this filter</h1>
              )}
            </Row>

            {status === "success" && data.packages.length > 0 && (
              <Pagination
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={data.total_items}
                paginate={(pageNumber) => {
                  searchParams.set("page", pageNumber.toString());
                  setSearchParams(searchParams);
                }}
                currentPage={parseInt(currentPage)}
                centered
                scrollToTop
              />
            )}
          </Col>
        </Row>
      </Strip>
    </>
  );
}

export default Packages;
