import React, { useState, useEffect } from "react";
import "../styles/AppList.css";
import infoIcon from "../icons/info-icon.png";
import editIcon from "../icons/edit-icon.png";
import deleteIcon from "../icons/delete-icon.png";
import sortIcon from "../icons/sort.png";
import status1Icon from "../icons/status-1.png";
import status2Icon from "../icons/status-2.png";
import status3Icon from "../icons/status-3.png";
import status4Icon from "../icons/status-4.png";
import status5Icon from "../icons/status-5.png";
import cronParser from "cron-parser";
import { MdClose } from "react-icons/md";

const AppList = ({
  statusFilter,
  searchTermName,
  searchTermId,
  calculateRunTimes,
  openConfirmDialog,
  refreshCounter,
  setRefreshCounter,
  setJobModalIsOpen,
  setIsEditing,
  setInfoModalIsOpen,
  jobId,
  setJobId,
  JobModalIsOpen,
}) => {
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "asc",
  });

  function handleEdit(jobId) {
    setJobModalIsOpen(true);
    setIsEditing(true);
    setJobId(jobId);
  }

  const handleInfo = (jobId) => {
    setInfoModalIsOpen(true);
    setJobId(jobId);
  };

  //update job list after closing jobmodal to see edit/create result
  useEffect(() => {
    if (!JobModalIsOpen) {
      setRefreshCounter((prev) => prev + 1);
    }
  }, [JobModalIsOpen]);

  // get last exec and stat of job by id
  const fetchLatestEndTimeAndStatus = (id) => {
    return fetch(`http://localhost:8080/execution/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((executions) => {
        if (executions.length === 0) {
          return { lastRun: null, status: null };
        }
        const latestEndTime = executions.reduce((latest, execution) => {
          const endTime = new Date(execution.endTime);
          return endTime > latest ? endTime : latest;
        }, new Date(0));

        const executionStatus = calculateStatus(executions);
        return { lastRun: latestEndTime, executionStatus };
      })
      .catch((error) => {
        console.error(`Error fetching executions for job ${id}:`, error);
        return { lastRun: null, status: null };
      });
  };

  // fetch jobs again after changes currently triggering 3 times when initial
  // load.. expecting error with refreshCounter but couldnt pin it down
  useEffect(() => {
    const fetchJobs = () => {
      fetch("http://localhost:8080/job")
        .then((response) => response.json())
        .then((data) => {
          //filter all fetched jobs
          const filtered = data
            .filter((job) => {
              if (statusFilter.includes("All")) {
                return true;
              }
              return statusFilter.includes(job.status ? "Enabled" : "Disabled");
            })
            .filter((job) => {
              if (searchTermName) {
                return job.name
                  .toLowerCase()
                  .includes(searchTermName.toLowerCase());
              }
              if (searchTermId) {
                return job.id.toString().includes(searchTermId);
              }
              return true;
            });

          return Promise.all(
            filtered.map((job) => {
              return fetchLatestEndTimeAndStatus(job.id).then(
                ({ lastRun, executionStatus }) => {
                  if (job.status) {
                    return calculateRunTimes(job).then(({ nextRun }) => {
                      return {
                        ...job,
                        lastRun,
                        nextRun,
                        executionStatus,
                      };
                    });
                  } else {
                    return {
                      ...job,
                      lastRun,
                      nextRun: null,
                      executionStatus,
                    };
                  }
                }
              );
            })
          );
        })
        .then((withLastRunsAndStatus) => {
          setFilteredJobs(withLastRunsAndStatus);
        })
        .catch((error) => {
          console.error("Error fetching jobs:", error);
        });
    };

    fetchJobs();
    const interval = setInterval(() => {
      fetchJobs();
    }, 10 * 1000);
    return () => clearInterval(interval);
  }, [statusFilter, searchTermName, searchTermId, refreshCounter]);

  // enable/disable seperated to not send complete job like in jobmodal only for status
  const handleStatusToggle = (jobId, currentStatus) => {
    const newStatus = !currentStatus;
    fetch(`http://localhost:8080/job/${jobId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newStatus),
    })
      .then((response) => {
        if (response.ok) {
          //console.log("Status updated successfully");
          setRefreshCounter((prevCounter) => prevCounter + 1);
        } else {
          console.error(
            `Error updating status for job ${jobId}: ${response.statusText}`
          );
        }
      })
      .catch((error) =>
        console.error(`Error updating status for job ${jobId}:`, error)
      );
  };

  //sort icon next to table header that dictates the sort
  const renderSortIcon = (key) => {
    if (sortConfig.key === key) {
      const rotation = sortConfig.direction === "asc" ? "0deg" : "180deg";
      return (
        <img
          src={sortIcon}
          alt="sort"
          style={{
            width: "15px",
            filter: "invert(100%)",
            transform: `rotate(${rotation})`,
          }}
        />
      );
    }
    return null;
  };

  // set sort config asc or desc
  // sort without boolean because with extra state etc I ran into asynch sorting problems
  //const sortBy = (key) => {
  //if (sortConfig.key === key) {
  //  setAsc(!asc);
  //}
  //setSortConfig({ key, direction: asc ? 'asc' : 'desc' });
  //};
  // seems like setAsc(!asc) wouldnt be immediately changing asc, so first clicks on sort dont work
  const sortBy = (key) => {
    let direction = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  // sort jobs by table header + asc/desc
  const sortedJobs = React.useMemo(() => {
    return filteredJobs.slice().sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "name") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredJobs, sortConfig]);

  // weather indicator like in jenkins, values to be adjusted?
  const calculateStatus = (executions) => {
    const lastExecutions = executions.slice(-10);
    const successfulExecutions = lastExecutions.filter(
      (execution) => execution.success === true
    );
    const successRate = successfulExecutions.length / lastExecutions.length;

    // 1 = good, 5 = bad
    if (successRate >= 0.9) return 1;
    if (successRate >= 0.7) return 2;
    if (successRate >= 0.5) return 3;
    if (successRate >= 0.3) return 4;
    return 5;
  };

  const statusImages = {
    1: status1Icon,
    2: status2Icon,
    3: status3Icon,
    4: status4Icon,
    5: status5Icon,
  };

  // delete job by id
  function handleDelete(jobToDelete) {
    setShowConfirmDialog(false);
    const url = `http://localhost:8080/job/${jobToDelete.id}`;
    fetch(url, { method: "DELETE" })
      .then((response) => {
        if (response.ok) {
          fetch("http://localhost:8080/job")
            .then((response) => response.json())
            .then((data) => {
              setJobs(data);
              setRefreshCounter((prev) => prev + 1);
            })
            .catch((error) => console.error("Error fetching jobs:", error));
        } else {
          console.error(
            `Error deleting job with id ${jobId}: ${response.statusText}`
          );
        }
      })
      .catch((error) =>
        console.error(`Error deleting job with id ${jobId}: ${error}`)
      );
  }

  //run time with nextrun in fut
  function calculateRunTimes(job) {
    const { startDate, cronExpression } = job;
    const options = {
      currentDate: new Date(),
      tz: "UTC",
    };

    const nextRun = cronParser
      .parseExpression(cronExpression, options)
      .next()
      .toDate();
    if (nextRun >= new Date(startDate)) {
      return Promise.resolve({ nextRun: nextRun.toISOString() });
    }

    options.currentDate = new Date(startDate);
    const nextValidRun = cronParser
      .parseExpression(cronExpression, options)
      .next()
      .toDate();

    return Promise.resolve({ nextRun: nextValidRun.toISOString() });
  }

  function openConfirmDialog() {
    setShowConfirmDialog(true);
  }

  // limit size of name field in applist. limited to oneline with 24, limited to 2 lines with 50 for example
  function trimName(name, maxLength) {
    if (name.length > maxLength) {
      return name.substring(0, maxLength) + "...";
    } else {
      return name;
    }
  }

  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (e.target === document.querySelector(".confirmation-dialog")) {
        setShowConfirmDialog(false);
      }
    };

    if (showConfirmDialog) {
      window.addEventListener("click", closeOnOutsideClick);
    }

    return () => {
      window.removeEventListener("click", closeOnOutsideClick);
    };
  }, [showConfirmDialog]);

  return (
    <div className="App-list">
      <table>
        <thead>
          <tr className="table-headers">
            <th onClick={() => sortBy("id")}>ID {renderSortIcon("id")}</th>
            <th onClick={() => sortBy("name")}>
              Name {renderSortIcon("name")}
            </th>
            <th onClick={() => sortBy("status")}>
              Status {renderSortIcon("status")}
            </th>
            <th onClick={() => sortBy("lastRun")}>
              LastRun {renderSortIcon("lastRun")}
            </th>
            <th onClick={() => sortBy("nextRun")}>
              NextRun {renderSortIcon("nextRun")}
            </th>
            <th style={{ cursor: "auto" }}></th>
          </tr>
        </thead>
        <tbody className="table-body">
          {sortedJobs.map((job) => (
            <React.Fragment key={job.id}>
              <tr onDoubleClick={() => handleInfo(job.id)}>
                <td>{job.id}</td>
                <td>{trimName(job.name, 24)}</td>
                <td>
                  <span
                    className="status-text"
                    style={{
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                    onClick={() => handleStatusToggle(job.id, job.status)}
                  >
                    {job.status ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td>
                  <span className="last-run-date">
                    {job.lastRun
                      ? new Date(job.lastRun).toLocaleString()
                      : "N/A"}
                  </span>
                  {job.executionStatus && (
                    <img
                      className="status-img"
                      src={statusImages[job.executionStatus]}
                      alt={`Status ${job.executionStatus}`}
                    />
                  )}
                </td>
                <td>
                  {job.status && job.nextRun
                    ? new Date(job.nextRun).toLocaleString()
                    : "N/A"}
                </td>

                <td className="actions">
                  <div className="button-container">
                    <button
                      className="info-btn"
                      onClick={() => handleInfo(job.id)}
                    >
                      <img
                        src={infoIcon}
                        alt="info icon"
                        className="info-icon"
                      />
                    </button>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(job.id)}
                    >
                      <img
                        src={editIcon}
                        alt="edit icon"
                        className="edit-icon"
                      />
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => {
                        openConfirmDialog();
                        setJobToDelete({ id: job.id, name: job.name });
                      }}
                    >
                      <img
                        src={deleteIcon}
                        alt="delete icon"
                        className="delete-icon"
                      />
                    </button>
                  </div>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {showConfirmDialog && (
        <div className="confirmation-dialog">
          <div className="confirmation-dialog-content">
            <button
              className="close-confirmation-dialog-button"
              style={{}}
              onClick={() => setShowConfirmDialog(false)}
            >
              <MdClose />
            </button>
            <p>Are you sure you want to delete this job?</p>
            {jobToDelete && (
              <>
                {" "}
                <p className="delete-info">
                  {" "}
                  Job ID :{" "}
                  <span className="delete-info-label">{jobToDelete.id}</span>
                </p>
                <p className="delete-info">
                  Job Name :{" "}
                  <span className="delete-info-label">{jobToDelete.name}</span>
                </p>
              </>
            )}
            <div className="confirmation-dialog-buttons">
              <button
                className="confirm-delete-button"
                onClick={() => handleDelete(jobToDelete)}
              >
                Delete job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppList;
