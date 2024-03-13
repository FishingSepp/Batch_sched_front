import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import "../styles/JobModal.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/custom-datepicker.css";
import cronParser from "cron-parser";
import cronstrue from "cronstrue";
import { MdClose } from "react-icons/md";

const JobModal = ({ isOpen, isEditing, jobId, setJobModalIsOpen }) => {
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
  const [humanReadable, setHumanReadable] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isValidCron, setIsValidCron] = useState(false);
  const [originalJob, setOriginalJob] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const closeModal = () => {
    setJobModalIsOpen(false);
  };

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
    event.preventDefault();
    if (!isEditing) {
      let trimmedJobScript = jobScript.trim();
      if (trimmedJobScript === "") trimmedJobScript = null;
      const jobData = {
        name: jobName,
        description: jobDescription,
        command: trimmedJobScript,
        startDate: periodBegin,
        endDate: periodEnd,
        status: enabled,
        cronExpression: `${seconds} ${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`,
      };
      fetch("http://localhost:8080/job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      })
        .then((response) => response.json())
        .then((data) => {
          //console.log(data);
          closeModal();
        })
        .catch((error) => console.error("Error creating job:", error));
    }

    //when in edit mode -> put request
    if (isEditing) {
      setShowConfirmDialog(false);
      let trimmedJobScript = jobScript.trim();
      if (trimmedJobScript === "") trimmedJobScript = null;
      const jobData = {
        name: jobName,
        description: jobDescription,
        command: trimmedJobScript,
        startDate: periodBegin,
        endDate: periodEnd,
        status: enabled,
        cronExpression: `${seconds} ${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`,
      };
      fetch(`http://localhost:8080/job/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      })
        .then((response) => response.json())
        .then((data) => {
          //console.log(data);
          closeModal();
        })
        .catch((error) => console.error("Error creating job:", error));

      // check for executions of job
      fetch(`http://localhost:8080/execution/${jobId}`)
        .then((response) => response.json())
        .then((executions) => {
          if (executions.length > 0) {
            // delete executions of old job by id
            const url = `http://localhost:8080/execution/job/${jobId}`;
            fetch(url, { method: "DELETE" })
              .then((response) => {
                if (response.ok) {
                  fetch("http://localhost:8080/execution")
                    .then((response) => response.json())
                    .catch((error) =>
                      console.error("Error fetching jobs:", error)
                    );
                } else {
                  console.error(
                    `Error deleting executions of job with id ${jobId}: ${response.statusText}`
                  );
                }
              })
              .catch((error) =>
                console.error(
                  `Error deleting executions of job with id ${jobId}: ${error}`
                )
              );
          }
        })
        .catch((error) =>
          console.error(
            `Error fetching executions for job with id ${jobId}:`,
            error
          )
        );
    }
  };

  useEffect(() => {
    if (jobId && isEditing) {
      fetch(`http://localhost:8080/job/${jobId}`)
        .then((response) => response.json())
        .then((data) => {
          setOriginalJob(data);
          setJob(data);
          //console.log(data);
          setJobName(data.name);
          setJobDescription(data.description || "");
          setJobScript(data.command || "");
          setPeriodBegin(
            data.startDate ? new Date(Date.parse(data.startDate)) : null
          );
          setPeriodEnd(
            data.endDate ? new Date(Date.parse(data.endDate)) : null
          );

          setEnabled(data.status);
          setCronExpression(data.cronExpression);

          const [seconds, minutes, hours, dayOfMonth, month, dayOfWeek] =
            splitCronExpression(data.cronExpression);
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
      clearInputFields();
    }
  }, [jobId, isEditing, isOpen]);

  const hasChanges = () => {
    if (!originalJob) {
      return false;
    }
    return (
      originalJob.command !== jobScript ||
      originalJob.name !== jobName ||
      originalJob.description !== jobDescription ||
      (originalJob.startDate
        ? new Date(Date.parse(originalJob.startDate)).toISOString() !==
          periodBegin?.toISOString()
        : periodBegin) ||
      (originalJob.endDate
        ? new Date(Date.parse(originalJob.endDate)).toISOString() !==
          periodEnd?.toISOString()
        : periodEnd) ||
      originalJob.status !== enabled ||
      originalJob.cronExpression !== cronExpression
    );
  };

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
      } else {
        setHumanReadable("Invalid cron expression");
      }
    } catch (err) {
      setHumanReadable("Invalid cron expression");
    }
  }, [cronExpression]);

  // maybe TODO: add job_script/command as requi for isValid later on
  useEffect(() => {
    const isValid =
      jobName !== "" &&
      jobDescription !== "" &&
      periodBegin !== null &&
      seconds !== "" &&
      minutes !== "" &&
      hours !== "" &&
      dayOfMonth !== "" &&
      month !== "" &&
      dayOfWeek !== "" &&
      generateCronExpression() !== "Invalid cron expression";
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
    dayOfWeek,
  ]);

  useEffect(() => {
    setIsValidCron(humanReadable !== "Invalid cron expression");
  }, [humanReadable]);

  useEffect(() => {
    const newCronExpression = generateCronExpression();
    setCronExpression(newCronExpression);
  }, [seconds, minutes, hours, dayOfMonth, month, dayOfWeek]);

  function splitCronExpression(cronExpression) {
    const [seconds, minutes, hours, dayOfMonth, month, dayOfWeek] =
      cronExpression.split(" ");
    return [seconds, minutes, hours, dayOfMonth, month, dayOfWeek];
  }

  function generateCronExpression() {
    if (
      seconds !== "" &&
      minutes !== "" &&
      hours !== "" &&
      dayOfMonth !== "" &&
      month !== "" &&
      dayOfWeek !== ""
    ) {
      try {
        const cronString = `${seconds} ${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
        cronParser.parseExpression(cronString);
        return cronString;
      } catch (err) {
        setHumanReadable("Invalid cron expression");
        return "Invalid inputs";
      }
    }
  }

  function openConfirmDialog() {
    setShowConfirmDialog(true);
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeModal}
      contentLabel="Job Modal"
      style={{
        overlay: {
          backgroundColor: "rgba(44, 49, 58, 0.75)",
          zIndex: 5,
        },
        content: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "70%",
          width: "70%",
          backgroundColor: "#2c313a",
          color: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.25)",
        },
      }}
    >
      <div className="modal-header">
        <button
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            marginRight: 0,
          }}
          onClick={closeModal}
        >
          <MdClose />
        </button>
        <h1 style={{ margin: "5rem 0 3rem 0" }}>
          {isEditing ? "Edit Job" : "Create New Job"}
        </h1>
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
                placeholder="Job path and script to be executed"
              />
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
                maxLength={100}
                onChange={(e) =>
                  e.target.value.length <= 100 && setJobName(e.target.value)
                }
              />
            </div>
            <div className="input-row">
              <label htmlFor="jobDescription">Description:</label>
              <br />
              <textarea
                id="jobDescription"
                value={jobDescription}
                maxLength={1000}
                onChange={(e) =>
                  e.target.value.length <= 1000 &&
                  setJobDescription(e.target.value)
                }
                rows="4"
              />
            </div>
            <div className="date-picker-container">
              <label htmlFor="periodBegin">Period Begin:</label>
              <DatePicker
                className="date-picker"
                selected={periodBegin}
                onChange={(date) => setPeriodBegin(date)}
                showTimeInput="showTimeInput"
                timeInputLabel="Time:"
                dateFormat="MMMM d, yyyy HH:mm"
                // only dates in future
                minDate={new Date(Date.now())}
              />
              <br />
              <label htmlFor="periodEnd">Period End:</label>
              <DatePicker
                className="date-picker"
                selected={periodEnd}
                onChange={(date) => setPeriodEnd(date)}
                showTimeInput="showTimeInput"
                timeInputLabel="Time:"
                dateFormat="MMMM d, yyyy HH:mm"
                minDate={periodBegin}
              />
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
                  placeholder="*"
                />
              </div>
              <label htmlFor="minutes">Minutes:</label>
              <div className="cron-input-container">
                <input
                  type="text"
                  id="minutes"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="*"
                />
              </div>
              <label htmlFor="hours">Hours:</label>
              <div className="cron-input-container">
                <input
                  type="text"
                  id="hours"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="*"
                />
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
                  placeholder="*"
                />
              </div>
              <label htmlFor="month">Month:</label>
              <div className="cron-input-container">
                <input
                  type="text"
                  id="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  placeholder="*"
                />
              </div>
              <label htmlFor="dayOfWeek">Day of Week:</label>
              <div className="cron-input-container">
                <input
                  type="text"
                  id="dayOfWeek"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  placeholder="*"
                />
              </div>
            </div>
            <div className="cron-expression-container">
              {humanReadable === "Invalid cron expression" ? (
                <span>
                  <span>Cron Expression:</span>
                  <input
                    type="text"
                    id="cronExpression"
                    value={cronExpression ? cronExpression : ""}
                    onChange={(e) => setCronExpression(e.target.value)}
                  />
                </span>
              ) : (
                <span>
                  <span>Cron Expression:</span>
                  <input
                    type="text"
                    id="cronExpression"
                    value={cronExpression ? cronExpression : ""}
                    onChange={(e) => setCronExpression(e.target.value)}
                  />
                </span>
              )}
            </div>
            <div
              className="human-readable-container"
              style={{
                color:
                  humanReadable === "Invalid cron expression" ? "red" : "#ccc",
              }}
            >
              {humanReadable}
            </div>
          </div>
        </div>
        <br />
      </form>

      <div className="footer-button-container">
        <button
          type="submit"
          disabled={
            isEditing
              ? !isValid || !isValidCron || !hasChanges()
              : !isValid || !isValidCron
          }
          style={{
            backgroundColor: (
              isEditing
                ? isValid && isValidCron && hasChanges()
                : isValid && isValidCron
            )
              ? "white"
              : "#999",
            cursor: (
              isEditing
                ? isValid && isValidCron && hasChanges()
                : isValid && isValidCron
            )
              ? "pointer"
              : "default",
          }}
          onClick={(event) => {
            if (isEditing) {
              openConfirmDialog();
            } else {
              handleSubmit(event, isEditing);
            }
          }}
        >
          {isEditing ? "Edit" : "Create"}
        </button>
      </div>
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
            <p>When submitting this change:</p>
            <p style={{ margin: "0" }}>
              All past executions of this job will be deleted.
            </p>
            <div className="confirmation-dialog-buttons">
              <button
                className="confirm-delete-button"
                onClick={(event) => handleSubmit(event, isEditing)}
              >
                Edit job
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default JobModal;
