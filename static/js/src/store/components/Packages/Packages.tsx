import { useEffect, useRef } from "react";
import { useQuery } from "react-query";
import { useSearchParams } from "react-router-dom";
import {
  Strip,
  Row,
  Col,
  Pagination,
  Button,
} from "@canonical/react-components";
import { CharmCard, LoadingCard } from "@canonical/store-components";

import Banner from "../Banner";
import { Package, Publisher } from "../../types";

function Packages() {
  const ITEMS_PER_PAGE = 12;

  const getData = async () => {
    const response = await fetch(`/store.json`);
    const data = await response.json();

    const packagesWithId = data.packages.map((item: string[]) => {
      return {
        ...item,
        id: crypto.randomUUID(),
      };
    });
    return {
      total_items: data.total_items,
      total_pages: data.total_pages,
      packages: packagesWithId,
    };
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = searchParams.get("page") || "1";
  const { data, status, refetch, isFetching } = useQuery("data", getData);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const searchSummaryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    refetch();
  }, [searchParams]);

  const firstResultNumber = (parseInt(currentPage) - 1) * ITEMS_PER_PAGE + 1;
  const lastResultNumber =
    (parseInt(currentPage) - 1) * ITEMS_PER_PAGE + data?.packages.length;
  return (
    <>
      <Banner searchRef={searchRef} searchSummaryRef={searchSummaryRef} />
      <Strip>
        <Row>
          <Col size={12}>
            {data?.packages && data?.packages.length > 0 && (
              <div className="u-fixed-width" ref={searchSummaryRef}>
                {searchParams.get("q") ? (
                  <p>
                    Showing {currentPage === "1" ? "1" : firstResultNumber} to{" "}
                    {lastResultNumber} of {data?.total_items} results for{" "}
                    <strong>"{searchParams.get("q")}"</strong>.{" "}
                    <Button
                      appearance="link"
                      onClick={() => {
                        searchParams.delete("q");
                        searchParams.delete("page");
                        setSearchParams(searchParams);

                        if (searchRef.current) {
                          searchRef.current.value = "";
                        }
                      }}
                    >
                      Clear search
                    </Button>
                  </p>
                ) : (
                  <p>
                    Showing {currentPage === "1" ? "1" : firstResultNumber} to{" "}
                    {lastResultNumber} of {data?.total_items} items
                  </p>
                )}
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
                data.packages.map(
                  (packageData: {
                    package: Package;
                    publisher: Publisher;
                    id: string;
                  }) => (
                    <Col
                      size={3}
                      style={{ marginBottom: "1.5rem" }}
                      key={packageData.id}
                    >
                      <CharmCard data={packageData} />
                    </Col>
                  )
                )}

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
