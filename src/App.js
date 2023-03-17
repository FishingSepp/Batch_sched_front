import React, { useState, useEffect } from "react";
import './App.css';
import createIcon from './create-icon.png';
import refreshIcon from './refresh-icon.png';
import editIcon from './edit-icon.png';
import deleteIcon from './delete-icon.png';
import Modal from "react-modal";
import CreateJobModal from "./CreateJobModal";
import EditJobModal from "./EditJobModal";
import cron from 'cron';
import cronstrue from 'cronstrue';
import cronParser from 'cron-parser';


const { CronJob } = cron;

function App() {
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState(null);


  useEffect(() => {
    fetch("http://localhost:8080/job")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setJobs(data);
      })
      .catch((error) => console.error("Error fetching jobs:", error));
  }, []);

  const [searchTermName, setSearchTermName] = useState("");
  const [searchTermId, setSearchTermId] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [displayedJobs, setDisplayedJobs] = useState([]);
  const [createIsOpen, setCreateIsOpen] = useState(false);
  const [editIsOpen, setEditIsOpen] = useState(false);


  function handleStatusFilter(event) {
    const value = event.target.value;

    if (value === "All") {
      setStatusFilter(["All"]);
    } else {
      const index = statusFilter.indexOf(value);
      if (index === -1) {
        setStatusFilter([...statusFilter, value]);
      } else {
        setStatusFilter(statusFilter.filter((item) => item !== value));
      }
    }
  }

  function calculateRunTimes(job) {
    const { start_date, cronExpression } = job;
  
    const lastRun = cronParser
      .parseExpression(cronExpression)
      .prev()
      .toISOString();
  
    const nextRun = cronParser
      .parseExpression(cronExpression)
      .next()
      .toISOString();
  
    return { lastRun, nextRun };
  }

  const handleSearchName = (event) => {
    const value = event.target.value;
    setSearchTermName(value);
    setSearchTermId("");
    setStatusFilter("All");
    if (value === "") {
      setDisplayedJobs([]);
      return;
    }
    const filteredJobs = jobs.filter((job) =>
      job.name.toLowerCase().startsWith(value.toLowerCase())
    );
    setDisplayedJobs(filteredJobs);
  };
  

  const handleSearchId = (event) => {
    const value = event.target.value;
    setSearchTermId(value);
    setSearchTermName("");
    setStatusFilter("All");
  };  

  const handleRefresh = () => {
  fetch("http://localhost:8080/job")
    .then((response) => response.json())
    .then((data) => {
      setJobs(data);
    })
    .catch((error) => console.error("Error fetching jobs:", error));
};

  const handleCreate = () => {
    setCreateIsOpen(true);
  };

  const closeCreate = () => {
    setCreateIsOpen(false);
  };

  function handleEdit(jobId) {
    setEditIsOpen(true);
    setJobId(jobId);
  }
  
  const closeEdit = () => {
    setEditIsOpen(false);
  };
  
  useEffect(() => {
    if (!createIsOpen && !editIsOpen) {
      fetch("http://localhost:8080/job")
        .then((response) => response.json())
        .then((data) => {
          setJobs(data);
        })
        .catch((error) => console.error("Error fetching jobs:", error));
    }
  }, [createIsOpen, editIsOpen]);
  

  function handleDelete(jobId) {
    const url = `http://localhost:8080/job/${jobId}`;
    fetch(url, { method: 'DELETE' })
      .then(response => {
        if (response.ok) {
          fetch("http://localhost:8080/job")
          .then((response) => response.json())
          .then((data) => {
            setJobs(data);
          })
          .catch((error) => console.error("Error fetching jobs:", error));
        } else {
          console.error(`Error deleting job with id ${jobId}: ${response.statusText}`);
        }
      })
      .catch(error => console.error(`Error deleting job with id ${jobId}: ${error}`));
  }
  

  return (
    <div className="App">
      <header className="App-header">
        <h1>Batch Scheduler</h1>
      </header>
      <div className="App-container">
        <div className="App-options">
        <div className="btn-container">
          <button className="create-btn" onClick={handleCreate}>
          <img src={createIcon} alt="create icon" className="create-icon" />
            <span>Create Job</span>
          </button>
          <button className="refresh-btn" onClick={handleRefresh}>
          <img src={refreshIcon} alt="refresh icon" className="refresh-icon" />
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
                <div className="status-label-container" onClick={() => setStatusFilter("All")}>
                  <input type="checkbox" id="all" value="All" checked={statusFilter === "All"} onChange={() => {}} />
                  <label htmlFor="all">All</label>
                </div>
              </div>
              <div className="status-filter">
                <div className="status-label-container" onClick={() => setStatusFilter("Enabled")}>
                  <input type="checkbox" id="enabled" value="Enabled" checked={statusFilter === "Enabled"} onChange={() => {}} />
                  <label htmlFor="enabled">Enabled</label>
                </div>
              </div>
              <div className="status-filter">
                <div className="status-label-container" onClick={() => setStatusFilter("Disabled")}>
                  <input type="checkbox" id="disabled" value="Disabled" checked={statusFilter === "Disabled"} onChange={() => {}} />
                  <label htmlFor="disabled">Disabled</label>
                </div>
              </div>
              <div className="status-filter">
                <div className="status-label-container" onClick={() => setStatusFilter("Succeeded")}>
                  <input type="checkbox" id="succeeded" value="Succeeded" checked={statusFilter === "Succeeded"} onChange={() => {}} />
                  <label htmlFor="succeeded">Succeeded</label>
                </div>
              </div>
              <div className="status-filter">
                <div className="status-label-container" onClick={() => setStatusFilter("Failed")}>
                  <input type="checkbox" id="failed" value="Failed" checked={statusFilter === "Failed"} onChange={() => {}} />
                  <label htmlFor="failed">Failed</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="App-list">
          <table>
            <thead>
              <tr className="table-headers">
                <th>Select</th>
                <th>ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>LastRun</th>
                <th>NextRun</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {jobs
                .filter((job) => {
                  if (statusFilter === "All") {
                    return true;
                  } else {
                    return job.status === statusFilter;
                  }
                })
                .filter((job) => {
                  if (searchTermName) {
                    return job.name.toLowerCase().includes(searchTermName.toLowerCase());
                  } else if (searchTermId) {
                    return job.job_id.toString().includes(searchTermId);
                  } else {
                    return true;
                  }
                })
                .map((job) => {
                  const { lastRun, nextRun } = calculateRunTimes(job);
                  return (
                    <React.Fragment key={job.job_id}>
                      <tr>
                        <td><input type="checkbox" /></td>
                        <td>{job.job_id}</td>
                        <td>{job.name}</td>
                        <td>{job.status ? 'Enabled' : 'Disabled'}</td>
                        <td>{lastRun ? new Date(lastRun).toLocaleString() : 'N/A'}</td>
                        <td>{nextRun ? new Date(nextRun).toLocaleString() : 'N/A'}</td>
                        <td className="actions">
                        <button className="edit-btn" onClick={() => handleEdit(job.job_id)}>  
                          <img src={editIcon} alt="edit icon" className="edit-icon" />
                        </button>
                          <button className="delete-btn" onClick={() => handleDelete(job.job_id)}>
                            <img src={deleteIcon} alt="delete icon" className="delete-icon" />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
            </tbody>

          </table>
        </div>

        <CreateJobModal isOpen={createIsOpen} closeModal={closeCreate} />
        <EditJobModal isOpen={editIsOpen} closeModal={closeEdit} jobId={jobId} />

      </div>
      <div className="App-footer">
        <p>Batch Scheduler by Fishi</p>
      </div>
    </div>
  );
}

export default App;
