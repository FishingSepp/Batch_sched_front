import React, { useState } from "react";
import './App.css';
import createIcon from './create-icon.png';
import refreshIcon from './refresh-icon.png';
import editIcon from './edit-icon.png';
import deleteIcon from './delete-icon.png';
import Modal from "react-modal";
import CreateJobModal from "./CreateJobModal";
import EditJobModal from "./EditJobModal";




function App() {
  const [jobs, setJobs] = useState([
    { id: "133gd1", name: "Job test1", status: "Running" },
    { id: "2ge45", name: "Job bfgt2", status: "Completed" },
    { id: "3t54a", name: "lukas 3g", status: "Failed" },
    { id: "ger5e45", name: "marc f4", status: "Running" },
    { id: "f434", name: "timo 35", status: "Completed" },
    { id: "3f43", name: "benni 46", status: "Failed" },
    { id: "j876", name: "emil f7", status: "Running" },
    { id: "k987r5", name: "alex h328", status: "Completed" },
    { id: "gh5", name: "christoph 2149", status: "Failed" },
    { id: "14g545z", name: "Jesus 69", status: "Running" },
    { id: "45334gf", name: "Beutlin 11", status: "Completed" },
    { id: "grsw5", name: "Hobbingen 12", status: "Failed" },
  ]);

  const MAX_JOBS_DISPLAYED = 10; // maximum number of jobs to display

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
    setDisplayedJobs(filteredJobs.slice(0, MAX_JOBS_DISPLAYED));
  };
  

  const handleSearchId = (event) => {
    const value = event.target.value;
    setSearchTermId(value);
    setSearchTermName("");
    setStatusFilter("All");
    if (value === "") {
      setDisplayedJobs([]);
    } else {
      const filteredJobs = jobs.filter((job) => 
        job.id.startsWith(value));
      setDisplayedJobs(filteredJobs.slice(0, MAX_JOBS_DISPLAYED));
    }
  };  

  const handleRefresh = () => {
    // Add code to refresh the job list here
  };

  const handleCreate = () => {
    // Add code to open the create job window here
    setCreateIsOpen(true);
  };

  const closeCreate = () => {
    setCreateIsOpen(false);
  };

  function handleEdit(id) {
    // Logic for handling edit
    setEditIsOpen(true);
  }

  const closeEdit = () => {
    setEditIsOpen(false);
  };
  
  function handleDelete(id) {
    // Logic for handling delete
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
                <div className="status-label-container" onClick={() => setStatusFilter("Running")}>
                  <input type="checkbox" id="running" value="Running" checked={statusFilter === "Running"} onChange={() => {}} />
                  <label htmlFor="running">Running</label>
                </div>
              </div>
              <div className="status-filter">
                <div className="status-label-container" onClick={() => setStatusFilter("Completed")}>
                  <input type="checkbox" id="completed" value="Completed" checked={statusFilter === "Completed"} onChange={() => {}} />
                  <label htmlFor="completed">Completed</label>
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
                    return job.id.toString().includes(searchTermId);
                  } else {
                    return true;
                  }
                })
                .map((job) => (
                  <tr key={job.id}>
                    <td><input type="checkbox" /></td>
                    <td>{job.id}</td>
                    <td>{job.name}</td>
                    <td>{job.status}</td>
                    <td>{job.lastRun}</td>           
                    <td>{job.nextRun}</td>
                    <td className="actions">
                      <button className="edit-btn" onClick={() => handleEdit(job.id)}>
                        <img src={editIcon} alt="edit icon" className="edit-icon" />
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(job.id)}>
                        <img src={deleteIcon} alt="delete icon" className="delete-icon" />
                      </button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CreateJobModal isOpen={createIsOpen} closeModal={closeCreate} />
        <EditJobModal isOpen={editIsOpen} closeModal={closeEdit} />

      </div>
      <div className="App-footer">
        <p>Batch Scheduler by Fishi</p>
      </div>
    </div>
  );
}

export default App;
