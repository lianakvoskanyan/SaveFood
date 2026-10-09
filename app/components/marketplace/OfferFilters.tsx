import Link from "next/link";

type FilterOption = {
  _id: string;
  name: string | null;
  slug: string | null;
};

type OfferFiltersProps = {
  categories: FilterOption[];
  cities: string[];
  search?: string;
  category?: string;
  city?: string;
  sort?: string;
};

export function OfferFilters({
  categories,
  cities,
  search,
  category,
  city,
  sort,
}: OfferFiltersProps) {
  return (
    <form className="offer-filters" action="/explore" method="get">
      <label>
        <span>Search food or shop</span>
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Bakery, lunch, coffee..."
          maxLength={80}
        />
      </label>
      <label>
        <span>Category</span>
        <select name="category" defaultValue={category ?? ""}>
          <option value="">All categories</option>
          {categories.map((item) =>
            item.name && item.slug ? (
              <option key={item._id} value={item.slug}>
                {item.name}
              </option>
            ) : null,
          )}
        </select>
      </label>
      <label>
        <span>City</span>
        <select name="city" defaultValue={city ?? ""}>
          <option value="">All cities</option>
          {cities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Sort by</span>
        <select name="sort" defaultValue={sort ?? "pickup"}>
          <option value="pickup">Soonest pickup</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </select>
      </label>
      <div className="filter-actions">
        <button className="primary-link" type="submit">
          Find food <span aria-hidden="true">→</span>
        </button>
        {search || category || city || (sort && sort !== "pickup") ? (
          <Link className="reset-filters" href="/explore">
            Clear filters
          </Link>
        ) : null}
      </div>
    </form>
  );
}
