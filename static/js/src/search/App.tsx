import { Col, Row } from "@canonical/react-components";
import { CharmCard, LoadingCard } from "@canonical/store-components";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Package, Publisher } from "../store/types";

function App() {
  const search = new URLSearchParams(window.location.search).get("q");
  const [loading, setLoading] = useState(true);

  const [term, setTerm] = useState(search || "");

  const [results, setResults] = useState({
    rocks: [],
  });

  useEffect(() => {
    if (!search) return;
    fetch(`/all-search.json?q=${search}&limit=4`)
      .then((response) => response.json())
      .then((data) => {
        setResults(data);
        setLoading(false);
      });
  }, []);
  const { rocks } = results;

  return (
    <>
      <section id="search-docs" className="p-strip is-shallow">
        <div className="row">
          {search ? (
            <h1 className="p-heading--2">Search results for "{search}"</h1>
          ) : (
            <h1>Search Rocks</h1>
          )}
          <form className="p-search-box u-no-margin--bottom">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              type="search"
              className="p-search-box__input"
              name="q"
              placeholder="Search Rocks"
              required
            />
            <button type="reset" className="p-search-box__reset">
              <i className="p-icon--close">Reset</i>
            </button>
            <button type="submit" className="p-search-box__button">
              <i className="p-icon--search">Search</i>
            </button>
          </form>
        </div>
      </section>
      {search && (
        <div className="row">
          <section className="p-section">
            <h3>
              <a href={`/?q=${search}`}>Rocks &rsaquo;</a>
            </h3>
            <Row>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <Col size={3} style={{ marginBottom: "1.5rem" }} key={i}>
                    <LoadingCard />
                  </Col>
                ))
              ) : rocks.length ? (
                <>
                  <p>
                    Showing the top {rocks.length} results for "{search}"
                  </p>
                  {rocks.map(
                    (rock: {
                      package: Package;
                      publisher: Publisher;
                      id: string;
                    }) => (
                      <Col
                        size={3}
                        style={{ marginBottom: "1.5rem" }}
                        key={rock.package.name}
                      >
                        <p>{rock.package.name}</p>
                        <CharmCard data={rock} />
                      </Col>
                    )
                  )}
                </>
              ) : (
                <p>No rocks matching this search</p>
              )}
            </Row>
          </section>
        </div>
      )}
    </>
  );
}

const container = document.getElementById("main-content");
const root = createRoot(container as HTMLElement);
root.render(<App />);
