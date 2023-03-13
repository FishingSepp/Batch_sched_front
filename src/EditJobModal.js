import React, {useState, useEffect} from "react";
import Modal from "react-modal";
import './EditJobModal.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const EditJobModal = ({isOpen, closeModal, jobId}) => {
    const [job, setJob] = useState({});
    const [jobName, setJobName] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [periodBegin, setPeriodBegin] = useState(null);
    const [periodEnd, setPeriodEnd] = useState(null);
    const [enabled, setEnabled] = useState(true);
    const [repeatInterval, setRepeatInterval] = useState("0");
    const [repeatUnit, setRepeatUnit] = useState("minute(s)");
    const [cronExpression, setCronExpression] = useState("");

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
                    console.log("periodBegin:", periodBegin);
                    setPeriodEnd(
                        data.end_date
                            ? new Date(Date.parse(data.end_date))
                            : null
                    );
                    console.log("periodEnd:", periodEnd);
                    
                    setEnabled(data.status);
                    const {repeatInterval, repeatUnit} = getCronParts(data.cronExpression);
                    setRepeatInterval(repeatInterval);
                    setRepeatUnit(repeatUnit);
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
            cronExpression: cronExpression
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

    const summary = () => {
        let summaryText = `Start on ${
          periodBegin
            ? periodBegin.toLocaleString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: false,
              })
            : ""
        }`;
        if (periodBegin) {
          if (repeatInterval > 0) {
            if (periodEnd) {
                summaryText += ` until ${periodEnd.toLocaleString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  hour12: false,
                })}`;
              }
              summaryText += ` and repeat every ${repeatInterval} ${repeatUnit}`;
            } else {
            summaryText += ` and execute once`;
          }
        }
        if (!periodBegin) {
          summaryText = "Please select a Period Begin.";
        }
        return summaryText;
      };
      

    // Parse the repeat interval and unit into a cron expression
    useEffect(() => {
        const newCronExpression = getCronExpression(repeatInterval, repeatUnit);
        setCronExpression(newCronExpression);
    }, [repeatInterval, repeatUnit]);

    function getCronExpression(repeatInterval, repeatUnit) {
        switch (repeatUnit) {
            case "minute(s)":
                if (repeatInterval === "0") {
                    return "* * * * *";
                } else {
                    return `*/${repeatInterval} * * * *`;
                }
            case "hour(s)":
                if (repeatInterval === "0") {
                    return "0 * * * *";
                } else {
                    return `0 */${repeatInterval} * * *`;
                }
            case "day(s)":
                if (repeatInterval === "0") {
                    return "0 0 * * *";
                } else {
                    return `0 0 */${repeatInterval} * *`;
                }
            case "week(s)":
                if (repeatInterval === "0") {
                    return "0 0 * * 0";
                } else {
                    return `0 0 * * 0#${repeatInterval}`;
                }
            case "month(s)":
                if (repeatInterval === "0") {
                    return "0 0 1 * *";
                } else {
                    return `0 0 1 */${repeatInterval} *`;
                }
            case "year(s)":
                if (repeatInterval === "0") {
                    return "0 0 1 1 *";
                } else {
                    return `0 0 1 1 */${repeatInterval}`;
                }
            default:
                return "";
        }
    }

    function getCronParts(cronExpression) {
        const cronFields = cronExpression.split(" ");
        const minuteField = cronFields[0];
        const hourField = cronFields[1];
        const dayField = cronFields[2];
        const monthField = cronFields[3];
        const yearField = cronFields[4];

        if (minuteField.startsWith("*/")) {
            return {repeatInterval: minuteField.substring(2), repeatUnit: "minute(s)"};
        }

        if (hourField.startsWith("*/")) {
            return {repeatInterval: hourField.substring(2), repeatUnit: "hour(s)"};
        }

        if (dayField.startsWith("*/")) {
            return {repeatInterval: dayField.substring(2), repeatUnit: "day(s)"};
        }

        if (yearField.startsWith("*/")) {
            return {repeatInterval: yearField.substring(2), repeatUnit: "month(s)"};
        }

        if (monthField.startsWith("*/")) {
            return {repeatInterval: monthField.substring(2), repeatUnit: "year(s)"};
        }

        return {repeatInterval: "0", repeatUnit: "minute(s)"};
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={closeModal}
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

                    </div>
                </div>

                <div className="detail-job-info">
                <div className="date-picker-container">
                    <label htmlFor="periodBegin">Period Begin:</label>
                    <DatePicker
                        className="date-picker"
                        selected={periodBegin}
                        onChange={(date) => setPeriodBegin(date)}
                        showTimeInput
                        timeInputLabel="Time:"
                        dateFormat="MMMM d, yyyy HH:mm"
                        minDate={new Date(Date.now() + 60 * 60 * 1000)} // only allow dates one hour in the future
                        minTime={new Date()}
                    />
                    <br/>
                    <label htmlFor="periodEnd">Period End:</label>
                    <DatePicker
                        className="date-picker"
                        selected={periodEnd}
                        onChange={(date) => setPeriodEnd(date)}
                        showTimeInput
                        timeInputLabel="Time:"
                        dateFormat="MMMM d, yyyy HH:mm"
                        minDate={periodBegin}
                    />
                    </div>

                    <div className="repeat-container">
                        <label htmlFor="repeatInterval">Repeat every:</label>
                        <input
                            type="number"
                            id="repeatInterval"
                            value={repeatInterval}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value) && value >= 0) {
                                    setRepeatInterval(value.toString());
                                }
                            }}/>
                        <select
                            id="repeatUnit"
                            value={repeatUnit}
                            onChange={(e) => setRepeatUnit(e.target.value)}>
                            <option value="minute(s)">minute(s)</option>
                            <option value="hour(s)">hour(s)</option>
                            <option value="day(s)">day(s)</option>
                            <option value="month(s)">month(s)</option>
                            <option value="year(s)">year(s)</option>
                        </select>
                        <div className="summary-container">
                            {summary()}
                        </div>
                        <div className="cron-expression-container">
                            Cron expression: {cronExpression}
                        </div>
                    </div>
                </div>
                <br/>
                <div className="footer-button-container">
                    <button type="submit"
                        //code for creating job
                    >Edit</button>
                    <button type="button" onClick={closeModal}>
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditJobModal;