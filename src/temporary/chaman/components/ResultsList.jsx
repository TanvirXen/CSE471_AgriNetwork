// ResultsList.jsx — AgriNetwork Bangladesh
// Container for list of search results

import ResultCard from "./ResultCard";

function ResultsList({ results, selectedId, onSelectResult }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            <div className="sm-results-header">
                <div className="sm-results-count">
                    Showing <span>{results.length}</span> entities
                </div>
                <select className="sm-sort-select">
                    <option>Rating (Highest)</option>
                    <option>Price (Low to High)</option>
                    <option>Distance (Closest)</option>
                </select>
            </div>

            <div className="sm-results-list">
                {results.length > 0 ? (
                    results.map((item) => (
                        <ResultCard
                            key={item.id}
                            item={item}
                            isSelected={selectedId === item.id}
                            onClick={onSelectResult}
                        />
                    ))
                ) : (
                    <div className="sm-no-results">
                        <div className="sm-no-results__icon">🏜️</div>
                        <div className="sm-no-results__title">No results found</div>
                        <div className="sm-no-results__sub">
                            Try adjusting your filters or searching for something else.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResultsList;
