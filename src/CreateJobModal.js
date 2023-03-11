import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import './CreateJobModal.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";

const CreateJobModal = ({isOpen, closeModal}) => {
    const [jobName, setJobName] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [periodBegin, setPeriodBegin] = useState(null);
    const [periodEnd, setPeriodEnd] = useState(null);
    const [repeatInterval, setRepeatInterval] = useState(0);
    const [repeatUnit, setRepeatUnit] = useState("minute(s)");
    const [enabled, setEnabled] = useState(true);

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Handle form submission
    };

    const summary = () => {
      let summaryText = `Start on ${
        periodBegin ? periodBegin.toLocaleDateString() : ""
      }`;
      if(periodBegin){
        if (repeatInterval > 0) {
          if (periodEnd) {
            summaryText += ` until ${periodEnd.toLocaleDateString()}`;
          }
          summaryText += ` and repeat every ${repeatInterval} ${repeatUnit}`;
        } else {
          summaryText += ` and execute once`;
        }
      }
      if(!periodBegin){
        summaryText = "Please select a Period Begin."
      }
    
      
    
      return summaryText;
    }
    

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={closeModal}
            contentLabel="Create Job Modal"
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
            <h1>Create New Job</h1>
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
                            selected={periodBegin}
                            onChange={(date) => setPeriodBegin(date)}
                            showTimeSelect="showTimeSelect"
                            dateFormat="MMMM d, yyyy h:mm aa"/>
                        <br/>
                        <label htmlFor="periodEnd">Period End:</label>
                        <DatePicker
                            selected={periodEnd}
                            onChange={(date) => setPeriodEnd(date)}
                            showTimeSelect="showTimeSelect"
                            dateFormat="MMMM d, yyyy h:mm aa"/>
                    </div>
                    <div className="repeat-container">
                        <label htmlFor="repeatInterval">Repeat every:</label>
                        <input
                            type="number"
                            id="repeatInterval"
                            value={repeatInterval}
                            onChange={(e) => setRepeatInterval(e.target.value)}/>
                        <select
                            id="repeatUnit"
                            value={repeatUnit}
                            onChange={(e) => setRepeatUnit(e.target.value)}>
                            <option value="minute(s)">Minute(s)</option>
                            <option value="hours(s)">Hour(s)</option>
                            <option value="day(s)">Day(s)</option>
                            <option value="week(s)">Week(s)</option>
                            <option value="month(s)">Month(s)</option>
                            <option value="year(s)">Year(s)</option>
                        </select>
                        <div className="summary-container">
                            {summary()}
                        </div>
                    </div>
                </div>
                <br/>
                <div className="footer-button-container">
                    <button type="submit"
                        //code for creating job
                    >Create</button>
                    <button type="button" onClick={closeModal}>
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateJobModal;