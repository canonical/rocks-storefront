import { Button } from "@canonical/react-components"
import { useSearchParams } from "react-router-dom";
import type { RefObject } from "react";


type Props = {
    searchRef?: RefObject<HTMLInputElement>;
};

function SearchInput({ searchRef }: Props) {
    const [searchParams, setSearchParams] = useSearchParams();

    const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        if (searchRef?.current && searchRef.current.value) {
            searchParams.delete("page");
            searchParams.set("q", searchRef.current.value);
            setSearchParams(searchParams);
        }
    };

    const onReset = (): void => {
        searchParams.delete("q");
        setSearchParams(searchParams);
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
                defaultValue={searchParams.get("q") || ""}
                ref={searchRef}
            />
            <Button type="reset" className="p-search-box__reset" onClick={onReset}>
                <i className="p-icon--close">Close</i>
            </Button>
            <Button type="submit" className="p-search-box__button">
                <i className="p-icon--search">Search</i>
            </Button>
        </form>
    )
}

export default SearchInput
