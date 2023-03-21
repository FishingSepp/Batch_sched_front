import React, {useState, useEffect} from "react";
import Modal from "react-modal";
import './InfoModal.css';
import "react-datepicker/dist/react-datepicker.css";
import cronstrue from 'cronstrue';
import {MdClose} from 'react-icons/md';
import successIcon from './success-icon.png';
import failIcon from './fail-icon.png';

const InfoModal = ({isOpen, closeModal, jobId}) => {
    const [job, setJob] = useState({});
    const [jobName, setJobName] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [periodBegin, setPeriodBegin] = useState(null);
    const [periodEnd, setPeriodEnd] = useState(null);
    const [enabled, setEnabled] = useState(true);
    const [cronExpression, setCronExpression] = useState("");
    const [humanReadable, setHumanReadable] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [executions, setExecutions] = useState([]);
    const [expandedOutput, setExpandedOutput] = useState(null);
    
    const abbreviateText = (text, maxLength = 50) => {
        if (text.length <= maxLength) {
            return text;
        } else {
            return text.substring(0, maxLength) + "...";
        }
    };
    
    const handleOutputClick = (index) => {
        if (index === expandedOutput) {
            setExpandedOutput(null); 
        } else {
            setExpandedOutput(index);
        }
    };    

    useEffect(() => {
        if (isOpen) {
            setIsModalOpen(true);
            fetchExecutions(jobId);
        }
    }, [isOpen, jobId]);

    useEffect(() => {
        if (isModalOpen) {
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
                    setCronExpression(data.cronExpression);
                    cronstrue.toString(cronExpression);
                    setHumanReadable('"' + cronstrue.toString(cronExpression) + '"');

                    // Fetch executions for the job
                    fetch(`http://localhost:8080/execution/${jobId}`)
                        .then(
                            (response) => response.json()
                        )
                        .then((executions) => {
                            setExecutions(executions);
                        })
                        .catch((error) => console.error("Error fetching executions:", error));
                })
                .catch((error) => console.error("Error fetching job:", error));
        }
    }, [isModalOpen, jobId]);

    const fetchExecutions = (jobId) => {
        fetch(`http://localhost:8080/execution/${jobId}`)
            .then(
                (response) => response.json()
            )
            .then((data) => {
                console.log(data)
                setExecutions(data);
            })
            .catch((error) => console.error("Error fetching executions:", error));
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={closeModal}
            contentLabel="Info Modal"
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
                <h1>Job Info</h1>
            </div>
            <form style={{
                    width: "100%"
                }}>
                <div className="info-container">
                    <div className="name-container">
                        <label htmlFor="jobName">Name:</label>
                        <br/>
                        <span id="jobName">{
                                jobName
                                    ? jobName
                                    : "N/A"
                            }</span>
                    </div>
                    <div className="descr-container">
                        <label htmlFor="jobDescription">Description:</label>
                        <br/>
                        <span
                            id="jobDescription"
                            style={{
                                height: "63px"
                            }}>{
                                jobDescription
                                    ? jobDescription
                                    : "N/A"
                            }</span>
                    </div>
                    <div className="date-container">
                        <label htmlFor="periodBegin">Period Begin:</label>
                        <br/>
                        <span id="periodBegin">{
                                periodBegin
                                    ? periodBegin.toLocaleString()
                                    : ""
                            }</span>
                        <br/>
                        <label htmlFor="periodEnd">Period End:</label>
                        <br/>
                        <span id="periodEnd">{
                                periodEnd
                                    ? periodEnd.toLocaleString()
                                    : "N/A"
                            }</span>
                    </div>
                    <div
                        className="cron-expression-container"
                        style={{
                            color: "white",
                            fontSize: "16px"
                        }}>
                        <label htmlFor="cronExpression">Cron expression:</label>
                        <br/>
                        <span id="cronExpression">{
                                cronExpression
                                    ? cronExpression
                                    : "N/A"
                            }</span>
                    </div>
                </div>
                <div className="history-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Success</th>
                                <th>Date</th>
                                <th>Duration</th>
                                <th>Output</th>
                            </tr>
                        </thead>
                        <tbody className="history-body">
                            {executions.length > 0 ? (
                                executions
                                .slice(0, 10)
                                .map((execution) => (
                                    <React.Fragment key={execution.execution_id}>
                                    <tr>
                                      <td style={{ textAlign: "center" }}>
                                        {execution.success ? (
                                          <img src={successIcon} alt="Success" />
                                        ) : (
                                          <img src={failIcon} alt="Fail" />
                                        )}
                                      </td>
                                      <td>{new Date(execution.start_time).toLocaleString()}</td>
                                      <td>
                                        {execution.start_time && execution.end_time
                                          ? (
                                              (new Date(execution.end_time) -
                                                new Date(execution.start_time)) /
                                              1000
                                            ).toFixed(0) + " s"
                                          : "N/A"}
                                      </td>
                                      <td className="output-td" onClick={() => handleOutputClick(execution.execution_id)}>
                                        {abbreviateText(
                                          execution.output ? execution.output : "N/A",
                                          25
                                        )}
                                      </td>
                                    </tr>
                                    {expandedOutput === execution.execution_id && (
                                      <tr>
                                        <td colSpan={4}>
                                          <div className="output-expanded">
                                            <pre>{execution.output}</pre>
                                            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  ))) : (
    <tr>
      <td colSpan={4}>No executions stored or available</td>
    </tr>
  )}
            
                        </tbody>
                    </table>
                </div>
                <br/>
            </form>
        </Modal>
    );
};

export default InfoModal;
