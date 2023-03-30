import React, {useState, useEffect} from "react";
import Modal from "react-modal";
import './JobModal.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import cronParser from 'cron-parser';
import cronstrue from 'cronstrue';
import {MdClose} from 'react-icons/md';
import { clear } from "@testing-library/user-event/dist/clear";

const JobModal = ({isOpen, closeModal, isEditing, jobId}) => {
    const [job, setJob] = useState({});
    const [jobName, setJobName] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [jobScript, setJobScript] = useState("");
    const [periodBegin, setPeriodBegin] = useState(null);
    const [periodEnd, setPeriodEnd] = useState(null);
    const [enabled, setEnabled] = useState(true);
    const [cronExpression, setCronExpression] = useState("");
    const [seconds, setSeconds] = useState("");
    const [minutes, setMinutes] = useState("");
    const [hours, setHours] = useState("");
    const [dayOfMonth, setDayOfMonth] = useState("");
    const [month, setMonth] = useState("");
    const [dayOfWeek, setDayOfWeek] = useState("");
    const [humanReadable, setHumanReadable] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [isValidCron, setIsValidCron] = useState(false);


    const clearInputFields = () => {
        setJobName("");
        setJobDescription("");
        setJobScript("");
        setPeriodBegin(null);
        setPeriodEnd(null);
        setEnabled(true);
        setCronExpression("");
        setSeconds("");
        setMinutes("");
        setHours("");
        setDayOfMonth("");
        setMonth("");
        setDayOfWeek("");
    };

    const handleSubmit = (event, isEditing) => {
        //when in creation mode -> post request
        if (!isEditing) {
            event.preventDefault();
        const jobData = {
            name: jobName,
            description: jobDescription,
            job_script: jobScript,
            start_date: periodBegin,
            end_date: periodEnd,
            status: enabled,
            cronExpression: `${seconds} ${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`
        };
        fetch("http://localhost:8080/job", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(jobData)
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                closeModal();
            })
            .catch((error) => console.error("Error creating job:", error));
        }

        //when in edit mode -> put request
        if (isEditing) {
            event.preventDefault();
        const jobData = {
            name: jobName,
            description: jobDescription,
            job_script: jobScript,
            start_date: periodBegin,
            end_date: periodEnd,
            status: enabled,
            cronExpression: `${seconds} ${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`
        };
        fetch(`http://localhost:8080/job/${jobId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(jobData)
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                closeModal();
            })
            .catch((error) => console.error("Error creating job:", error));
        }
        
    };

    useEffect(() => {
        if (jobId && isEditing) {
            fetch(`http://localhost:8080/job/${jobId}`)
                .then((response) => response.json())
                .then((data) => {
                    setJob(data);
                    console.log(data);
                    setJobName(data.name);
                    setJobDescription(data.description || "");
                    setJobScript(data.job_script || "");
                    setPeriodBegin(
                        data.start_date
                            ? new Date(Date.parse(data.start_date))
                            : null
                    );
                    setPeriodEnd(
                        data.end_date
                            ? new Date(Date.parse(data.end_date))
                            : null
                    );
                    
                    setEnabled(data.status);
                    setCronExpression(data.cronExpression)

                    const [seconds, minutes, hours, dayOfMonth, month, dayOfWeek] = splitCronExpression(data.cronExpression);
                    setSeconds(seconds);
                    setMinutes(minutes);
                    setHours(hours);
                    setDayOfMonth(dayOfMonth);
                    setMonth(month);
                    setDayOfWeek(dayOfWeek);
                })
                .catch((error) => console.error("Error fetching job:", error));
        }
        if (!isEditing) {
            clearInputFields()
        }
    }, [jobId, isEditing]);


    useEffect(() => {
        try {
          const parts = cronExpression.trim().split(/\s+/);
          if (parts.length === 6) {
            setSeconds(parts[0]);
            setMinutes(parts[1]);
            setHours(parts[2]);
            setDayOfMonth(parts[3]);
            setMonth(parts[4]);
            setDayOfWeek(parts[5]);
            cronstrue.toString(cronExpression);
            setHumanReadable('"' + cronstrue.toString(cronExpression) + '"');
          }
          else {
            setHumanReadable("Invalid cron expression");
          }
        } catch (err) {
            setHumanReadable('Invalid cron expression');
        }
    }, [cronExpression]);

    //add job_script as requi for isValid later on
    useEffect(() => {
        const isValid = (
            jobName !== "" && jobDescription !== "" && periodBegin !== null && seconds !== "" && minutes !== "" && hours !== "" && dayOfMonth !== "" && month !== "" && dayOfWeek !== "" && generateCronExpression() !== 'Invalid cron expression'
        );
        setIsValid(isValid);
    }, [
        jobName,
        jobDescription,
        periodBegin,
        seconds,
        minutes,
        hours,
        dayOfMonth,
        month,
        dayOfWeek
    ]);

    useEffect(() => {
        setIsValidCron(humanReadable !== "Invalid cron expression");
      }, [humanReadable]);


    useEffect(() => {
        const newCronExpression = generateCronExpression();
        setCronExpression(newCronExpression);
    }, [
        seconds,
        minutes,
        hours,
        dayOfMonth,
        month,
        dayOfWeek
    ]);

    function splitCronExpression(cronExpression) {
        const [seconds, minutes, hours, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');
        return [seconds, minutes, hours, dayOfMonth, month, dayOfWeek];
      }
      
      function generateCronExpression() {
        if (seconds !== "" && minutes !== "" && hours !== "" && dayOfMonth !== "" && month !== "" && dayOfWeek !== "") {
            try {
                const cronString = `${seconds} ${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
                cronParser.parseExpression(cronString);
                return cronString;
            } catch (err) {
              setHumanReadable("Invalid cron expression");
              return ("Invalid inputs")
            }
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={closeModal}
            contentLabel="Job Modal"
            style={{
                overlay: {
                    backgroundColor: 'rgba(44, 49, 58, 0.75)'
                },
                content: {
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '70%',
                    width: '70%',
                    backgroundColor: '#2c313a',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.25)'
                }
            }}>
            <div className="modal-header">
                <button
                    style={{
                        position: "absolute",
                        top: "2%",
                        right: "2%"
                    }}
                    onClick={closeModal}><MdClose/></button>
                <h1  style={{margin: "5rem 0 3rem 0"}}>{isEditing ? "Edit Job" : "Create New Job"}</h1>
            </div>
            
            <form onSubmit={handleSubmit}>
            <div className="job-script-container">
            <div className="job-script">
            <label htmlFor="job-script">Job:</label>
                            <div className="job-input">
                                <input
                                    type="text"
                                    id="job"
                                    value={jobScript}
                                    onChange={(e) => setJobScript(e.target.value)}
                                    placeholder="Job path and script to be executed"/>
                            </div>
            </div>
            <div className="space-holder"></div>
            </div>
            <div className="input-container">
                <div className="general-job-info">
                    <div className="input-row">
                    <label htmlFor="jobName">Name:</label>
                    <br />
                    <input
                        style={{ width: "55%" }}
                        type="text"
                        id="jobName"
                        value={jobName}
                        maxLength={50}
                        onChange={(e) =>
                        e.target.value.length <= 50 && setJobName(e.target.value)
                        }
                    />
                    </div>
                    <div className="input-row">
                    <label htmlFor="jobDescription">Description:</label>
                    <br />
                    <textarea
                        id="jobDescription"
                        value={jobDescription}
                        maxLength={200}
                        onChange={(e) =>
                        e.target.value.length <= 200 && setJobDescription(e.target.value)
                        }
                        rows="4"
                    />
                    </div>
                        <div className="date-picker-container">
                            <label htmlFor="periodBegin">Period Begin:</label>
                            <DatePicker className="date-picker" selected={periodBegin} onChange={(date) => setPeriodBegin(date)} showTimeInput="showTimeInput" timeInputLabel="Time:" dateFormat="MMMM d, yyyy HH:mm" minDate={new Date(Date.now())}
                                // only dates in future
                            />
                            <br/>
                            <label htmlFor="periodEnd">Period End:</label>
                            <DatePicker
                                className="date-picker"
                                selected={periodEnd}
                                onChange={(date) => setPeriodEnd(date)}
                                showTimeInput="showTimeInput"
                                timeInputLabel="Time:"
                                dateFormat="MMMM d, yyyy HH:mm"
                                minDate={periodBegin}/>
                        </div>

                    </div>
                </div>

                <div className="detail-job-info">

                    <div className="repeat-container">
                        <div className="small-time-container">
                            <label htmlFor="seconds">Seconds:</label>
                            <div className="cron-input-container">
                                <input
                                    type="text"
                                    id="seconds"
                                    value={seconds}
                                    onChange={(e) => setSeconds(e.target.value)}
                                    placeholder="*"/>
                            </div>
                            <label htmlFor="minutes">Minutes:</label>
                            <div className="cron-input-container">
                                <input
                                    type="text"
                                    id="minutes"
                                    value={minutes}
                                    onChange={(e) => setMinutes(e.target.value)}
                                    placeholder="*"/>
                            </div>
                            <label htmlFor="hours">Hours:</label>
                            <div className="cron-input-container">
                                <input
                                    type="text"
                                    id="hours"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    placeholder="*"/>
                            </div>
                        </div>
                        <div className="big-time-container">
                            <label htmlFor="dayOfMonth">Day of Month:</label>
                            <div className="cron-input-container">
                                <input
                                    type="text"
                                    id="dayOfMonth"
                                    value={dayOfMonth}
                                    onChange={(e) => setDayOfMonth(e.target.value)}
                                    placeholder="*"/>
                            </div>
                            <label htmlFor="month">Month:</label>
                            <div className="cron-input-container">
                                <input
                                    type="text"
                                    id="month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    placeholder="*"/>
                            </div>
                            <label htmlFor="dayOfWeek">Day of Week:</label>
                            <div className="cron-input-container">
                                <input
                                    type="text"
                                    id="dayOfWeek"
                                    value={dayOfWeek}
                                    onChange={(e) => setDayOfWeek(e.target.value)}
                                    placeholder="*"/>
                            </div>
                        </div>
                        <div className="cron-expression-container">
                            {
                                humanReadable === "Invalid cron expression"
                                    ? (
                                        <span>
                                            <span>Cron Expression:
                                            </span>
                                            <input
                                              type="text"
                                              id="cronExpression"
                                              value={cronExpression ? cronExpression : ""}
                                              onChange={(e) => setCronExpression(e.target.value)}
                                          />
                                        </span>
                                    )
                                    : (
                                        <span>
                                            <span>Cron Expression:
                                            </span>
                                            <input
                                              type="text"
                                              id="cronExpression"
                                              value={cronExpression ? cronExpression : ""}
                                              onChange={(e) => setCronExpression(e.target.value)}
                                          />
                                        </span>
                                    )
                            }
                        </div>
                        <div className="human-readable-container" style={{ color: humanReadable === 'Invalid cron expression' ? 'red' : '#ccc' }}>
                          {humanReadable}
                        </div>
                        
                    </div>
                </div>
                <br/>
            </form>
           
            <div className="footer-button-container">
                <button
                    type="submit"
                    disabled={!isValid || !isValidCron}
                    style={{ backgroundColor: (isValid && isValidCron) ? "white" : "#999" }}
                    onClick={(event) => handleSubmit(event, isEditing)}
                    >
                    {isEditing ? "Edit" : "Create"}
                </button>
            </div>
        </Modal>
    );
};

export default JobModal;
