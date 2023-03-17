import React, {useState, useEffect} from "react";
import Modal from "react-modal";
import './EditJobModal.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import cronParser from 'cron-parser';
import cronstrue from 'cronstrue';


const EditJobModal = ({isOpen, closeModal, jobId}) => {
    const [job, setJob] = useState({});
    const [jobName, setJobName] = useState("");
    const [jobDescription, setJobDescription] = useState("");
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


    useEffect(() => {
        if (jobId) {
            fetch(`http://localhost:8080/job/${jobId}`)
                .then((response) => response.json())
                .then((data) => {
                    setJob(data);
                    console.log(data);
                    setJobName(data.name);
                    setJobDescription(data.description);
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
    }, [jobId]);
    

    const handleSubmit = (event) => {
        event.preventDefault();
        const jobData = {
            name: jobName,
            description: jobDescription,
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
    };
      

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
      

    // Generate the cron expression whenever the input fields change
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

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => {
                closeModal();
              }}
            contentLabel="Edit Job Modal"
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
            <h1>Edit Job</h1>
            <form onSubmit={handleSubmit}>
            <div className="input-container">
                    <div className="general-job-info">
                        <div className="input-row">
                            <label htmlFor="jobName">Name:</label>
                            <br/>
                            <input
                                type="text"
                                id="jobName"
                                value={jobName}
                                onChange={(e) => setJobName(e.target.value)}/>
                        </div>
                        <div className="input-row">
                            <label htmlFor="jobDescription">Description:</label>
                            <br/>
                            <textarea id="jobDescription" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows="5"
                                // Number of visible lines
                            />
                        </div>
                        <div className="date-picker-container">
                            <label htmlFor="periodBegin">Period Begin:</label>
                            <DatePicker className="date-picker" selected={periodBegin} onChange={(date) => setPeriodBegin(date)} showTimeInput="showTimeInput" timeInputLabel="Time:" dateFormat="MMMM d, yyyy HH:mm" minDate={new Date(Date.now() + 60 * 60 * 1000)}
                                // only allow dates one hour in the future
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
                                            <span
                                                style={{
                                                    color: '#ccc'
                                                }}>Cron Expression:
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
                                            <span
                                                style={{
                                                    color: '#ccc'
                                                }}>Cron Expression:
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
                    onClick={handleSubmit}
                    >Edit
                </button>

                <button
                    type="button"
                    onClick={() => {
                        closeModal();
                    }}>
                    Cancel
                </button>
            </div>
        </Modal>
    );
};

export default EditJobModal;