import React, { useState } from "react";
import "../styles/AppOptions.css";
import createIcon from "../icons/create-icon.png";
import refreshIcon from "../icons/refresh-icon.png";

const AppOptions = ({
  searchTermName,
  searchTermId,
  statusFilter,
  setSearchTermName,
  setSearchTermId,
  setStatusFilter,
  setRefreshCounter,
  setJobModalIsOpen,
  setIsEditing,
}) => {
  const [rotationDegrees, setRotationDegrees] = useState(0);

  const handleCreate = () => {
    setJobModalIsOpen(true);
    setIsEditing(false);
  };

  //three setters to clear other filters/search fields on the go
  //optional functionality, can be changed depending on whats wanted
  const handleSearchName = (event) => {
    const value = event.target.value;
    setSearchTermName(value);
    setSearchTermId("");
    setStatusFilter("All");
  };

  const handleSearchId = (event) => {
    const value = event.target.value;
    setSearchTermId(value);
    setSearchTermName("");
    setStatusFilter("All");
  };

  const handleRefresh = () => {
    setRotationDegrees((prevDegrees) => prevDegrees + 180);
    setRefreshCounter((prev) => prev + 1);
  };

  return (
    <div className="App-options">
      <div className="btn-container">
        <button className="create-btn" onClick={handleCreate}>
          <img src={createIcon} alt="create icon" className="create-icon" />
          <span>Create Job</span>
        </button>
        <button className="refresh-btn" onClick={handleRefresh}>
          <img
            src={refreshIcon}
            alt="refresh icon"
            className="refresh-icon"
            style={{
              transform: `rotate(${rotationDegrees}deg)`,
              transition: "transform 0.5s",
            }}
          />
          <span>Refresh</span>
        </button>
      </div>

      <div className="App-search-container">
        <div className="App-search">
          <input
            type="text"
            placeholder="Search by name"
            value={searchTermName}
            onChange={handleSearchName}
          />
        </div>
        <div className="App-search">
          <input
            type="text"
            placeholder="Search by ID"
            value={searchTermId}
            onChange={handleSearchId}
          />
        </div>
      </div>
      <div className="App-status">
        <label>Filter by status:</label>
        <div className="status-filters">
          <div className="status-filter">
            <div
              className="status-label-container"
              onClick={() => setStatusFilter("All")}
            >
              <input
                type="checkbox"
                id="all"
                value="All"
                checked={statusFilter.includes("All")}
                onChange={() => {}}
              />
              <label htmlFor="all">All</label>
            </div>
          </div>
          <div className="status-filter">
            <div
              className="status-label-container"
              onClick={() => setStatusFilter("Enabled")}
            >
              <input
                type="checkbox"
                id="enabled"
                value="Enabled"
                checked={statusFilter.includes("Enabled")}
                onChange={() => {}}
              />
              <label htmlFor="enabled">Enabled</label>
            </div>
          </div>
          <div className="status-filter">
            <div
              className="status-label-container"
              onClick={() => setStatusFilter("Disabled")}
            >
              <input
                type="checkbox"
                id="disabled"
                value="Disabled"
                checked={statusFilter.includes("Disabled")}
                onChange={() => {}}
              />
              <label htmlFor="disabled">Disabled</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppOptions;
