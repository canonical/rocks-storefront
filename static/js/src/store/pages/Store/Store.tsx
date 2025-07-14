import { useQuery } from "react-query";
import { useSearchParams } from "react-router-dom";
import Banner from "../../components/Banner";
import Packages from "../../components/Packages";
import { useRef } from "react";

function Store() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = searchParams.get("page") || "1";
    const queryString = searchParams.get("q") || "";

    const getData = async () => {
        let queryParam = `page=${currentPage}`

        if (queryString){
            queryParam += `&q=${queryString}` 
        }

        const response = await fetch(`/store.json?${queryParam}`);
        const data = await response.json();

        const packagesWithId = data.packages.map((item: string[]) => ({
            ...item,
            id: "test",
        }));

        return {
            totalItems: data.total_items,
            totalPages: data.total_pages,
            packages: packagesWithId,
        };
    };

    const { data, status, isFetching } = useQuery(["data", currentPage, queryString], getData);

    return (
        <>
            <Banner />
            <Packages 
                isFetching={isFetching} 
                numOfTotalItems={data?.totalItems} 
                status={status} 
                packages={data?.packages}
                onPageChange={(pageNumber) => {
                    searchParams.set("page", pageNumber.toString());
                    setSearchParams(searchParams);
                }}
                currentPage={parseInt(currentPage)}
            />
        </>
    );
}

export default Store;
