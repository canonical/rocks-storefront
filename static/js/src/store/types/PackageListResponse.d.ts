import Rock from "./Rock"

type PackageListResponse = {
    packages: Rock[],
    total_items: number
}

export default PackageListResponse