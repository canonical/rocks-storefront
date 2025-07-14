import { Button } from "@canonical/react-components";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

function SearchInput() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("q") || ""
  );

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (searchTerm) {
      searchParams.delete("page");
      searchParams.set("q", searchTerm);
      setSearchParams(searchParams);
    }
  };

  const onReset = (): void => {
    searchParams.delete("q");
    setSearchParams(searchParams);
    setSearchTerm("");
  };

  return (
    <form className="p-search-box" onSubmit={onSubmit}>
      <label className="u-off-screen" htmlFor="search">
        Search Rocks
      </label>
      <input
        type="search"
        id="search"
        className="p-search-box__input"
        name="q"
        placeholder="Search Rocks"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Button type="reset" className="p-search-box__reset" onClick={onReset}>
        <i className="p-icon--close">Close</i>
      </Button>
      <Button type="submit" className="p-search-box__button">
        <i className="p-icon--search">Search</i>
      </Button>
    </form>
  );
}

export default SearchInput;
