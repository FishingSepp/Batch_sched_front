import React, {useState, useEffect} from "react";
import './App.css';
import createIcon from './create-icon.png';
import refreshIcon from './refresh-icon.png';
import infoIcon from './info-icon.png';
import editIcon from './edit-icon.png';
import deleteIcon from './delete-icon.png';
import Modal from "react-modal";
import JobModal from "./JobModal";
import InfoModal from "./InfoModal";
import cron from 'cron';
import cronstrue from 'cronstrue';
import cronParser from 'cron-parser';
import status1Icon from './status-1.png';
import status2Icon from './status-2.png';
import status3Icon from './status-3.png';
import status4Icon from './status-4.png';
import status5Icon from './status-5.png';

const {CronJob} = cron;

function App() {
    const [jobs, setJobs] = useState([]);
    const [originalJobs, setOriginalJobs] = useState([]);
    const [jobId, setJobId] = useState(null);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [searchTermName, setSearchTermName] = useState("");
    const [searchTermId, setSearchTermId] = useState("");
    const [statusFilter, setStatusFilter] = useState(["All"]);
    const [displayedJobs, setDisplayedJobs] = useState([]);
    const [JobModalIsOpen, setJobModalIsOpen] = useState(false);
    const [InfoModalIsOpen, setInfoModalIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [refreshCounter, setRefreshCounter] = useState(0);
    const [rotationDegrees, setRotationDegrees] = useState(0);

    const fetchLatestEndTimeAndStatus = async (jobId) => {
        try {
            const response = await fetch(`http://localhost:8080/execution/${jobId}`);
            if (!response.ok) {
                if (response.status !== 404) {
                    console.error(
                        `Error fetching executions for job ${jobId}: ${response.statusText}`
                    );
                }
                return {lastRun: null, status: null};
            }
            const executions = await response.json();
            const latestEndTime = executions.reduce((latest, execution) => {
                const endTime = new Date(execution.end_time);
                return endTime > latest
                    ? endTime
                    : latest;
            }, new Date(0));

            const executionStatus = calculateStatus(executions);
            return {lastRun: latestEndTime, executionStatus};
        } catch (error) {
            console.error(`Error fetching executions for job ${jobId}:`, error);
            return {lastRun: null, status: null};
        }
    };

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await fetch("http://localhost:8080/job");
                const data = await response.json();
                console.log(data);

                // Filter jobs
                const filtered = data
                    .filter((job) => {
                        if (statusFilter.includes("All")) {
                            return true;
                        } else {
                            return statusFilter.includes(
                                job.status
                                    ? "Enabled"
                                    : "Disabled"
                            );
                        }
                    })
                    .filter((job) => {
                        if (searchTermName) {
                            return job
                                .name
                                .toLowerCase()
                                .includes(searchTermName.toLowerCase());
                        } else if (searchTermId) {
                            return job
                                .job_id
                                .toString()
                                .includes(searchTermId);
                        } else {
                            return true;
                        }
                    });

                // Fetch last run times
                const withLastRunsAndStatus = await Promise.all(filtered.map(async (job) => {
                    const {lastRun, executionStatus} = await fetchLatestEndTimeAndStatus(job.job_id);
                    const {nextRun} = await calculateRunTimes(job);
                    return {
                        ...job,
                        lastRun,
                        nextRun,
                        executionStatus
                    };
                }));

                setFilteredJobs(withLastRunsAndStatus);

            } catch (error) {
                console.error("Error fetching jobs:", error);
            }
            setRefreshCounter(0)
        };

        fetchJobs();
    }, [statusFilter, searchTermName, searchTermId, refreshCounter]);

    const handleStatusToggle = (jobId, currentStatus) => {
      console.log("Toggling status for jobId:", jobId, "currentStatus:", currentStatus);
      const newStatus = !currentStatus;
      fetch(`http://localhost:8080/job/${jobId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })
        .then((response) => {
          if (response.ok) {
            console.log("Status updated successfully");
            setRefreshCounter((prevCounter) => prevCounter + 1);
          } else {
            console.error(`Error updating status for job ${jobId}: ${response.statusText}`);
          }
        })
        .catch((error) => console.error(`Error updating status for job ${jobId}:`, error));
    };
    

    const calculateStatus = (executions) => {
        const lastExecutions = executions.slice(-10);
        console.log(lastExecutions)
        const successfulExecutions = lastExecutions.filter(
            (execution) => execution.success === true
        );
        const successRate = successfulExecutions.length / lastExecutions.length;

        if (successRate >= 0.9) 
            return 1;
        if (successRate >= 0.7) 
            return 2;
        if (successRate >= 0.5) 
            return 3;
        if (successRate >= 0.3) 
            return 4;
        return 5;
    };

    const statusImages = {
        1: status1Icon,
        2: status2Icon,
        3: status3Icon,
        4: status4Icon,
        5: status5Icon
    };

    const handleSearchName = (event) => {
        const value = event.target.value;
        setSearchTermName(value);
        setSearchTermId("");
        setStatusFilter("All");
        if (value === "") {
            setDisplayedJobs([]);
            return;
        }
        const filteredJobs = jobs.filter(
            (job) => job.name.toLowerCase().startsWith(value.toLowerCase())
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
        setRotationDegrees((prevDegrees) => prevDegrees + 180);
        setRefreshCounter((prev) => prev + 1);
    };

    function calculateRunTimes(job) {
        const {start_date, cronExpression} = job;

        const options = {
            currentDate: new Date(start_date)
        };

        const nextRun = cronParser
            .parseExpression(cronExpression, options)
            .next()
            .toISOString();

        return {nextRun};
    }

    const handleInfo = (jobId) => {
        setInfoModalIsOpen(true);
        setJobId(jobId);
    };

    const handleCreate = () => {
        setJobModalIsOpen(true);
        setIsEditing(false);
    };

    function handleEdit(jobId) {
        setJobModalIsOpen(true);
        setIsEditing(true);
        setJobId(jobId);
    }

    const closeInfo = () => {
        setInfoModalIsOpen(false);
    };

    const closeCreate = () => {
        setJobModalIsOpen(false);
    };

    const closeEdit = () => {
        setJobModalIsOpen(false);
    };

    useEffect(() => {
        if (!JobModalIsOpen) {
            setRefreshCounter((prev) => prev + 1);
        }
    }, [JobModalIsOpen]);

    function handleDelete(jobId) {
        const url = `http://localhost:8080/job/${jobId}`;
        fetch(url, {method: 'DELETE'})
            .then(response => {
                if (response.ok) {
                    fetch("http://localhost:8080/job")
                        .then((response) => response.json())
                        .then((data) => {
                            setJobs(data);
                            setRefreshCounter((prev) => prev + 1);
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
                            <img src={createIcon} alt="create icon" className="create-icon"/>
                            <span>Create Job</span>
                        </button>
                        <button className="refresh-btn" onClick={handleRefresh}>
                            <img
                                src={refreshIcon}
                                alt="refresh icon"
                                className="refresh-icon"
                                style={{
                                    transform: `rotate(${rotationDegrees}deg)`,
                                    transition: 'transform 0.5s'
                                }}/>
                            <span>Refresh</span>
                        </button>

                    </div>

                    <div className="App-search-container">
                        <div className="App-search">
                            <input
                                type="text"
                                placeholder="Search by name"
                                value={searchTermName}
                                onChange={handleSearchName}/>
                        </div>
                        <div className="App-search">
                            <input
                                type="text"
                                placeholder="Search by ID"
                                value={searchTermId}
                                onChange={handleSearchId}/>
                        </div>
                    </div>
                    <div className="App-status">
                        <label>Filter by status:</label>
                        <div className="status-filters">
                            <div className="status-filter">
                                <div className="status-label-container" onClick={() => setStatusFilter("All")}>
                                    <input
                                        type="checkbox"
                                        id="all"
                                        value="All"
                                        checked={statusFilter.includes("All")}
                                        onChange={() => {}}/>
                                    <label htmlFor="all">All</label>
                                </div>
                            </div>
                            <div className="status-filter">
                                <div
                                    className="status-label-container"
                                    onClick={() => setStatusFilter("Enabled")}>
                                    <input
                                        type="checkbox"
                                        id="enabled"
                                        value="Enabled"
                                        checked={statusFilter.includes("Enabled")}
                                        onChange={() => {}}/>
                                    <label htmlFor="enabled">Enabled</label>
                                </div>
                            </div>
                            <div className="status-filter">
                                <div
                                    className="status-label-container"
                                    onClick={() => setStatusFilter("Disabled")}>
                                    <input
                                        type="checkbox"
                                        id="disabled"
                                        value="Disabled"
                                        checked={statusFilter.includes("Disabled")}
                                        onChange={() => {}}/>
                                    <label htmlFor="disabled">Disabled</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="App-list">
                    <table>
                        <thead>
                            <tr className="table-headers">
                                <th>ID</th>
                                <th>Name</th>
                                <th>Status</th>
                                <th>LastRun</th>
                                <th>NextRun</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="table-body">
                            {
                                filteredJobs.map((job) => (
                                    <React.Fragment key={job.job_id}>
                                        <tr onDoubleClick={() => handleInfo(job.job_id)}>
                                            <td>{job.job_id}</td>
                                            <td>{job.name}</td>
                                            <td>
                                                <span
                                                    className="status-text"
                                                    style={{
                                                        textDecoration: "underline",
                                                        cursor: "pointer"
                                                    }}
                                                    onClick={() => handleStatusToggle(job.job_id, job.status)}>
                                                    {
                                                        job.status
                                                            ? "Enabled"
                                                            : "Disabled"
                                                    }
                                                </span>
                                            </td>
                                            <td>
                                                <span className="last-run-date">
                                                    {
                                                        job.lastRun
                                                            ? new Date(job.lastRun).toLocaleString()
                                                            : "N/A"
                                                    }
                                                </span>
                                                {
                                                    job.executionStatus && <img
                                                            className="status-img"
                                                            src={statusImages[job.executionStatus]}
                                                            alt={`Status ${job.executionStatus}`}/>
                                                }
                                            </td>
                                            <td>{
                                                    job.nextRun
                                                        ? new Date(job.nextRun).toLocaleString()
                                                        : "N/A"
                                                }</td>
                                            <td className="actions">
                                                <div className="button-container">
                                                    <button className="info-btn" onClick={() => handleInfo(job.job_id)}>
                                                        <img src={infoIcon} alt="info icon" className="info-icon"/>
                                                    </button>
                                                    <button className="edit-btn" onClick={() => handleEdit(job.job_id)}>
                                                        <img src={editIcon} alt="edit icon" className="edit-icon"/>
                                                    </button>
                                                    <button className="delete-btn" onClick={() => handleDelete(job.job_id)}>
                                                        <img src={deleteIcon} alt="delete icon" className="delete-icon"/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))
                            }
                        </tbody>

                    </table>
                </div>

                <JobModal
                    isOpen={JobModalIsOpen}
                    closeModal={() => {
                        closeCreate();
                        closeEdit();
                    }}
                    isEditing={isEditing}
                    jobId={jobId}/>

                <InfoModal
                    isOpen={InfoModalIsOpen}
                    closeModal={() => {
                        closeInfo();
                    }}
                    jobId={jobId}/>

            </div>
            <div className="App-footer">
                <p>Batch Scheduler by Fishi</p>
            </div>
        </div>
    );
}

export default App;
